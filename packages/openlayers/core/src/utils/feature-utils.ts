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
export function olFeatureToFeature(olFeature: OLFeature): Feature {
  // Unwrap spider features
  const spiderFeature = olFeature.get('spider-feature') as OLFeature | undefined;
  if (spiderFeature) {
    return olFeatureToFeature(spiderFeature);
  }

  // Unwrap single-item clusters
  const clusterFeatures = olFeature.get('features');
  if (Array.isArray(clusterFeatures) && clusterFeatures.length === 1) {
    return olFeatureToFeature(clusterFeatures[0] as OLFeature);
  }

  const geometry = olFeature.getGeometry();
  const geomType = geometry?.getType() ?? 'Point';

  // Convert coordinates based on geometry type
  let coordinates: Coordinate | Coordinate[] | Coordinate[][];

  if (geomType === 'Circle') {
    // ol/geom/Circle has no getCoordinates() — use getCenter() instead
    const circle = geometry as unknown as { getCenter(): number[]; getRadius(): number };
    coordinates = circle.getCenter() as Coordinate;
  } else {
    // oxlint-disable-next-line no-explicit-any
    const olCoords = (geometry as unknown as { getCoordinates(): unknown }).getCoordinates();
    if (Array.isArray(olCoords) && Array.isArray(olCoords[0])) {
      // Multi-coordinate structures (LineString, Polygon, etc.)
      coordinates = olCoords as Coordinate[] | Coordinate[][];
    } else {
      // Single point
      coordinates = olCoords as Coordinate;
    }
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

import { Point, LineString, Polygon } from 'ol/geom';
import { fromLonLat } from 'ol/proj';

/**
 * Converts an internal Feature to an OpenLayers feature.
 */
export function featureToOlFeature(feature: Feature): OLFeature {
  const geom = feature.geometry;
  let geometry;

  if (!geom.coordinates) {
    geometry = new Point([0, 0]);
  } else if (geom.type === 'Point') {
    const coords = geom.coordinates as [number, number];
    geometry = new Point(fromLonLat(coords));
  } else if (geom.type === 'LineString') {
    const coords = (geom.coordinates as [number, number][]).map((c) => fromLonLat(c));
    geometry = new LineString(coords);
  } else if (geom.type === 'Polygon') {
    const rings = (geom.coordinates as [number, number][][]).map((ring) =>
      ring.map((c) => fromLonLat(c)),
    );
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
