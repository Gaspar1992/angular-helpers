import { describe, it, expect } from 'vitest';
import { featureToOlFeature, olFeatureToFeature } from './feature-utils';
import type { Feature } from '../models/types';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { get as getProjection } from 'ol/proj';

// Register custom UTM projection for tests
proj4.defs(
  'EPSG:25830',
  '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
);
register(proj4);

describe('featureToOlFeature and olFeatureToFeature projections', () => {
  it('should transform coordinates from EPSG:4326 to EPSG:3857 by default', () => {
    const feature: Feature = {
      id: 'f1',
      geometry: {
        type: 'Point',
        coordinates: [-58.3816, -34.6037], // Buenos Aires Lon/Lat
      },
      properties: { name: 'Obelisco' },
    };

    const olf = featureToOlFeature(feature);
    const geometry = olf.getGeometry() as any;
    expect(geometry.getType()).toBe('Point');

    const coords = geometry.getCoordinates();
    // EPSG:3857 projected coordinates are significantly larger than EPSG:4326 coordinates
    expect(Math.abs(coords[0])).toBeGreaterThan(1000);
    expect(Math.abs(coords[1])).toBeGreaterThan(1000);

    // Convert back
    const back = olFeatureToFeature(olf, {
      sourceProjection: 'EPSG:4326',
      targetProjection: 'EPSG:3857',
    });
    expect(back.geometry.coordinates[0]).toBeCloseTo(-58.3816, 4);
    expect(back.geometry.coordinates[1]).toBeCloseTo(-34.6037, 4);
  });

  it('should transform coordinates to custom projection when specified', () => {
    const feature: Feature = {
      id: 'f2',
      geometry: {
        type: 'Point',
        coordinates: [-3.70379, 40.41678], // Madrid Lon/Lat
      },
      properties: { name: 'Madrid' },
    };

    // Convert to UTM Zone 30 (EPSG:25830)
    const olf = featureToOlFeature(feature, {
      sourceProjection: 'EPSG:4326',
      targetProjection: 'EPSG:25830',
    });

    const geometry = olf.getGeometry() as any;
    const coords = geometry.getCoordinates();

    // UTM Zone 30 coordinate scale check for Madrid: ~440000m Easting, ~4474000m Northing
    expect(coords[0]).toBeCloseTo(440291, 0);
    expect(coords[1]).toBeCloseTo(4474255, 0);

    // Convert back
    const back = olFeatureToFeature(olf, {
      sourceProjection: 'EPSG:4326',
      targetProjection: 'EPSG:25830',
    });
    expect(back.geometry.coordinates[0]).toBeCloseTo(-3.70379, 4);
    expect(back.geometry.coordinates[1]).toBeCloseTo(40.41678, 4);
  });

  it('should bypass transformation and keep coordinates untouched when source matches target', () => {
    const feature: Feature = {
      id: 'f3',
      geometry: {
        type: 'Point',
        coordinates: [440291, 4474255], // Already in UTM EPSG:25830 coordinates
      },
      properties: { name: 'Madrid UTM' },
    };

    // Since source is target, it should keep the UTM coords exactly as they are!
    const olf = featureToOlFeature(feature, {
      sourceProjection: 'EPSG:25830',
      targetProjection: 'EPSG:25830',
    });

    const geometry = olf.getGeometry() as any;
    expect(geometry.getCoordinates()).toEqual([440291, 4474255]);

    // Convert back should keep them untouched too
    const back = olFeatureToFeature(olf, {
      sourceProjection: 'EPSG:25830',
      targetProjection: 'EPSG:25830',
    });
    expect(back.geometry.coordinates).toEqual([440291, 4474255]);
  });
});
