// Basemap switcher types for @angular-helpers/openlayers/controls

/**
 * Configuration for a basemap (background layer)
 */
export interface BasemapConfig {
  /** Unique identifier for the basemap */
  id: string;
  /** Display name for the basemap */
  name: string;
  /** Type of tile source */
  type: 'osm' | 'xyz' | 'wms';
  /** URL template for XYZ/WMS sources */
  url?: string;
  /** Additional parameters for WMS requests */
  params?: Record<string, unknown>;
  /** Attribution text */
  attributions?: string | string[];
  /** Optional icon/emoji */
  icon?: string;
}

/**
 * Position options for the basemap switcher control
 */
export type BasemapSwitcherPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';
