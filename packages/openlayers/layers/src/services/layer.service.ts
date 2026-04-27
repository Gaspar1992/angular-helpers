// OlLayerService

import { inject, Injectable, signal, computed } from '@angular/core';
import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorSource from 'ol/source/Vector';
import { Feature as OLFeature } from 'ol';
import { Circle as CircleGeom, LineString, Point, Polygon } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Icon, Stroke } from 'ol/style';
import type { Style as AbstractStyle } from '@angular-helpers/openlayers/core';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import ImageWMS from 'ol/source/ImageWMS';
import ImageStatic from 'ol/source/ImageStatic';
import type BaseLayer from 'ol/layer/Base';
import type OLMap from 'ol/Map';
import { OlMapService } from '@angular-helpers/openlayers/core';
import type {
  LayerConfig,
  VectorLayerConfig,
  TileLayerConfig,
  ImageLayerConfig,
} from '../models/layer.types';

/**
 * Internal property key used to stash the abstract style metadata on the
 * underlying `ol/Feature` so the layer style function can resolve a
 * per-feature visual without colliding with user `properties`.
 */
const STYLE_PROP = '__angular_helpers_style__';

export interface LayerInfo {
  id: string;
  type: 'vector' | 'tile' | 'image';
  visible: boolean;
  opacity: number;
  zIndex: number;
}

@Injectable()
export class OlLayerService {
  private mapService = inject(OlMapService);
  private layerCache = new Map<string, BaseLayer>();
  private pendingConfigs: LayerConfig[] = [];

  private layerState = signal<LayerInfo[]>([]);

  readonly layers = computed(() => this.layerState());

  readonly visibleLayers = computed(() => this.layerState().filter((l) => l.visible));

  readonly tileLayers = computed(() => this.layerState().filter((l) => l.type === 'tile'));

  readonly vectorLayers = computed(() => this.layerState().filter((l) => l.type === 'vector'));

  addLayer(config: LayerConfig): { id: string } {
    if (this.layerCache.has(config.id)) {
      return { id: config.id };
    }

    const map = this.mapService.getMap();
    if (!map) {
      this.pendingConfigs.push(config);
      this.mapService.onReady((readyMap) => this.flushPending(readyMap));
      return { id: config.id };
    }

    return this.createLayer(config, map);
  }

  private flushPending(map: OLMap): void {
    const pending = this.pendingConfigs.splice(0);
    for (const config of pending) {
      if (!this.layerCache.has(config.id)) {
        this.createLayer(config, map);
      }
    }
  }

  private createLayer(config: LayerConfig, map: OLMap): { id: string } {
    switch (config.type) {
      case 'vector':
        return this.createVectorLayer(config as VectorLayerConfig, map);
      case 'tile':
        return this.createTileLayer(config as TileLayerConfig, map);
      case 'image':
        return this.createImageLayer(config as ImageLayerConfig, map);
      default:
        return { id: config.id };
    }
  }

  getLayer(id: string): BaseLayer | undefined {
    return this.layerCache.get(id);
  }

  hasLayer(id: string): boolean {
    return this.layerCache.has(id);
  }

  removeLayer(id: string): void {
    // Cancel if it's still pending (map not ready yet)
    const pendingIdx = this.pendingConfigs.findIndex((c) => c.id === id);
    if (pendingIdx !== -1) {
      this.pendingConfigs.splice(pendingIdx, 1);
      return;
    }

    const map = this.mapService.getMap();
    const layer = this.layerCache.get(id);
    if (map && layer) {
      map.removeLayer(layer);
      this.layerCache.delete(id);
      this.updateLayerState();
    }
  }

  setVisibility(id: string, visible: boolean): void {
    const layer = this.layerCache.get(id);
    if (layer) {
      layer.setVisible(visible);
      this.updateLayerState();
    }
  }

  toggleVisibility(id: string): boolean {
    const layer = this.layerCache.get(id);
    if (layer) {
      const newVisible = !layer.getVisible();
      layer.setVisible(newVisible);
      this.updateLayerState();
      return newVisible;
    }
    return false;
  }

