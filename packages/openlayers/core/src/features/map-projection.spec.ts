import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { OlMapComponent } from './map.component';
import { OlMapService } from '../services/map.service';
import { OlZoneHelper } from '../services/zone-helper.service';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';

// Register custom UTM projection for tests
proj4.defs(
  'EPSG:25830',
  '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
);
register(proj4);

describe('OlMapComponent custom projections', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OlMapService, OlZoneHelper],
    });
  });

  it('should initialize dynamic projection helper methods correctly', () => {
    const fixture = TestBed.createComponent(OlMapComponent);
    const component = fixture.componentInstance;

    // Test Default: coordinateProjection='EPSG:4326', projection='EPSG:3857' (transforms)
    fixture.componentRef.setInput('projection', 'EPSG:3857');
    fixture.componentRef.setInput('coordinateProjection', 'EPSG:4326');
    fixture.detectChanges();

    const projected = (component as any).getProjectedCoordinate([-58.3816, -34.6037]);
    expect(Math.abs(projected[0])).toBeGreaterThan(1000);

    const external = (component as any).getExternalCoordinate(projected);
    expect(external[0]).toBeCloseTo(-58.3816, 4);
  });

  it('should bypass projection conversions if coordinateProjection matches map projection', () => {
    const fixture = TestBed.createComponent(OlMapComponent);
    const component = fixture.componentInstance;

    // Test Bypass: coordinateProjection='EPSG:25830', projection='EPSG:25830' (keeps coordinates untouched)
    fixture.componentRef.setInput('projection', 'EPSG:25830');
    fixture.componentRef.setInput('coordinateProjection', 'EPSG:25830');
    fixture.detectChanges();

    const projected = (component as any).getProjectedCoordinate([440263, 4474328]);
    expect(projected).toEqual([440263, 4474328]);

    const external = (component as any).getExternalCoordinate([440263, 4474328]);
    expect(external).toEqual([440263, 4474328]);
  });
});
