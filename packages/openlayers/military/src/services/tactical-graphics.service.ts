// Tactical Graphics Service — investigation and prototype for military line drawing

import { inject, Injectable } from '@angular/core';
import { Style, Stroke, Fill, RegularShape, Icon } from 'ol/style';
import { LineString, Point } from 'ol/geom';
import type { Feature as OLFeature } from 'ol';
import type { Feature, Coordinate } from '@angular-helpers/openlayers/core';
import { OlMilitaryService } from './military.service';

/**
 * Service providing styles and geometry generators for military tactical graphics
 * such as battle fronts, axes of attack, and boundaries.
 *
 * NOTE: For point symbols (units), it delegates to {@link OlMilitaryService}
 * for lazy-loading `milsymbol`.
 */
@Injectable()
export class OlTacticalGraphicsService {
  private idCounter = 0;
  private militaryService = inject(OlMilitaryService);

  /**
   * Creates a LineString feature representing a battle front.
   */
  createFrontLine(
    coordinates: Coordinate[],
    direction: 'friendly' | 'hostile' = 'friendly',
  ): Feature {
    return {
      id: this.nextId('front-line'),
      geometry: { type: 'LineString', coordinates },
      properties: { tacticalType: 'front-line', direction },
    };
  }

  /**
   * Creates a LineString feature representing an attack arrow.
   */
  createAttackArrow(
    coordinates: Coordinate[],
    direction: 'friendly' | 'hostile' = 'friendly',
  ): Feature {
    return {
      id: this.nextId('attack-arrow'),
      geometry: { type: 'LineString', coordinates },
      properties: { tacticalType: 'attack-arrow', direction },
    };
  }

  /**
   * Creates a Polygon feature representing a control zone.
   */
  createControlZone(
    coordinates: Coordinate[][],
    direction: 'friendly' | 'hostile' = 'friendly',
  ): Feature {
    return {
      id: this.nextId('control-zone'),
      geometry: { type: 'Polygon', coordinates },
      properties: { tacticalType: 'control-zone', direction },
    };
  }

  /**
   * Creates a Point feature representing a military unit.
   * @param sidc - Symbol Identification Code (MIL-STD-2525 / APP-6)
   */
  createUnit(coordinate: Coordinate, sidc: string, name: string): Feature {
    return {
      id: this.nextId('unit'),
      geometry: { type: 'Point', coordinates: coordinate },
      properties: { tacticalType: 'unit', sidc, name },
    };
  }

  private nextId(kind: string): string {
    return `${kind}-${++this.idCounter}`;
  }

  /**
   * Style for Troop Units using milsymbol.
   * NOTE: Requires milsymbol to be pre-loaded via OlMilitaryService.
   */
  createUnitStyle(sidc: string, selected = false): Style | null {
    // We delegate the style calculation to militaryService which handles the lazy-load state.
    const styleProperties = this.militaryService.createUnitStyle(sidc, selected);
    if (!styleProperties) return null;

    return new Style({
      image: new Icon({
        img: styleProperties.image.img,
        size: styleProperties.image.size,
        anchor: styleProperties.image.anchor,
      }),
      zIndex: styleProperties.zIndex,
    });
  }

  /**
   * Style for Battle Fronts (Complex LineString with teeth).
   */
  createFrontLineStyle(
    color: string,
    direction: 'friendly' | 'hostile' = 'friendly',
  ): (feature: OLFeature, resolution: number) => Style[] {
    return (feature: OLFeature, resolution: number) => {
      const geometry = feature.getGeometry();
      if (!(geometry instanceof LineString)) return [];

      const styles: Style[] = [
        new Style({
          stroke: new Stroke({
            color,
            width: 3,
            lineDash: direction === 'hostile' ? [10, 10] : undefined,
          }),
        }),
      ];

      const coords = geometry.getCoordinates();
      const stride = 40 * resolution; // Spacing between markers
      let distSoFar = 0;

      for (let i = 0; i < coords.length - 1; i++) {
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        while (distSoFar < len) {
          const ratio = distSoFar / len;
          const pos = [p1[0] + dx * ratio, p1[1] + dy * ratio];

          // Add "teeth" or spikes along the line
          styles.push(
            new Style({
              geometry: new Point(pos),
              image: new RegularShape({
                fill: new Fill({ color }),
                points: direction === 'friendly' ? 20 : 3, // Semicircle vs Triangle
                radius: 6,
                rotation: -angle + (direction === 'friendly' ? 0 : Math.PI / 2),
                angle: direction === 'friendly' ? angle + Math.PI / 2 : 0,
              }),
            }),
          );

          distSoFar += stride;
        }
        distSoFar -= len;
      }
      return styles;
    };
  }

  /**
   * Style for Troop Movements (Arrows).
   */
  createAttackArrowStyle(color: string): (feature: OLFeature) => Style[] {
    return (feature: OLFeature) => {
      const geometry = feature.getGeometry();
      if (!(geometry instanceof LineString)) return [];

      const coords = geometry.getCoordinates();
      if (coords.length < 2) return [];

      const last = coords[coords.length - 1];
      const prev = coords[coords.length - 2];
      const angle = Math.atan2(last[1] - prev[1], last[0] - prev[0]);

      return [
        new Style({
          stroke: new Stroke({ color, width: 4, lineDash: [8, 4] }),
        }),
        new Style({
          geometry: new Point(last),
          image: new RegularShape({
            fill: new Fill({ color }),
            points: 3,
            radius: 14,
            rotation: -angle + Math.PI / 2,
          }),
        }),
      ];
    };
  }

  /**
   * Style for Control Zones (Polygons).
   */
  createZoneStyle(color: string, opacity = 0.2): Style {
    return new Style({
      fill: new Fill({ color: this.hexToRgba(color, opacity) }),
      stroke: new Stroke({ color, width: 2 }),
    });
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

/**
 * INVESTIGATION NOTES:
 *
 * To implement professional military graphics (MIL-STD-2525 / APP-6) in OpenLayers:
 *
 * 1. Style Geometry Function:
 *    Use the `geometry` property of `ol/style/Style` to generate secondary geometries
 *    (like the teeth of a front line) dynamically based on the main LineString.
 *
 * 2. Custom Renderers:
 *    For complex symbols that must remain constant in pixel size regardless of zoom,
 *    use the `renderer` property of `ol/style/Stroke` or `ol/style/Style`. This
 *    provides a direct access to the Canvas 2D context.
 *
 * 3. Library candidates:
 *    - `milsymbol`: Excellent for point symbols (SIDC), which we already use.
 *    - `ol-military-symbology`: A community library that implements some of these,
 *      though often requires older versions of OL.
 *
 * 4. Implementation strategy for "angular-helpers":
 *    We should provide a `TacticalLayer` or a specialized `StyleFunction` that
 *    detects military properties on features and applies the complex rendering
 *    logic (calculating segment angles, spacing markers, handling curves).
 */
