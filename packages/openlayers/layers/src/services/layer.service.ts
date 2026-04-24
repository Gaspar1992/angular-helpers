// OlLayerService

import { inject, Injectable } from '@angular/core';
import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import ImageWMS from 'ol/source/ImageWMS';
import type BaseLayer from 'ol/layer/Base';
import type OLMap from 'ol/Map';
import { OlMapService } from '@angular-helpers/openlayers/core';
import type {
  LayerConfig,
  VectorLayerConfig,
  TileLayerConfig,
  ImageLayerConfig,
} from '../models/layer.types';

@Injectable()
export class OlLayerService {
  private mapService = inject(OlMapService);
  private layerCache = new Map<string, BaseLayer>();

  addLayer(config: LayerConfig): { id: string } {
    const map = this.mapService.getMap();
    if (!map) {
      console.warn('Map not initialized');
      return { id: config.id };
    }
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

  removeLayer(id: string): void {
    const map = this.mapService.getMap();
    const layer = this.layerCache.get(id);
    if (map && layer) {
      map.removeLayer(layer);
      this.layerCache.delete(id);
    }
  }

  setVisibility(id: string, visible: boolean): void {
    this.layerCache.get(id)?.setVisible(visible);
  }
  setOpacity(id: string, opacity: number): void {
    this.layerCache.get(id)?.setOpacity(opacity);
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
    return { id: config.id };
  }

  private createImageLayer(config: ImageLayerConfig, map: OLMap): { id: string } {
    const source = new ImageWMS({ url: config.source.url, params: config.source.params });
    const layer = new ImageLayer({
      source,
      visible: config.visible ?? true,
      opacity: config.opacity ?? 1,
      zIndex: config.zIndex,
    });
    layer.set('id', config.id);
    map.addLayer(layer);
    this.layerCache.set(config.id, layer);
    return { id: config.id };
  }
}