  setOpacity(id: string, opacity: number): void {
    const layer = this.layerCache.get(id);
    if (layer) {
      layer.setOpacity(opacity);
      this.updateLayerState();
    }
  }

  setZIndex(id: string, zIndex: number): void {
    const layer = this.layerCache.get(id);
    if (layer) {
      layer.setZIndex(zIndex);
      this.updateLayerState();
    }
  }

  isVisible(id: string): boolean {
    return this.layerCache.get(id)?.getVisible() ?? false;
  }

  getOpacity(id: string): number {
    return this.layerCache.get(id)?.getOpacity() ?? 1;
  }

  getZIndex(id: string): number {
    return this.layerCache.get(id)?.getZIndex() ?? 0;
  }

  /**
   * Clears all features from a vector layer's source.
   * Does not remove the layer itself.
   * @param id - Layer identifier
   */
  clearFeatures(id: string): void {
    const layer = this.layerCache.get(id);
    if (!(layer instanceof VectorLayer)) return;
    layer.getSource()?.clear();
  }

  /**
   * Updates the features of a vector layer.
   * Syncs new features without clearing existing ones (preserves OL modifications).
   * @param id - Layer identifier
   * @param features - New features to sync
   */
  updateFeatures(id: string, features: VectorLayerConfig['features']): void {
    const layer = this.layerCache.get(id);
    if (!(layer instanceof VectorLayer)) return;

    const source = layer.getSource();
    if (!source) return;

    // Get existing feature IDs from source
    const existingIds = new Set(
      source
        .getFeatures()
        .map((f) => f.getId())
        .filter((id): id is string | number => id !== undefined),
    );

    // Only add features that don't already exist in the source
    if (features && features.length > 0) {
      const newFeatures = features.filter((f) => !existingIds.has(f.id));

      if (newFeatures.length > 0) {
        const olFeatures = newFeatures.map((feature) => {
          const geom = feature.geometry;
          let geometry;

          // Validate coordinates exist before processing
          if (!geom.coordinates) {
            geometry = new Point([0, 0]);
          } else if (geom.type === 'Point') {
            const coords = geom.coordinates as [number, number];
            geometry = new Point(fromLonLat(coords));
          } else if (geom.type === 'LineString') {
            const coords = (geom.coordinates as [number, number][]).map((c) => fromLonLat(c));
            geometry = new LineString(coords);
          } else if (geom.type === 'Polygon') {
            const rings = (geom.coordinates as [number, number][][]).map((ring) =>
              ring.map((c) => fromLonLat(c)),
            );
            geometry = new Polygon(rings);
          } else if (geom.type === 'Circle') {
            const center = fromLonLat(geom.coordinates as [number, number]);
            // Approximate radius in meters - use 1000m as default if not specified
            geometry = new CircleGeom(center, (geom as { radius?: number }).radius ?? 1000);
          } else {
            geometry = new Point([0, 0]);
          }

          const olFeature = new OLFeature({
            geometry,
            ...feature.properties,
          });
          olFeature.setId(feature.id);
          return olFeature;
        });

        source.addFeatures(olFeatures);
      }
    }
  }

  private updateLayerState(): void {
    const layers: LayerInfo[] = [];
    this.layerCache.forEach((layer, id) => {
      const type =
        layer instanceof VectorLayer ? 'vector' : layer instanceof TileLayer ? 'tile' : 'image';
      layers.push({
        id,
        type: type as 'vector' | 'tile' | 'image',
        visible: layer.getVisible(),
        opacity: layer.getOpacity(),
        zIndex: layer.getZIndex() ?? 0,
      });
    });
    this.layerState.set(layers.sort((a, b) => a.zIndex - b.zIndex));
  }

