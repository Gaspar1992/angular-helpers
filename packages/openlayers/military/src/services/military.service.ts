// @angular-helpers/openlayers/military — service implementation

import { Injectable } from '@angular/core';
import type { Coordinate, Feature } from '@angular-helpers/openlayers/core';
import type {
  DonutConfig,
  EllipseConfig,
  MilSymbolConfig,
  MilSymbolStyleResult,
  SectorConfig,
} from '../models/military.types';

/**
 * Meters per degree of latitude on a spherical Earth approximation.
 * Used by the local tangent-plane projection in the geometry helpers.
 */
const METERS_PER_DEGREE_LAT = 111_320;

/**
 * Service exposing geometry helpers and MIL-STD-2525 symbology rendering.
 *
 * - `createEllipse`, `createSector`, `createDonut` are **pure math** and
 *   have no runtime dependencies beyond the bundled types.
 * - `createMilSymbol` uses the milsymbol library via dynamic ESM import.
 */
@Injectable()
export class OlMilitaryService {
  private idCounter = 0;
  private mlLoader: Promise<typeof import('milsymbol')> | null = null;
  private msModule: typeof import('milsymbol') | null = null;

  // ---------------------------------------------------------------------------
  // Geometry helpers (pure math, no deps)
  // ---------------------------------------------------------------------------

