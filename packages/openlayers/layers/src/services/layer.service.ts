// OlLayerService

import { inject, Injectable, signal, computed } from '@angular/core';
import VectorLayer from 'ol/layer/Vector';
import HeatmapLayer from 'ol/layer/Heatmap';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorSource from 'ol/source/Vector';
import OLFeature from 'ol/Feature';
import { Circle as CircleGeom, LineString, Point, Polygon, type Geometry } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { getCenter } from 'ol/extent';
import { Style, Circle as CircleStyle, Fill, Icon, Stroke } from 'ol/style';
import Text from 'ol/style/Text';
import ClusterSource from 'ol/source/Cluster';
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
  HeatmapLayerConfig,
  AnyLayerConfig,
} from '../models/layer.types';

/**
 * Internal property key used to stash the abstract style metadata on the
 * underlying `ol/Feature` so the layer style function can resolve a
 * per-feature visual without colliding with user `properties`.
 */
const STYLE_PROP = '__angular_helpers_style__';

export interface LayerInfo {
  id: string;
  type: 'vector' | 'tile' | 'image' | 'heatmap';
  visible: boolean;
  opacity: number;
  zIndex: number;
}

@Injectable()
export class OlLayerService {
  private mapService = inject(OlMapService);
  private layerCache = new Map<string, BaseLayer>();
  private pendingConfigs: AnyLayerConfig[] = [];

  private layerState = signal<LayerInfo[]>([]);

  readonly layers = computed(() => this.layerState());

  readonly visibleLayers = computed(() => this.layerState().filter((l) => l.visible));

  readonly tileLayers = computed(() => this.layerState().filter((l) => l.type === 'tile'));

  readonly vectorLayers = computed(() => this.layerState().filter((l) => l.type === 'vector'));

