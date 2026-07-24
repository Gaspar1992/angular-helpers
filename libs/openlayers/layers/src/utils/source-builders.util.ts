import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import ImageWMS from 'ol/source/ImageWMS';
import ImageStatic from 'ol/source/ImageStatic';
import type { SourceConfig, ImageSourceConfig } from '../models/layer.types';

export function buildTileSource(config: SourceConfig) {
  switch (config.type) {
    case 'osm':
      return new OSM({ attributions: config.attributions });
    case 'xyz':
      return new XYZ({ url: config.url, attributions: config.attributions });
    case 'wms':
      return new TileWMS({
        url: config.url,
        params: config.params ?? {},
        attributions: config.attributions,
      });
    default:
      return new OSM();
  }
}

export function buildImageSource(config: ImageSourceConfig) {
  if (config.type === 'static') {
    return new ImageStatic({
      url: config.url,
      imageExtent: config.imageExtent ?? [0, 0, 1, 1],
    });
  }
  return new ImageWMS({ url: config.url, params: config.params });
}
