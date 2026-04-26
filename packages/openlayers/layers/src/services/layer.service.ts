// OlLayerService

import { inject, Injectable, signal, computed } from '@angular/core';
import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import ImageWMS from 'ol/source/ImageWMS';
import { ImageStatic } from 'ol/source';
import type BaseLayer from 'ol/layer/Base';
import type OLMap from 'ol/Map';
import { OlMapService } from '@angular-helpers/openlayers/core';
import type {
  LayerConfig,
  VectorLayerConfig,
  TileLayerConfig,
  ImageLayerConfig,
} from '../models/layer.types';

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
    const layer = new VectorLayer({
      source: new VectorSource(),
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
