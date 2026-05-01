import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Coordinate } from '@angular-helpers/openlayers/core';
import { OlMilitaryService } from './military.service';

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
    service = new OlMilitaryService();
  });

  // -------------------------------------------------------------------------
  // createEllipse
  // -------------------------------------------------------------------------

  describe('createEllipse', () => {
    it('produces a closed Polygon ring with segments+1 vertices', () => {
      const f = service.createEllipse({ center, semiMajor: 5_000, semiMinor: 2_500 });
      expect(f.geometry.type).toBe('Polygon');
      const rings = f.geometry.coordinates as Coordinate[][];
      expect(rings).toHaveLength(1);
      expect(rings[0]).toHaveLength(64 + 1);
      expect(rings[0][0]).toEqual(rings[0][rings[0].length - 1]); // closed
    });

    it('axis radii match semiMajor / semiMinor at 0 / π/2 within ε', () => {
      const semiMajor = 5_000;
      const semiMinor = 2_500;
      const f = service.createEllipse({
        center,
        semiMajor,
        semiMinor,
        rotation: 0,
        segments: 64,
      });
      const ring = (f.geometry.coordinates as Coordinate[][])[0];
      // i=0 → θ=0 → semi-major along East (dx = semiMajor, dy = 0)
      expect(distanceMeters(center, ring[0])).toBeCloseTo(semiMajor, -1);
      // i=segments/4 → θ=π/2 → semi-minor along North (dx = 0, dy = semiMinor)
      expect(distanceMeters(center, ring[16])).toBeCloseTo(semiMinor, -1);
    });

    it('rotation by π/2 rotates the major axis 90° CCW (East → North)', () => {
      const semiMajor = 5_000;
      const semiMinor = 2_500;
      const f = service.createEllipse({
        center,
        semiMajor,
        semiMinor,
        rotation: Math.PI / 2,
        segments: 64,
      });
      const ring = (f.geometry.coordinates as Coordinate[][])[0];
      // Vertex 0 has θ=0 → axis-aligned point at (semiMajor, 0). After a
      // π/2 CCW rotation it lands due NORTH of the center: same distance
      // (semiMajor), but the lat offset is now positive and the lon
      // offset is ~0.
      expect(distanceMeters(center, ring[0])).toBeCloseTo(semiMajor, -1);
      expect(ring[0][1]).toBeGreaterThan(center[1]);
      expect(Math.abs(ring[0][0] - center[0])).toBeLessThan(1e-6);
      // Vertex 16 (θ=π/2) lands due WEST at semiMinor.
      expect(distanceMeters(center, ring[16])).toBeCloseTo(semiMinor, -1);
      expect(ring[16][0]).toBeLessThan(center[0]);
      expect(Math.abs(ring[16][1] - center[1])).toBeLessThan(1e-6);
    });

    it('forwards custom properties onto the feature', () => {
      const f = service.createEllipse({
        center,
        semiMajor: 1_000,
        semiMinor: 500,
        properties: { tag: 'aoi-1' },
      });
      expect(f.properties).toEqual({ tag: 'aoi-1' });
    });

    it.each([
      { input: { semiMajor: 0, semiMinor: 1 }, pattern: /positive/i },
      { input: { semiMajor: 1, semiMinor: -1 }, pattern: /positive/i },
      { input: { semiMajor: 1, semiMinor: 1, segments: 4 }, pattern: /segments/i },
    ])('throws RangeError for invalid input ($input)', ({ input, pattern }) => {
      expect(() => service.createEllipse({ center, ...input })).toThrow(pattern);
    });
  });

  // -------------------------------------------------------------------------
  // createSector
  // -------------------------------------------------------------------------

  describe('createSector', () => {
    it('produces an apex-arc-apex polygon ring', () => {
      const f = service.createSector({
        center,
        radius: 8_000,
        startAngle: 0,
        endAngle: Math.PI / 3,
        segments: 32,
      });
      const ring = (f.geometry.coordinates as Coordinate[][])[0];
      // 1 (apex) + segments+1 (arc samples) + 1 (apex closer) = segments + 3
      expect(ring).toHaveLength(32 + 3);
      // First and last vertex are the apex
      expect(ring[0]).toEqual(center);
      expect(ring[ring.length - 1]).toEqual(center);
    });

    it('arc samples sit on the configured radius (within ε)', () => {
      const radius = 4_500;
      const f = service.createSector({
        center,
        radius,
        startAngle: 0,
        endAngle: Math.PI / 2,
      });
      const ring = (f.geometry.coordinates as Coordinate[][])[0];
      for (let i = 1; i < ring.length - 1; i++) {
        expect(distanceMeters(center, ring[i])).toBeCloseTo(radius, -1);
      }
    });

    it.each([
      { input: { radius: 0, startAngle: 0, endAngle: 1 }, pattern: /positive/i },
      { input: { radius: 1, startAngle: 1, endAngle: 1 }, pattern: /endAngle/i },
      { input: { radius: 1, startAngle: 0, endAngle: 1, segments: 2 }, pattern: /segments/i },
      { input: { radius: 1, startAngle: 0, endAngle: 10 }, pattern: /full circle/i },
    ])('throws RangeError for invalid input ($input)', ({ input, pattern }) => {
      expect(() => service.createSector({ center, ...input })).toThrow(pattern);
    });
  });

  // -------------------------------------------------------------------------
  // createDonut
  // -------------------------------------------------------------------------

  describe('createDonut', () => {
    it('produces a polygon with two rings (outer + inner hole)', () => {
      const f = service.createDonut({ center, outerRadius: 10_000, innerRadius: 5_000 });
      expect(f.geometry.type).toBe('Polygon');
      const rings = f.geometry.coordinates as Coordinate[][];
      expect(rings).toHaveLength(2);
      expect(rings[0]).toHaveLength(64 + 1);
      expect(rings[1]).toHaveLength(64 + 1);
    });

    it('outer ring is CCW (signed area > 0) and inner ring is CW (< 0)', () => {
      const f = service.createDonut({ center, outerRadius: 10_000, innerRadius: 5_000 });
      const [outer, inner] = f.geometry.coordinates as Coordinate[][];
      expect(signedArea(outer)).toBeGreaterThan(0);
      expect(signedArea(inner)).toBeLessThan(0);
    });

    it('vertices on each ring sit at the configured radii (within ε)', () => {
      const outerRadius = 12_000;
      const innerRadius = 3_000;
      const f = service.createDonut({ center, outerRadius, innerRadius });
      const [outer, inner] = f.geometry.coordinates as Coordinate[][];
      // Sample a few vertices on each ring.
      [0, 8, 16, 32].forEach((i) => {
        expect(distanceMeters(center, outer[i])).toBeCloseTo(outerRadius, -1);
        expect(distanceMeters(center, inner[i])).toBeCloseTo(innerRadius, -1);
      });
    });

    it.each([
      { input: { outerRadius: 0, innerRadius: 1 }, pattern: /positive/i },
      { input: { outerRadius: 5, innerRadius: 5 }, pattern: /greater than/i },
      { input: { outerRadius: 5, innerRadius: 1, segments: 4 }, pattern: /segments/i },
    ])('throws RangeError for invalid input ($input)', ({ input, pattern }) => {
      expect(() => service.createDonut({ center, ...input })).toThrow(pattern);
    });
  });

  // -------------------------------------------------------------------------
  // milsymbol integration
  // -------------------------------------------------------------------------

  describe('createMilSymbol', () => {
    it('produces a feature with icon style', async () => {
      const f = await service.createMilSymbol({ sidc: 'SFGPUCI-----', position: center });
      expect(f.style?.icon?.src).toMatch(/^data:image\/svg\+xml;base64,/);
      // Real milsymbol generates sizes based on the symbol type
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
      // Restore even if the test threw.
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
        writable: true,
      });
    });

    it('createMilSymbol throws when window is undefined', async () => {
      // Simulate a Node-only environment by hiding `window`.
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
