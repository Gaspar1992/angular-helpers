import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Coordinate } from '@angular-helpers/openlayers/core';
import { OlMilitaryService } from './military.service';
import { OlGeometryService } from '@angular-helpers/openlayers/core';
import { TestBed } from '@angular/core/testing';

// ---------------------------------------------------------------------------
// Mock milsymbol so tests don't depend on the real library
// ---------------------------------------------------------------------------

vi.mock('milsymbol-esm', () => {
  const MockSymbol = class MockSymbol {
    sidc: string;
    options: Record<string, unknown>;
    constructor(sidc: string, options: Record<string, unknown> = {}) {
      this.sidc = sidc;
      this.options = options;
    }
    asSVG(): string {
      return `<svg data-sidc="${this.sidc}"/>`;
    }
    getSize(): { width: number; height: number } {
      return { width: 100, height: 80 };
    }
    getAnchor(): { x: number; y: number } {
      return { x: 50, y: 40 };
    }
    getColors(): unknown {
      return {};
    }
    getOctagonAnchor(): { x: number; y: number } {
      return { x: 50, y: 40 };
    }
  };
  return { ms: { Symbol: MockSymbol } };
});

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

/**
 * Compute the signed shoelace area of a closed lon/lat ring. Sign indicates
 * winding: > 0 = counter-clockwise, < 0 = clockwise. Magnitude is in
 * (degrees)^2 — fine for sign-only comparisons.
 */
function signedArea(ring: Coordinate[]): number {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

/**
 * Approximate distance in meters between two lon/lat points using the
 * same equirectangular projection the service uses internally. Good
 * enough for the tolerance asserts we make below.
 */
function distanceMeters(a: Coordinate, b: Coordinate): number {
  const METERS_PER_DEGREE_LAT = 111_320;
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const meanLat = ((lat1 + lat2) / 2) * (Math.PI / 180);
  const dy = (lat2 - lat1) * METERS_PER_DEGREE_LAT;
  const dx = (lon2 - lon1) * METERS_PER_DEGREE_LAT * Math.cos(meanLat);
  return Math.hypot(dx, dy);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('OlMilitaryService', () => {
  let service: OlMilitaryService;
  const center: Coordinate = [-3.7, 40.42]; // Madrid

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OlMilitaryService, OlGeometryService],
    });
    service = TestBed.inject(OlMilitaryService);
  });

  // -------------------------------------------------------------------------
  // milsymbol integration
  // -------------------------------------------------------------------------

  describe('createMilSymbol', () => {
    it('produces a feature with icon style', async () => {
      const f = await service.createMilSymbol({ sidc: 'SFGPUCI-----', position: center });
      expect(f.style?.icon?.src).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(f.style?.icon?.size).toBeDefined();
      expect(f.style?.icon?.size?.length).toBe(2);
      expect(f.style?.icon?.anchor).toBeDefined();
      expect(f.properties?.['sidc']).toBe('SFGPUCI-----');
    });

    it('coerces a numeric quantity to a string for milsymbol', async () => {
      const f = await service.createMilSymbol({
        sidc: 'SFGPUCI-----',
        position: center,
        quantity: 12,
      });
      expect(f.properties?.['quantity']).toBe('12');
    });

    it('throws on invalid SIDC', async () => {
      await expect(service.createMilSymbol({ sidc: 'short', position: center })).rejects.toThrow(
        /SIDC/,
      );
    });
  });

  // -------------------------------------------------------------------------
  // SSR / non-browser
  // -------------------------------------------------------------------------

  describe('SSR / non-browser', () => {
    const originalWindow = globalThis.window;

    afterEach(() => {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
        writable: true,
      });
    });

    it('createMilSymbol throws when window is undefined', async () => {
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      await expect(
        service.createMilSymbol({ sidc: 'SFGPUCI-----', position: center }),
      ).rejects.toThrow(/browser environment/);
    });
  });
});
