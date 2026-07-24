// Core types for @angular-helpers/openlayers/core

export type Coordinate = [number, number];
export type Extent = [number, number, number, number];
export type Pixel = [number, number];
export type FeatureId = string;

export interface Feature {
  id: FeatureId;
  geometry: Geometry;
  properties?: Record<string, unknown>;
  style?: Style;
}

export type GeometryType = 'Point' | 'LineString' | 'Polygon' | 'Circle' | 'Ellipse' | 'Sector';

export interface Geometry {
  type: GeometryType;
  coordinates: Coordinate | Coordinate[] | Coordinate[][];
}

export interface Style {
  fill?: { color?: string };
  stroke?: { color?: string; width?: number };
  image?: {
    radius?: number;
    fill?: { color?: string };
    stroke?: { color?: string; width?: number };
  };
  /**
   * Icon style for Point features. When set, renderers should produce an
   * `ol/style/Icon` with the given source. Used by the military symbology
   * helpers to embed `milsymbol`-generated SVGs as data URLs.
   */
  icon?: {
    /** Image source — typically a `data:image/svg+xml;base64,...` URL */
    src: string;
    /** Pixel size `[width, height]` */
    size?: [number, number];
    /**
     * Anchor in fractional coordinates `[x, y]` where `0..1` is the icon
     * extent. `[0.5, 0.5]` centers the icon on the feature.
     */
    anchor?: [number, number];
  };
  text?: {
    text?: string;
    font?: string;
    fill?: { color?: string };
    stroke?: { color?: string; width?: number };
  };
}

export interface Layer {
  id: string;
  visible?: boolean;
  opacity?: number;
  zIndex?: number;
}

export interface ViewState {
  center: Coordinate;
  zoom: number;
  rotation?: number;
}

export type ProjectionCode = 'EPSG:4326' | 'EPSG:3857' | string;

export interface MapConfig {
  target?: string | HTMLElement;
  view?: Partial<ViewState>;
  projection?: ProjectionCode;
}
