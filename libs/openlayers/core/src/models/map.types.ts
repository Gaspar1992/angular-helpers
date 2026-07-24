// Map service types for @angular-helpers/openlayers/core

import type { Coordinate } from './types';

/**
 * Options for animating the map view.
 */
export interface AnimationOptions {
  /** Target center coordinate */
  center?: Coordinate;
  /** Target zoom level */
  zoom?: number;
  /** Target rotation in radians */
  rotation?: number;
  /** Animation duration in milliseconds */
  duration?: number;
}

/**
 * Options for fitting the view to an extent.
 */
export interface FitOptions {
  /** Padding around the extent [top, right, bottom, left] */
  padding?: [number, number, number, number];
  /** Maximum zoom level to use */
  maxZoom?: number;
  /** Animation duration in milliseconds */
  duration?: number;
}

/**
 * Configuration options for the map view.
 */
export interface MapViewOptions {
  /** Initial center coordinate */
  center?: Coordinate;
  /** Initial zoom level */
  zoom?: number;
  /** Minimum allowed zoom */
  minZoom?: number;
  /** Maximum allowed zoom */
  maxZoom?: number;
  /** Initial rotation in radians */
  rotation?: number;
  /** Map projection (e.g., 'EPSG:3857') */
  projection?: string;
}