  private createVectorLayer(config: VectorLayerConfig, map: OLMap): { id: string } {
    const source = new VectorSource();

    // Add features if provided
    if (config.features && config.features.length > 0) {
      const olFeatures = config.features.map((feature) => {
        const geom = feature.geometry;
        let geometry;

        // Validate coordinates exist before processing
        if (!geom.coordinates) {
          geometry = new Point([0, 0]);
        } else if (geom.type === 'Point') {
          // Transform from EPSG:4326 (lon/lat) to EPSG:3857 (map projection)
          const coords = geom.coordinates as [number, number];
          geometry = new Point(fromLonLat(coords));
        } else if (geom.type === 'LineString') {
          const coords = (geom.coordinates as [number, number][]).map((c) => fromLonLat(c));
          geometry = new LineString(coords);
        } else if (geom.type === 'Polygon') {
          const rings = (geom.coordinates as [number, number][][]).map((ring) =>
            ring.map((c) => fromLonLat(c)),
          );
          geometry = new Polygon(rings);
        } else if (geom.type === 'Circle') {
          const center = fromLonLat(geom.coordinates as [number, number]);
          geometry = new CircleGeom(center, (geom as { radius?: number }).radius ?? 1000);
        } else {
          geometry = new Point([0, 0]);
        }

        const olFeature = new OLFeature({
          geometry,
          ...feature.properties,
        });
        if (feature.style) {
          olFeature.set(STYLE_PROP, feature.style);
        }
        olFeature.setId(feature.id);
        return olFeature;
      });

      source.addFeatures(olFeatures);
    }

    // Default style for all geometry types (points, lines, polygons)
    const defaultStyle = new Style({
      fill: new Fill({ color: 'rgba(25, 118, 210, 0.3)' }),
      stroke: new Stroke({ color: '#1976d2', width: 2 }),
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: '#1976d2' }),
        stroke: new Stroke({ color: '#d32f2f', width: 2 }),
      }),
    });

    // Per-feature style resolver: features carrying `style.icon` (e.g. those
    // produced by `OlMilitaryService.createMilSymbol`) render as an Icon;
    // every other feature falls back to the default style.
    // Structural type avoids importing `FeatureLike` from `ol/Feature`;
    // tooling has been observed to auto-remove the unused-looking import.
    const styleFn = (olFeature: { get(key: string): unknown }): Style => {
      const abstractStyle = olFeature.get(STYLE_PROP) as AbstractStyle | undefined;
      const icon = abstractStyle?.icon;
      if (icon?.src) {
        return new Style({
          image: new Icon({
            src: icon.src,
            ...(icon.size ? { size: icon.size } : {}),
            ...(icon.anchor ? { anchor: icon.anchor } : {}),
          }),
        });
      }
      return defaultStyle;
    };

    const layer = new VectorLayer({
      source,
      visible: config.visible ?? true,
      opacity: config.opacity ?? 1,
      zIndex: config.zIndex,
      style: styleFn,
    });
    layer.set('id', config.id);
    map.addLayer(layer);
    this.layerCache.set(config.id, layer);
    this.updateLayerState();
    return { id: config.id };
  }

  private createTileLayer(config: TileLayerConfig, map: OLMap): { id: string } {
    let source;
    switch (config.source.type) {
      case 'osm':
        source = new OSM({ attributions: config.source.attributions });
        break;
      case 'xyz':
        source = new XYZ({ url: config.source.url, attributions: config.source.attributions });
        break;
      case 'wms':
        source = new TileWMS({
          url: config.source.url,
          params: config.source.params,
          attributions: config.source.attributions,
        });
        break;
      default:
        source = new OSM();
    }
    const layer = new TileLayer({
      source,
      visible: config.visible ?? true,
      opacity: config.opacity ?? 1,
      zIndex: config.zIndex,
    });
    layer.set('id', config.id);
    map.addLayer(layer);
    this.layerCache.set(config.id, layer);
    this.updateLayerState();
    return { id: config.id };
  }

  private createImageLayer(config: ImageLayerConfig, map: OLMap): { id: string } {
    let source;
    if (config.source.type === 'static') {
      source = new ImageStatic({
        url: config.source.url,
        imageExtent: config.source.imageExtent ?? [0, 0, 1, 1],
      });
    } else {
      source = new ImageWMS({ url: config.source.url, params: config.source.params });
    }
    const layer = new ImageLayer({
      source,
      visible: config.visible ?? true,
      opacity: config.opacity ?? 1,
      zIndex: config.zIndex,
    });
    layer.set('id', config.id);
    map.addLayer(layer);
    this.layerCache.set(config.id, layer);
    this.updateLayerState();
    return { id: config.id };
  }
}
