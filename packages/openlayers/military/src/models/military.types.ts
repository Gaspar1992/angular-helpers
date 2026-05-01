// Public types for @angular-helpers/openlayers/military

import type { Coordinate } from '@angular-helpers/openlayers/core';

/**
 * Configuration for an ellipse polygon centered at `center`.
 * Coordinates are emitted in EPSG:4326 (lon/lat) using a local tangent-plane
 * approximation; accuracy degrades for radii > ~100 km or near the poles.
 */
export interface EllipseConfig {
  /** Ellipse center as `[lon, lat]` in EPSG:4326. */
  center: Coordinate;
  /** Semi-major axis in meters. Must be > 0. */
  semiMajor: number;
  /** Semi-minor axis in meters. Must be > 0. */
  semiMinor: number;
  /**
   * Rotation in radians, counter-clockwise from East. Default: 0
   * (semi-major axis points East).
   */
  rotation?: number;
  /**
   * Number of vertices used to approximate the ellipse. Default: 64.
   * Minimum: 8.
   */
  segments?: number;
  /** Custom feature properties to attach to the output feature. */
  properties?: Record<string, unknown>;
}

/**
 * Configuration for a circular sector (pie-slice) polygon.
 * Same projection caveats as `EllipseConfig`.
 */
export interface SectorConfig {
  /** Sector apex / center as `[lon, lat]` in EPSG:4326. */
  center: Coordinate;
  /** Sector radius in meters. Must be > 0. */
  radius: number;
  /** Start angle in radians (0 = East, CCW positive). */
  startAngle: number;
  /**
   * End angle in radians. Must satisfy `startAngle < endAngle <= startAngle + 2π`.
   */
  endAngle: number;
  /**
   * Number of vertices along the arc. Default: 32. Minimum: 4. The output
   * polygon has `segments + 3` vertices (apex + arc + apex closer).
   */
  segments?: number;
  /** Custom feature properties to attach to the output feature. */
  properties?: Record<string, unknown>;
}

/**
 * Configuration for a donut (annular ring) polygon — a disk with a
 * concentric circular hole. Useful for range rings, exclusion zones,
 * and similar GIS military primitives.
 *
 * The output `Feature<Polygon>` has TWO rings: an outer ring (CCW) and
 * an inner ring (CW per the GeoJSON right-hand rule), so renderers that
 * follow the spec fill only the band between the radii.
 */
export interface DonutConfig {
  /** Donut center as `[lon, lat]` in EPSG:4326. */
  center: Coordinate;
  /** Outer radius in meters. Must be > `innerRadius`. */
  outerRadius: number;
  /** Inner radius in meters. Must be > 0 and < `outerRadius`. */
  innerRadius: number;
  /**
   * Number of vertices per ring. Default: 64. Minimum: 8. Both rings use
   * the same segment count.
   */
  segments?: number;
  /** Custom feature properties to attach to the output feature. */
  properties?: Record<string, unknown>;
}

/**
 * Subset of `milsymbol`'s `SymbolOptions` exposed by this package.
 * `sidc` is the only required field; everything else is optional and
 * forwarded verbatim to `new Symbol(sidc, options)`.
 */
export interface MilSymbolConfig {
  /** MIL-STD-2525 SIDC code. Required. */
  sidc: string;
  /** Symbol position as `[lon, lat]` in EPSG:4326. Required. */
  position: Coordinate;
  /** Symbol size in pixels. Default (set by `milsymbol`): 30. */
  size?: number;
  /** Mono-color override (e.g. `'#000'`). */
  monoColor?: string;
  /** Outline color. */
  outlineColor?: string;
  /** Icon (interior glyph) color. */
  iconColor?: string;
  /** Additional information field (top of the symbol). */
  additionalInformation?: string;
  /** Staff comments field. */
  staffComments?: string;
  /** Quantity field. */
  quantity?: number;
  /** Unique designation field (unit identifier). */
  uniqueDesignation?: string;
  /** Custom feature properties merged into the output feature's `properties`. */
  properties?: Record<string, unknown>;
}

/**
 * Result of resolving a `MilSymbolConfig` against `milsymbol`. Embedded
 * into the output feature's `style.icon` so that `<ol-vector-layer>` can
 * render it as an `ol/style/Icon`.
 */
export interface MilSymbolStyleResult {
  /** `data:image/svg+xml;base64,...` URL produced from `Symbol.asSVG()`. */
  src: string;
  /** Pixel `[width, height]` from `Symbol.getSize()`. */
  size: [number, number];
  /**
   * Anchor in fractional coordinates `[x, y]` (0..1), computed from
   * `Symbol.getAnchor()` divided by the size. `[0.5, 0.5]` centers the
   * icon on the feature.
   */
  anchor: [number, number];
}
