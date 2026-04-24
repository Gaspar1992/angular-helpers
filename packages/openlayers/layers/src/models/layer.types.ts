// Layer types for @angular-helpers/openlayers/layers

import type { Coordinate, Extent, Feature, Layer, Style } from '@angular-helpers/openlayers/core';

export interface LayerConfig extends Layer {
  type: 'vector' | 'tile' | 'image';
  extent?: Extent;
  minResolution?: number;
  maxResolution?: number;
}

export interface VectorLayerConfig extends LayerConfig {
  type: 'vector';
  features?: Feature[];
  style?: Style | ((feature: Feature) => Style);
}

export interface TileLayerConfig extends LayerConfig {
  type: 'tile';
  source: SourceConfig;
}

export interface ImageLayerConfig extends LayerConfig {
  type: 'image';
  source: ImageSourceConfig;
}

export interface SourceConfig {
  type: 'osm' | 'xyz' | 'wms' | 'wmts';
  url?: string;
  attributions?: string | string[];
  params?: Record<string, unknown>;
}

export interface ImageSourceConfig {
  type: 'wms' | 'static';
  url: string;
  params?: Record<string, unknown>;
  imageExtent?: Extent;
}
