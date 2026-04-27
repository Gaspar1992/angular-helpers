// feature-utils unit tests
import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { Feature as OLFeature } from 'ol';
import { Circle as CircleGeom, LineString, Point, Polygon } from 'ol/geom';
import { olFeatureToFeature } from './feature-utils';

describe('olFeatureToFeature', () => {
  it('converts a Point feature with id and properties', () => {
    const ol = new OLFeature({ geometry: new Point([10, 20]), name: 'Madrid' });
    ol.setId('city-1');

    const result = olFeatureToFeature(ol);

    expect(result.id).toBe('city-1');
    expect(result.geometry.type).toBe('Point');
    expect(result.geometry.coordinates).toEqual([10, 20]);
    expect(result.properties?.['name']).toBe('Madrid');
  });

  it('converts a LineString feature with multi-coordinate array', () => {
    const ol = new OLFeature({
      geometry: new LineString([
        [0, 0],
        [1, 1],
        [2, 2],
      ]),
    });
    ol.setId(42);

    const result = olFeatureToFeature(ol);

    expect(result.id).toBe('42');
    expect(result.geometry.type).toBe('LineString');
    expect(result.geometry.coordinates).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
  });

  it('converts a Polygon feature with nested ring coordinates', () => {
    const ring = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ];
    const ol = new OLFeature({ geometry: new Polygon([ring]) });
    ol.setId('poly-1');

    const result = olFeatureToFeature(ol);

    expect(result.geometry.type).toBe('Polygon');
    expect(Array.isArray(result.geometry.coordinates)).toBe(true);
    expect((result.geometry.coordinates as number[][][])[0]).toEqual(ring);
  });

  it('converts a Circle feature using getCenter (no getCoordinates)', () => {
    const ol = new OLFeature({ geometry: new CircleGeom([5, 5], 100) });
    ol.setId('circle-1');

    const result = olFeatureToFeature(ol);

    expect(result.geometry.type).toBe('Circle');
    expect(result.geometry.coordinates).toEqual([5, 5]);
  });

  it('generates a fallback id when feature has no id', () => {
    const ol = new OLFeature({ geometry: new Point([0, 0]) });

    const result = olFeatureToFeature(ol);

    expect(result.id).toMatch(/^feature-/);
  });

  it('preserves arbitrary properties from the source feature', () => {
    const ol = new OLFeature({
      geometry: new Point([0, 0]),
      population: 3_500_000,
      capital: true,
    });
    ol.setId('p1');

    const result = olFeatureToFeature(ol);

    expect(result.properties?.['population']).toBe(3_500_000);
    expect(result.properties?.['capital']).toBe(true);
  });
});
