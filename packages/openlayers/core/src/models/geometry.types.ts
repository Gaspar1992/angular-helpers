// Geometry types for @angular-helpers/openlayers/core

import type { Coordinate } from './types';

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
 * concentric circular hole.
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