  /**
   * Build a `Feature<Polygon>` approximating an ellipse centered at
   * `config.center`. See {@link EllipseConfig} for parameter semantics.
   */
  createEllipse(config: EllipseConfig): Feature {
    const { center, semiMajor, semiMinor, rotation = 0, segments = 64, properties } = config;
    if (semiMajor <= 0 || semiMinor <= 0) {
      throw new RangeError('semiMajor and semiMinor must be positive');
    }
    if (segments < 8) {
      throw new RangeError('segments must be >= 8');
    }

    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);
    const ring: Coordinate[] = [];
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      // Ellipse in local axis-aligned frame, then rotated by `rotation`.
      const ax = Math.cos(theta) * semiMajor;
      const ay = Math.sin(theta) * semiMinor;
      const dx = ax * cosR - ay * sinR;
      const dy = ax * sinR + ay * cosR;
      ring.push(this.offsetMetersToLonLat(center, dx, dy));
    }
    ring.push(ring[0]); // close the ring

    return {
      id: this.nextId('ellipse'),
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties,
    };
  }

  /**
   * Build a `Feature<Polygon>` for a circular sector (pie slice).
   * See {@link SectorConfig} for parameter semantics.
   */
  createSector(config: SectorConfig): Feature {
    const { center, radius, startAngle, endAngle, segments = 32, properties } = config;
    if (radius <= 0) {
      throw new RangeError('radius must be positive');
    }
    if (endAngle <= startAngle) {
      throw new RangeError('endAngle must be greater than startAngle');
    }
    if (endAngle - startAngle > Math.PI * 2) {
      throw new RangeError('sector cannot exceed full circle');
    }
    if (segments < 4) {
      throw new RangeError('segments must be >= 4');
    }

    const ring: Coordinate[] = [center];
    const span = endAngle - startAngle;
    for (let i = 0; i <= segments; i++) {
      const theta = startAngle + (i / segments) * span;
      const dx = Math.cos(theta) * radius;
      const dy = Math.sin(theta) * radius;
      ring.push(this.offsetMetersToLonLat(center, dx, dy));
    }
    ring.push(center); // close back to apex

    return {
      id: this.nextId('sector'),
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties,
    };
  }

  /**
   * Build a `Feature<Polygon>` for a donut (annular ring). The output has
   * two rings: an outer ring wound counter-clockwise and an inner ring
   * wound clockwise so the GeoJSON right-hand rule renders the hole.
   */
  createDonut(config: DonutConfig): Feature {
    const { center, outerRadius, innerRadius, segments = 64, properties } = config;
    if (outerRadius <= 0 || innerRadius <= 0) {
      throw new RangeError('radii must be positive');
    }
    if (outerRadius <= innerRadius) {
      throw new RangeError('outerRadius must be greater than innerRadius');
    }
    if (segments < 8) {
      throw new RangeError('segments must be >= 8');
    }

    const outer: Coordinate[] = [];
    const inner: Coordinate[] = [];
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      // Outer ring: CCW (theta increasing)
      outer.push(this.offsetMetersToLonLat(center, cosT * outerRadius, sinT * outerRadius));
      // Inner ring: CW — sample the SAME thetas but we'll reverse the
      // accumulator below so the ring is traversed in the opposite sense.
      inner.push(this.offsetMetersToLonLat(center, cosT * innerRadius, sinT * innerRadius));
    }
    inner.reverse();
    outer.push(outer[0]);
    inner.push(inner[0]);

    return {
      id: this.nextId('donut'),
      geometry: { type: 'Polygon', coordinates: [outer, inner] },
      properties,
    };
  }

  // ---------------------------------------------------------------------------
  // MIL-STD-2525 symbology (lazy `milsymbol` load)
  // ---------------------------------------------------------------------------

  /**
   * Pre-load the optional `milsymbol` peer dependency so subsequent calls
   * to `createMilSymbol` / `createMilSymbolSync` resolve immediately.
   * Idempotent — multiple calls share the same promise.
   */
  preloadMilsymbol(): Promise<void> {
    this.assertBrowser();
    if (!this.mlLoader) {
      this.mlLoader = import('milsymbol').then((m) => {
        this.msModule = m;
        return m;
      });
    }
    return this.mlLoader.then(() => {
      // Void return for the public API
    });
  }

  /**
   * Build a MIL-STD-2525 symbol feature asynchronously.
   * Lazy-loads `milsymbol` on the first call.
   */
  async createMilSymbol(config: MilSymbolConfig): Promise<Feature> {
    this.assertBrowser();
    this.assertSidc(config.sidc);

    if (!this.msModule) {
      await this.preloadMilsymbol();
    }

    return this.buildSymbolFeature(config);
  }

  /**
   * Build a MIL-STD-2525 symbol feature synchronously.
   * Throws if `milsymbol` has not been preloaded via `preloadMilsymbol()`
   * or a previous `createMilSymbol()` call.
   */
  createMilSymbolSync(config: MilSymbolConfig): Feature {
    this.assertBrowser();
    this.assertSidc(config.sidc);

    if (!this.msModule) {
      throw new Error(
        'milsymbol is not loaded yet. Call preloadMilsymbol() or use the async createMilSymbol().',
      );
    }

    return this.buildSymbolFeature(config);
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  /**
   * Project an `(dx, dy)` meter offset from `center` to lon/lat using a
   * local tangent-plane (equirectangular) approximation. Acceptable for
   * the radii typical in military symbology (<100 km from center).
   */
  private offsetMetersToLonLat(center: Coordinate, dx: number, dy: number): Coordinate {
    const [lon, lat] = center;
    const latRad = (lat * Math.PI) / 180;
    const dLat = dy / METERS_PER_DEGREE_LAT;
    const dLon = dx / (METERS_PER_DEGREE_LAT * Math.cos(latRad));
    return [lon + dLon, lat + dLat];
  }

  private nextId(kind: string): string {
    return `${kind}-${++this.idCounter}`;
  }

  private buildSymbolFeature(config: MilSymbolConfig): Feature {
    const { sidc, position, properties, quantity, ...rest } = config;
    // `milsymbol` types `quantity` as a string, but a number is the
    // ergonomic shape; coerce here.
    const milOptions = {
      ...rest,
      ...(quantity !== undefined ? { quantity: String(quantity) } : {}),
    };

    // We asserted this.msModule exists before calling this
    const ms = this.msModule!;
    // default import might be wrapped depending on bundler
    const SymbolClass = (ms as any).default?.Symbol || ms.Symbol;
    const symbol = new SymbolClass(sidc, milOptions);
    const style = this.symbolToStyleResult(symbol);
    const mergedProperties: Record<string, unknown> = { sidc, ...milOptions, ...properties };

    return {
      id: this.nextId('symbol'),
      geometry: { type: 'Point', coordinates: position },
      properties: mergedProperties,
      style: { icon: { src: style.src, size: style.size, anchor: style.anchor } },
    };
  }

  private symbolToStyleResult(symbol: {
    asSVG(): string;
    getSize(): { width: number; height: number };
    getAnchor(): { x: number; y: number };
  }): MilSymbolStyleResult {
    const svg = symbol.asSVG();
    const { width, height } = symbol.getSize();
    const { x: ax, y: ay } = symbol.getAnchor();
    return {
      src: `data:image/svg+xml;base64,${this.encodeBase64Utf8(svg)}`,
      size: [width, height],
      anchor: [ax / width, ay / height],
    };
  }

  private encodeBase64Utf8(input: string): string {
    // `btoa` only handles Latin-1; this round-trip preserves non-ASCII
    // characters (e.g. unit designators with accents).
    return btoa(unescape(encodeURIComponent(input)));
  }

  private assertSidc(sidc: unknown): asserts sidc is string {
    if (typeof sidc !== 'string' || sidc.length < 10) {
      throw new TypeError('sidc must be a non-empty MIL-STD-2525 SIDC string');
    }
  }

  private assertBrowser(): void {
    if (typeof window === 'undefined') {
      throw new Error('createMilSymbol requires a browser environment');
    }
  }
}
