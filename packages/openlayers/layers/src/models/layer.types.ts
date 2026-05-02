// Layer types for @angular-helpers/openlayers/layers

import type { Extent, Feature, Layer, Style } from '@angular-helpers/openlayers/core';

export interface LayerConfig extends Layer {
  type: 'vector' | 'tile' | 'image' | 'heatmap';
  extent?: Extent;
  minResolution?: number;
  maxResolution?: number;
}

export interface ClusterConfig {
  /** Enable clustering (default: false) */
  enabled: boolean;
  /** Distance in pixels within which features will be clustered (default: 40) */
  distance?: number;
  /** Minimum distance between clusters (default: 20) */
  minDistance?: number;
  /** Show count badge on cluster (default: true) */
  showCount?: boolean;
  /** Style for individual features when clustering */
  featureStyle?: Style;
}

export interface VectorLayerConfig extends LayerConfig {
  type: 'vector';
  features?: Feature[];
  style?: Style | ((feature: Feature) => Style);
  cluster?: ClusterConfig;
}

export interface HeatmapLayerConfig extends LayerConfig {
  type: 'heatmap';
  features?: Feature[];
  weight?: string | ((feature: Feature) => number);
  blur?: number;
  radius?: number;
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
