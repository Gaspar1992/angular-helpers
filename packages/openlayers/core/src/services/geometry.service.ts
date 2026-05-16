// OlGeometryService — general purpose geometry helpers

import { Injectable } from '@angular/core';
import type { Coordinate, Feature } from '../models/types';
import type { DonutConfig, EllipseConfig, SectorConfig } from '../models/geometry.types';

/**
 * Meters per degree of latitude on a spherical Earth approximation.
 * Used by the local tangent-plane projection in the geometry helpers.
 */
const METERS_PER_DEGREE_LAT = 111_320;

/**
 * Service exposing general purpose geometry helpers for creating
 * approximated polygons (ellipses, sectors, donuts) from metric parameters.
 */
@Injectable({
  providedIn: 'root',
})
export class OlGeometryService {
  private idCounter = 0;

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

  /**
   * Project an `(dx, dy)` meter offset from `center` to lon/lat using a
   * local tangent-plane (equirectangular) approximation.
   */
  offsetMetersToLonLat(center: Coordinate, dx: number, dy: number): Coordinate {
    const [lon, lat] = center;
    const latRad = (lat * Math.PI) / 180;
    const dLat = dy / METERS_PER_DEGREE_LAT;
    const dLon = dx / (METERS_PER_DEGREE_LAT * Math.cos(latRad));
    return [lon + dLon, lat + dLat];
  }

  private nextId(kind: string): string {
    return `${kind}-${++this.idCounter}`;
  }
}
