// Feature conversion utilities for OpenLayers interactions

import FeatureClass from 'ol/Feature';
import type { Feature as OLFeature } from 'ol';
import type { Feature, Coordinate } from '../models/types';

/**
 * Converts an OpenLayers feature to the internal Feature format.
 * Handles coordinate extraction and geometry type mapping.
 *
 * @param olFeature - The OpenLayers feature to convert
 * @returns The converted Feature with normalized structure
 */
import { Point, LineString, Polygon } from 'ol/geom';
import { transform } from 'ol/proj';

export interface ProjectionOptions {
  sourceProjection?: string;
  targetProjection?: string;
}

function transformCoords(
  coords: any,
  sourceProj: string | undefined,
  targetProj: string | undefined,
): any {
  if (!sourceProj || !targetProj || sourceProj === targetProj) return coords;
  if (!Array.isArray(coords)) return coords;

  if (typeof coords[0] === 'number') {
    return transform(coords as [number, number], sourceProj, targetProj);
  }

  return coords.map((c) => transformCoords(c, sourceProj, targetProj));
}

/**
 * Converts an OpenLayers feature to the internal Feature format.
 * Handles coordinate extraction and geometry type mapping with custom projections.
 *
 * @param olFeature - The OpenLayers feature to convert
 * @param options - Projection source and target codes
 * @returns The converted Feature with normalized structure
 */
export function olFeatureToFeature(olFeature: OLFeature, options?: ProjectionOptions): Feature {
  // Unwrap spider features
  const spiderFeature = olFeature.get('spider-feature') as OLFeature | undefined;
  if (spiderFeature) {
    return olFeatureToFeature(spiderFeature, options);
  }

  // Unwrap single-item clusters
  const clusterFeatures = olFeature.get('features');
  if (Array.isArray(clusterFeatures) && clusterFeatures.length === 1) {
    return olFeatureToFeature(clusterFeatures[0] as OLFeature, options);
  }

  const geometry = olFeature.getGeometry();
  const geomType = geometry?.getType() ?? 'Point';

  const sourceProj = options?.targetProjection;
  const targetProj = options?.sourceProjection;

  // Convert coordinates based on geometry type
  let coordinates: Coordinate | Coordinate[] | Coordinate[][];

  if (geomType === 'Circle') {
    // ol/geom/Circle has no getCoordinates() — use getCenter() instead
    const circle = geometry as unknown as { getCenter(): number[]; getRadius(): number };
    coordinates = transformCoords(circle.getCenter(), sourceProj, targetProj) as Coordinate;
  } else {
    // oxlint-disable-next-line no-explicit-any
    const olCoords = (geometry as unknown as { getCoordinates(): unknown }).getCoordinates();
    coordinates = transformCoords(olCoords, sourceProj, targetProj) as any;
  }

  return {
    id: olFeature.getId()?.toString() ?? `feature-${Math.random().toString(36).slice(2)}`,
    geometry: {
      type: geomType as Feature['geometry']['type'],
      coordinates,
    },
    properties: olFeature.getProperties(),
  };
}

/**
 * Converts an internal Feature to an OpenLayers feature.
 */
export function featureToOlFeature(feature: Feature, options?: ProjectionOptions): OLFeature {
  const sourceProj = options?.sourceProjection ?? 'EPSG:4326';
  const targetProj = options?.targetProjection ?? 'EPSG:3857';

  const geom = feature.geometry;
  let geometry;

  if (!geom.coordinates) {
    geometry = new Point([0, 0]);
  } else if (geom.type === 'Point') {
    const coords = geom.coordinates as [number, number];
    geometry = new Point(transformCoords(coords, sourceProj, targetProj));
  } else if (geom.type === 'LineString') {
    const coords = transformCoords(geom.coordinates, sourceProj, targetProj);
    geometry = new LineString(coords);
  } else if (geom.type === 'Polygon') {
    const rings = transformCoords(geom.coordinates, sourceProj, targetProj);
    geometry = new Polygon(rings);
  } else {
    geometry = new Point([0, 0]);
  }

  // Create OL Feature
  // Note: we must avoid passing 'geometry' as a plain object to OLFeature constructor,
  // so we pass the object properties without it, then set geometry explicitly.
  const props = { ...feature.properties };
  delete props['geometry']; // Just in case

  const olFeature = new FeatureClass(props);
  olFeature.setGeometry(geometry);
  olFeature.setId(feature.id);

  return olFeature;
}