  addLayer(config: AnyLayerConfig): { id: string } {
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

  private createLayer(config: AnyLayerConfig, map: OLMap): { id: string } {
    switch (config.type) {
      case 'vector':
        return this.createVectorLayer(config as VectorLayerConfig, map);
      case 'heatmap':
        return this.createHeatmapLayer(config as HeatmapLayerConfig, map);
      case 'tile':
        return this.createTileLayer(config as TileLayerConfig, map);
      case 'image':
        return this.createImageLayer(config as ImageLayerConfig, map);
      default:
        return { id: (config as AnyLayerConfig).id };
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
    } else {
      const pending = this.pendingConfigs.find((c) => c.id === id);
      if (pending) {
        pending.visible = visible;
      }
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
    } else {
      const pending = this.pendingConfigs.find((c) => c.id === id);
      if (pending) {
        pending.opacity = opacity;
      }
    }
  }

  setZIndex(id: string, zIndex: number): void {
    const layer = this.layerCache.get(id);
    if (layer) {
      layer.setZIndex(zIndex);
      this.updateLayerState();
    } else {
      const pending = this.pendingConfigs.find((c) => c.id === id);
      if (pending) {
        pending.zIndex = zIndex;
      }
    }
  }

  setHeatmapProperties(
    id: string,
    props: {
      blur?: number;
      radius?: number;
      weight?: string | ((feature: any) => number);
    },
  ): void {
    const layer = this.layerCache.get(id);
    if (layer instanceof HeatmapLayer) {
      if (props.blur !== undefined) layer.setBlur(props.blur);
      if (props.radius !== undefined) layer.setRadius(props.radius);
      if (props.weight !== undefined) layer.setWeight(props.weight);
    } else {
      const pending = this.pendingConfigs.find((c) => c.id === id);
      if (pending && pending.type === 'heatmap') {
        const heatmapConfig = pending as HeatmapLayerConfig;
        if (props.blur !== undefined) heatmapConfig.blur = props.blur;
        if (props.radius !== undefined) heatmapConfig.radius = props.radius;
        if (props.weight !== undefined) heatmapConfig.weight = props.weight;
      }
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
    const source = layer.getSource();
    if (!source) return;

    // Handle Cluster source: clear the underlying VectorSource
    const clusterSource = source as unknown as { getSource?: () => VectorSource };
    const vectorSource = clusterSource.getSource
      ? clusterSource.getSource()
      : (source as VectorSource);

    vectorSource?.clear();
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

    // Handle Cluster source: get the underlying VectorSource
    const clusterSource = source as unknown as { getSource?: () => VectorSource };
    const vectorSource = clusterSource.getSource
      ? clusterSource.getSource()
      : (source as VectorSource);

    if (!(vectorSource instanceof VectorSource)) return;

    // Get existing feature IDs from source
    const existingIds = new Set(
      vectorSource
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
          if (feature.style) {
            olFeature.set(STYLE_PROP, feature.style);
          }
          olFeature.setId(feature.id);
          return olFeature;
        });

        vectorSource.addFeatures(olFeatures);
      }
    }
  }

  private updateLayerState(): void {
    const layers: LayerInfo[] = [];
    this.layerCache.forEach((layer, id) => {
      let type = 'vector';
      if (layer instanceof HeatmapLayer) type = 'heatmap';
      else if (layer instanceof TileLayer) type = 'tile';
      else if (layer instanceof ImageLayer) type = 'image';

      layers.push({
        id,
        type: type as 'vector' | 'tile' | 'image' | 'heatmap',
        visible: layer.getVisible(),
        opacity: layer.getOpacity(),
        zIndex: layer.getZIndex() ?? 0,
      });
    });
    this.layerState.set(layers.sort((a, b) => a.zIndex - b.zIndex));
  }

  private createVectorLayer(config: VectorLayerConfig, map: OLMap): { id: string } {
    const vectorSource = new VectorSource();

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

      vectorSource.addFeatures(olFeatures);
    }

    // Wrap in cluster source if enabled
    const clusterCfg = config.cluster;
    const source = clusterCfg?.enabled
      ? new ClusterSource({
          source: vectorSource,
          distance: clusterCfg.distance ?? 40,
          minDistance: clusterCfg.minDistance ?? 20,
          geometryFunction: (feature) => {
            const geometry = feature.getGeometry();
            if (!geometry) return null;
            // For Point geometries, use as-is
            if (geometry.getType() === 'Point') {
              return geometry as Point;
            }
            // For other geometries (Polygon, Circle, etc.), use center point
            const extent = geometry.getExtent();
            const center = getCenter(extent);
            return new Point(center);
          },
        })
      : vectorSource;

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

    // Cluster style: shows count badge when features are clustered
    const clusterStyleFn = (olFeature: { get(key: string): unknown }): Style => {
      const features = olFeature.get('features') as unknown[] | undefined;
      const size = features?.length ?? 1;

      if (size > 1) {
        const showCount = clusterCfg?.showCount ?? true;
        return new Style({
          image: new CircleStyle({
            radius: 15 + Math.min(size * 2, 15),
            fill: new Fill({ color: 'rgba(255, 100, 100, 0.8)' }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
          }),
          text: showCount
            ? new Text({
                text: String(size),
                fill: new Fill({ color: '#fff' }),
              })
            : undefined,
        });
      }

      // Single feature: get the original feature from the cluster and use its style
      const originalFeatures = olFeature.get('features') as
        | Array<{ get(key: string): unknown; getGeometry?(): Geometry | undefined }>
        | undefined;
      const originalFeature = originalFeatures?.[0];
      if (originalFeature) {
        let styleToUse: Style | undefined;
        const abstractStyle = originalFeature.get(STYLE_PROP) as AbstractStyle | undefined;
        if (abstractStyle) {
          const style = new Style();
          const { icon, fill, stroke } = abstractStyle;
          if (icon?.src) {
            style.setImage(
              new Icon({
                src: icon.src,
                ...(icon.size ? { size: icon.size } : {}),
                ...(icon.anchor ? { anchor: icon.anchor } : {}),
              }),
            );
          }
          if (fill) {
            style.setFill(new Fill({ color: fill.color }));
          }
          if (stroke) {
            style.setStroke(new Stroke({ color: stroke.color, width: stroke.width }));
          }
          // If we mapped at least one property, return it, otherwise fallback
          if (icon?.src || fill || stroke) {
            styleToUse = style;
          }
        }

        if (!styleToUse) {
          styleToUse = defaultStyle.clone();
        }

        const origGeom = originalFeature.getGeometry?.();
        if (origGeom) {
          styleToUse.setGeometry(origGeom);
        }

        return styleToUse;
      }
      return defaultStyle;
    };

    // Per-feature style resolver: features carrying `style` render it.
    // Structural type avoids importing `FeatureLike` from `ol/Feature`;
    // tooling has been observed to auto-remove the unused-looking import.
    const styleFn = (olFeature: { get(key: string): unknown }): Style => {
      const abstractStyle = olFeature.get(STYLE_PROP) as AbstractStyle | undefined;
      if (abstractStyle) {
        const style = new Style();
        const { icon, fill, stroke } = abstractStyle;
        if (icon?.src) {
          style.setImage(
            new Icon({
              src: icon.src,
              ...(icon.size ? { size: icon.size } : {}),
              ...(icon.anchor ? { anchor: icon.anchor } : {}),
            }),
          );
        }
        if (fill) {
          style.setFill(new Fill({ color: fill.color }));
        }
        if (stroke) {
          style.setStroke(new Stroke({ color: stroke.color, width: stroke.width }));
        }
        if (icon?.src || fill || stroke) return style;
      }
      return defaultStyle;
    };

    const layer = new VectorLayer({
      source,
      visible: config.visible ?? true,
      opacity: config.opacity ?? 1,
      zIndex: config.zIndex,
      style: clusterCfg?.enabled ? clusterStyleFn : styleFn,
    });
    layer.set('id', config.id);
    map.addLayer(layer);
    this.layerCache.set(config.id, layer);
    this.updateLayerState();
    return { id: config.id };
  }

  private createHeatmapLayer(config: HeatmapLayerConfig, map: OLMap): { id: string } {
    const vectorSource = new VectorSource();

    if (config.features && config.features.length > 0) {
      const olFeatures = config.features.map((feature) => {
        const geom = feature.geometry;
        let geometry;

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

      vectorSource.addFeatures(olFeatures);
    }

    const layer = new HeatmapLayer({
      source: vectorSource,
      visible: config.visible ?? true,
      opacity: config.opacity ?? 1,
      zIndex: config.zIndex,
      ...(config.blur !== undefined && { blur: config.blur }),
      ...(config.radius !== undefined && { radius: config.radius }),
      ...(config.weight !== undefined && {
        weight: config.weight as string | ((feature: OLFeature) => number),
      }),
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
          params: config.source.params ?? {},
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
