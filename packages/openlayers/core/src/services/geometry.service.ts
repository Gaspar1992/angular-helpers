// OlGeometryService — general purpose geometry helpers

import { Injectable } from '@angular/core';
import type { Coordinate, Feature } from '../models/types';
import type { DonutConfig, EllipseConfig, SectorConfig } from '../models/geometry.types';

import { offset } from 'ol/sphere';

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

    const rRadius = 6371008.8; // Standard Earth radius used by OpenLayers
    const alpha = semiMajor / rRadius;
    const beta = semiMinor / rRadius;

    // Failsafe for strategic-scale inputs exceeding spherical boundaries (quarter of Earth)
    if (alpha >= Math.PI / 2 || beta >= Math.PI / 2) {
      throw new RangeError(
        'semiMajor and semiMinor must be less than quarter of Earth circumference',
      );
    }

    const tanAlpha = Math.tan(alpha);
    const tanBeta = Math.tan(beta);
    const tanAlphaSq = tanAlpha * tanAlpha;
    const tanBetaSq = tanBeta * tanBeta;

    const ring: Coordinate[] = [];
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const cosT = Math.cos(theta);

      // Spherical ellipse polar equation:
      // tan^2(rho) = tan^2(beta) / (1 - cos^2(theta) * (1 - tan^2(beta) / tan^2(alpha)))
      const denom = 1 - cosT * cosT * (1 - tanBetaSq / tanAlphaSq);
      const tanSqRho = tanBetaSq / denom;
      const rho = Math.atan(Math.sqrt(tanSqRho));
      const distance = rho * rRadius;
      const bearing = Math.PI / 2 - (rotation + theta);

      ring.push(offset(center, distance, bearing) as Coordinate);
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
      const bearing = Math.PI / 2 - theta;
      ring.push(offset(center, radius, bearing) as Coordinate);
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
      const bearing = Math.PI / 2 - theta;
      outer.push(offset(center, outerRadius, bearing) as Coordinate);
      inner.push(offset(center, innerRadius, bearing) as Coordinate);
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
   * Project an `(dx, dy)` meter offset from `center` to lon/lat using true
   * geodesic math (Vincenty's formulae) via ol/sphere.
   */
  offsetMetersToLonLat(center: Coordinate, dx: number, dy: number): Coordinate {
    if (dx === 0 && dy === 0) return [...center];
    const distance = Math.hypot(dx, dy);
    const bearing = Math.atan2(dx, dy);
    return offset(center, distance, bearing) as Coordinate;
  }

  private nextId(kind: string): string {
    return `${kind}-${++this.idCounter}`;
  }
}
