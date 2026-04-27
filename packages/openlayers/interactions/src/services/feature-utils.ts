// Feature conversion utilities for OpenLayers interactions

import type { Feature as OLFeature } from 'ol';
import type { Feature, Coordinate } from '@angular-helpers/openlayers/core';

/**
 * Converts an OpenLayers feature to the internal Feature format.
 * Handles coordinate extraction and geometry type mapping.
 *
 * @param olFeature - The OpenLayers feature to convert
 * @returns The converted Feature with normalized structure
 */
export function olFeatureToFeature(olFeature: OLFeature): Feature {
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
