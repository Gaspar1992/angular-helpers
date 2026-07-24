import { describe, it, expect } from 'vitest';
import { OlMapComponent } from './map.component';
import { OlMapService } from '../services/map.service';
import { OlZoneHelper } from '../services/zone-helper.service';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { render } from '@angular-helpers/testing';

// Register custom UTM projection for tests
proj4.defs(
  'EPSG:25830',
  '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
);
register(proj4);

describe('OlMapComponent custom projections', () => {
  it('should initialize dynamic projection helper methods correctly', async () => {
    const result = await render(OlMapComponent, {
      providers: [OlMapService, OlZoneHelper],
      inputs: {
        projection: 'EPSG:3857',
        coordinateProjection: 'EPSG:4326',
      },
    });

    const projected = (result.component as any).getProjectedCoordinate([-58.3816, -34.6037]);
    expect(Math.abs(projected[0])).toBeGreaterThan(1000);

    const external = (result.component as any).getExternalCoordinate(projected);
    expect(external[0]).toBeCloseTo(-58.3816, 4);
  });

  it('should bypass projection conversions if coordinateProjection matches map projection', async () => {
    const result = await render(OlMapComponent, {
      providers: [OlMapService, OlZoneHelper],
      inputs: {
        projection: 'EPSG:25830',
        coordinateProjection: 'EPSG:25830',
      },
    });

    const projected = (result.component as any).getProjectedCoordinate([440263, 4474328]);
    expect(projected).toEqual([440263, 4474328]);

    const external = (result.component as any).getExternalCoordinate([440263, 4474328]);
    expect(external).toEqual([440263, 4474328]);
  });
});
