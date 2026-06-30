import { inject, Injectable, signal, computed } from '@angular/core';
import VectorLayer from 'ol/layer/Vector';
import HeatmapLayer from 'ol/layer/Heatmap';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorSource from 'ol/source/Vector';
import ClusterSource from 'ol/source/Cluster';
import GeoJSON from 'ol/format/GeoJSON';
import TopoJSON from 'ol/format/TopoJSON';
import KML from 'ol/format/KML';
import FeatureFormat from 'ol/format/Feature';
import { getCenter } from 'ol/extent';
import { Point } from 'ol/geom';
import type BaseLayer from 'ol/layer/Base';
import type OLMap from 'ol/Map';
import { OlMapService, featureToOlFeature, OlZoneHelper } from '@angular-helpers/openlayers/core';
import type {
  VectorLayerConfig,
  TileLayerConfig,
  ImageLayerConfig,
  HeatmapLayerConfig,
  AnyLayerConfig,
} from '../models/layer.types';

import { buildTileSource, buildImageSource } from '../utils/source-builders.util';
import {
  buildVectorLayer,
  buildHeatmapLayer,
  buildTileLayer,
  buildImageLayer,
} from '../utils/layer-builders.util';
import { SpiderficationManager } from '../utils/spiderfication.manager';

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
  private zoneHelper = inject(OlZoneHelper);
  private layerCache = new Map<string, BaseLayer>();
  private pendingConfigs: AnyLayerConfig[] = [];
  private layerState = signal<LayerInfo[]>([]);
  private spiderManager = new SpiderficationManager(this.layerCache);

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

  private createVectorSource(config: VectorLayerConfig, _map: OLMap): VectorSource {
    const sourceOptions: { url?: string; format?: any } = {};

    if (config.url && config.format) {
      sourceOptions.url = config.url;
    }

    if (config.format) {
      if (config.format instanceof FeatureFormat) {
        sourceOptions.format = config.format;
      } else if (config.format === 'geojson') {
        sourceOptions.format = new GeoJSON();
      } else if (config.format === 'topojson') {
        sourceOptions.format = new TopoJSON();
      } else if (config.format === 'kml') {
        sourceOptions.format = new KML();
      }
    }

    return new VectorSource(sourceOptions);
  }

  private createLayer(config: AnyLayerConfig, map: OLMap): { id: string } {
    let layer: BaseLayer;

    this.zoneHelper.runOutsideAngular(() => {
      switch (config.type) {
        case 'vector': {
          const vConfig = config as VectorLayerConfig;
          const vectorSource = this.createVectorSource(vConfig, map);

          const targetProj =
            (typeof map.getView === 'function'
              ? map.getView()?.getProjection()?.getCode()
              : undefined) ?? 'EPSG:3857';
          const sourceProj = vConfig.coordinateProjection ?? 'EPSG:4326';

          if (vConfig.features && vConfig.features.length > 0) {
            const olFeatures = vConfig.features.map((f) => {
              const olf = featureToOlFeature(f, {
                sourceProjection: sourceProj,
                targetProjection: targetProj,
              });
              if (f.style) olf.set(STYLE_PROP, f.style);
              return olf;
            });
            vectorSource.addFeatures(olFeatures);
          }

          const clusterCfg = vConfig.cluster;
          const source = clusterCfg?.enabled
            ? new ClusterSource({
                source: vectorSource,
                distance: clusterCfg.distance ?? 40,
                minDistance: clusterCfg.minDistance ?? 20,
                geometryFunction: (feature) => {
                  const geometry = feature.getGeometry();
                  if (!geometry) return null;
                  if (geometry.getType() === 'Point') return geometry as Point;
                  return new Point(getCenter(geometry.getExtent()));
                },
              })
            : vectorSource;

          layer = buildVectorLayer(vConfig, source);
          if (clusterCfg?.spiderfyOnSelect) {
            this.spiderManager.register(map);
          }
          break;
        }
        case 'heatmap':
          layer = buildHeatmapLayer(config as HeatmapLayerConfig);
          break;
        case 'tile': {
          const tConfig = config as TileLayerConfig;
          const source = buildTileSource(tConfig.source);
          layer = buildTileLayer(tConfig, source);
          break;
        }
        case 'image': {
          const iConfig = config as ImageLayerConfig;
          const source = buildImageSource(iConfig.source);
          layer = buildImageLayer(iConfig, source);
          break;
        }
        default:
          break;
      }

      if (layer) {
        map.addLayer(layer);
        this.layerCache.set(config.id, layer);
      }
    });

    if (!this.layerCache.has(config.id)) {
      return { id: config.id };
    }

    this.updateLayerState();
    return { id: config.id };
  }

  getLayer(id: string): BaseLayer | undefined {
    return this.layerCache.get(id);
  }

  hasLayer(id: string): boolean {
    return this.layerCache.has(id);
  }

  removeLayer(id: string): void {
    const pendingIdx = this.pendingConfigs.findIndex((c) => c.id === id);
    if (pendingIdx !== -1) {
      this.pendingConfigs.splice(pendingIdx, 1);
      return;
    }

    const map = this.mapService.getMap();
    const layer = this.layerCache.get(id);
    if (map && layer) {
      this.zoneHelper.runOutsideAngular(() => {
        map.removeLayer(layer);

        // Explicitly dispose sources to prevent memory leaks
        if ('getSource' in layer) {
          const source = (layer as any).getSource();
          if (source) {
            // If it's a ClusterSource, dispose the underlying source first
            if ('getSource' in source && typeof (source as any).getSource === 'function') {
              const underlyingSource = (source as any).getSource();
              if (underlyingSource && typeof underlyingSource.dispose === 'function') {
                if (typeof underlyingSource.clear === 'function') {
                  underlyingSource.clear(true);
                }
                underlyingSource.dispose();
              }
            }
            if (typeof source.dispose === 'function') {
              if (typeof source.clear === 'function') {
                source.clear(true);
              }
              source.dispose();
            }
          }
        }

        layer.dispose();
      });
      this.layerCache.delete(id);
      this.updateLayerState();
    }
  }

  updateVectorLayerConfig(id: string, config: Partial<VectorLayerConfig>): void {
    const layer = this.layerCache.get(id);
    if (!(layer instanceof VectorLayer)) return;

    const oldSource = layer.getSource();
    const map = this.mapService.getMap();
    const nextConfig = {
      ...(layer.get('cluster-config') ? { cluster: layer.get('cluster-config') } : {}),
      ...(layer.get('style-fn') !== undefined ? { style: layer.get('style-fn') } : {}),
      ...config,
    } as VectorLayerConfig;

    let nextSource: VectorSource;
    let clusterSource: ClusterSource | undefined;

    this.zoneHelper.runOutsideAngular(() => {
      nextSource = this.createVectorSource(nextConfig, map ?? ({} as OLMap));
      const clusterCfg = nextConfig.cluster;
      if (clusterCfg?.enabled) {
        clusterSource = new ClusterSource({
          source: nextSource,
          distance: clusterCfg.distance ?? 40,
          minDistance: clusterCfg.minDistance ?? 20,
          geometryFunction: (feature) => {
            const geometry = feature.getGeometry();
            if (!geometry) return null;
            if (geometry.getType() === 'Point') return geometry as Point;
            return new Point(getCenter(geometry.getExtent()));
          },
        });
      }
    });

    if (clusterSource) {
      layer.setSource(clusterSource);
    } else {
      layer.setSource(nextSource!);
    }

    if (oldSource) {
      this.zoneHelper.runOutsideAngular(() => {
        if ('getSource' in oldSource && typeof (oldSource as any).getSource === 'function') {
          const underlying = (oldSource as any).getSource();
          if (underlying && typeof underlying.dispose === 'function') {
            if (typeof underlying.clear === 'function') underlying.clear(true);
            underlying.dispose();
          }
        }
        if (typeof oldSource.dispose === 'function') {
          if (typeof oldSource.clear === 'function') oldSource.clear(true);
          oldSource.dispose();
        }
      });
    }

    layer.set('coordinate-projection', nextConfig.coordinateProjection ?? 'EPSG:4326');
    this.updateFeatures(id, nextConfig.features ?? []);
    this.updateLayerState();
  }

  setVisibility(id: string, visible: boolean): void {
    const layer = this.layerCache.get(id);
    if (layer) {
      layer.setVisible(visible);
      this.updateLayerState();
    } else {
      const pending = this.pendingConfigs.find((c) => c.id === id);
      if (pending) pending.visible = visible;
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
      if (pending) pending.opacity = opacity;
    }
  }

  setZIndex(id: string, zIndex: number): void {
    const layer = this.layerCache.get(id);
    if (layer) {
      layer.setZIndex(zIndex);
      this.updateLayerState();
    } else {
      const pending = this.pendingConfigs.find((c) => c.id === id);
      if (pending) pending.zIndex = zIndex;
    }
  }

  setClusterDistance(id: string, distance: number): void {
    const layer = this.layerCache.get(id);
    if (layer instanceof VectorLayer) {
      const source = layer.getSource();
      if (source && 'setDistance' in source) {
        (source as ClusterSource).setDistance(distance);
      }
    }
  }

  setClusterMinDistance(id: string, minDistance: number): void {
    const layer = this.layerCache.get(id);
    if (layer instanceof VectorLayer) {
      const source = layer.getSource();
      if (source && 'setMinDistance' in source) {
        (source as ClusterSource).setMinDistance(minDistance);
      }
    }
  }

  setHeatmapProperties(
    id: string,
    props: { blur?: number; radius?: number; weight?: string | ((feature: any) => number) },
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

  clearFeatures(id: string): void {
    const layer = this.layerCache.get(id);
    if (!(layer instanceof VectorLayer)) return;
    const source = layer.getSource();
    if (!source) return;

    const clusterSource = source as unknown as { getSource?: () => VectorSource };
    const vectorSource = clusterSource.getSource
      ? clusterSource.getSource()
      : (source as VectorSource);

    vectorSource?.clear();
  }

  updateFeatures(id: string, features: VectorLayerConfig['features']): void {
    const layer = this.layerCache.get(id);
    if (!(layer instanceof VectorLayer)) return;

    const sourceProj = layer.get('coordinate-projection') ?? 'EPSG:4326';
    const map = this.mapService.getMap();
    const targetProj =
      (map && typeof map.getView === 'function'
        ? map.getView()?.getProjection()?.getCode()
        : undefined) ?? 'EPSG:3857';

    const source = layer.getSource();
    if (!source) return;

    const clusterSource = source as unknown as { getSource?: () => VectorSource };
    const vectorSource = clusterSource.getSource
      ? clusterSource.getSource()
      : (source as VectorSource);

    if (!(vectorSource instanceof VectorSource)) return;

    if (features) {
      const newFeatureIds = new Set<string | number>(features.map((f) => f.id));
      const sourceFeatures = vectorSource.getFeatures();

      sourceFeatures.forEach((f) => {
        const fId = f.getId();
        if (fId !== undefined && !newFeatureIds.has(fId)) {
          vectorSource.removeFeature(f);
        }
      });

      const existingIds = new Set(
        vectorSource
          .getFeatures()
          .map((f) => f.getId())
          .filter((fId): fId is string | number => fId !== undefined),
      );

      const featuresToAdd = features.filter((f) => !existingIds.has(f.id));

      if (featuresToAdd.length > 0) {
        const olFeatures = featuresToAdd.map((f) => {
          const olf = featureToOlFeature(f, {
            sourceProjection: sourceProj,
            targetProjection: targetProj,
          });
          if (f.style) olf.set(STYLE_PROP, f.style);
          return olf;
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
}
