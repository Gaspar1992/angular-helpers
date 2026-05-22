// Draw interaction creation service

import { inject, Injectable } from '@angular/core';
import type OLMap from 'ol/Map';
import Draw, { createBox } from 'ol/interaction/Draw';
import Snap from 'ol/interaction/Snap';
import VectorSource from 'ol/source/Vector';
import type VectorLayer from 'ol/layer/Vector';
import { Polygon } from 'ol/geom';
import type { Feature as OLFeature } from 'ol';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import { OlLayerService } from '@angular-helpers/openlayers/layers';
import type { DrawConfig, DrawEndEvent } from '../models/interaction.types';
import type { ManagedInteraction } from './types';
import { InteractionStateService } from './interaction-state.service';
import { olFeatureToFeature } from '@angular-helpers/openlayers/core';

/**
 * Service responsible for creating and managing Draw interactions.
 */
@Injectable()
export class DrawInteractionService {
  private mapService = inject(OlMapService);
  private layerService = inject(OlLayerService);
  private stateService = inject(InteractionStateService);
  private zoneHelper = inject(OlZoneHelper);

  /**
   * Creates and configures a Draw interaction.
   * @param id - Unique identifier for the interaction
   * @param config - Draw interaction configuration
   * @param map - OpenLayers map instance
   * @returns True if the interaction was created successfully
   */
  createDrawInteraction(id: string, config: DrawConfig, map: OLMap): boolean {
    let source: VectorSource | undefined;

    // Get source from layer if specified
    if (config.source) {
      const layer = this.layerService.getLayer(config.source) as
        | VectorLayer<VectorSource>
        | undefined;
      source = layer?.getSource() ?? undefined;
    }

    // Create a temporary source if none provided
    if (!source) {
      source = new VectorSource();
    }

    this.zoneHelper.runOutsideAngular(() => {
      let drawType = config.type as any;
      let geometryFunction: any;

      if (config.type === 'Ellipse') {
        drawType = 'Circle';
        geometryFunction = (coords: any, geom: any) => {
          if (!geom) {
            geom = new Polygon([]);
          }
          const center = coords[0];
          const last = coords[1];
          const dx = last[0] - center[0];
          const dy = last[1] - center[1];
          const semiMajor = Math.sqrt(dx * dx + dy * dy);
          const semiMinor = semiMajor * 0.7; // Default ratio
          const rotation = Math.atan2(dy, dx);

          const ring = [];
          const segments = 64;
          for (let i = 0; i < segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const ax = Math.cos(theta) * semiMajor;
            const ay = Math.sin(theta) * semiMinor;
            const rx = ax * Math.cos(rotation) - ay * Math.sin(rotation);
            const ry = ax * Math.sin(rotation) + ay * Math.cos(rotation);
            ring.push([center[0] + rx, center[1] + ry]);
          }
          ring.push(ring[0]);
          geom.setCoordinates([ring]);
          return geom;
        };
      } else if (config.type === 'Donut') {
        drawType = 'Circle';
        geometryFunction = (coords: any, geom: any) => {
          if (!geom) {
            geom = new Polygon([]);
          }
          const center = coords[0];
          const last = coords[1];
          const dx = last[0] - center[0];
          const dy = last[1] - center[1];
          const outerRadius = Math.sqrt(dx * dx + dy * dy);
          const innerRadius = outerRadius * 0.6; // Default ratio

          const outer = [];
          const inner = [];
          const segments = 64;
          for (let i = 0; i < segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const cosT = Math.cos(theta);
            const sinT = Math.sin(theta);
            outer.push([center[0] + cosT * outerRadius, center[1] + sinT * outerRadius]);
            inner.push([center[0] + cosT * innerRadius, center[1] + sinT * innerRadius]);
          }
          inner.reverse();
          outer.push(outer[0]);
          inner.push(inner[0]);
          geom.setCoordinates([outer, inner]);
          return geom;
        };
      }

      const draw = new Draw({
        source,
        type: drawType,
        geometryFunction,
        freehand: config.freehand ?? false,
        snapTolerance: config.snapTolerance ?? 12,
      });

      const snap = new Snap({ source });

      // Handle draw start event
      draw.on('drawstart', (e: { feature: OLFeature }) => {
        this.zoneHelper.runInsideAngular(() => {
          const feature = olFeatureToFeature(e.feature);
          this.stateService.emitDrawStart({ interactionId: id, feature });
        });
      });

      // Handle draw end event
      draw.on('drawend', (e: { feature: OLFeature }) => {
        this.zoneHelper.runInsideAngular(() => {
          const uniqueId = `drawn-${Date.now()}`;
          e.feature.setId(uniqueId);

          // Set default properties and styling on raw OL feature
          e.feature.set('name', 'Sketch');
          const defaultStyle = {
            fill: { color: 'rgba(59, 130, 246, 0.2)' },
            stroke: { color: '#3b82f6', width: 2 },
          };
          e.feature.set('__angular_helpers_style__', defaultStyle);

          // Convert to internal Feature representation
          const feature = olFeatureToFeature(e.feature);
          feature.id = uniqueId;
          feature.properties = {
            ...feature.properties,
            name: 'Sketch',
            strokeColor: '#3b82f6',
            strokeWidth: 2,
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
          };
          feature.style = defaultStyle;

          const event: DrawEndEvent = { interactionId: id, feature, type: config.type };
          this.stateService.emitDrawEnd(event);
        });
      });

      map.addInteraction(draw);
      map.addInteraction(snap);

      const managed: ManagedInteraction = {
        id,
        type: 'draw',
        olInteraction: draw,
        config,
        cleanup: () => {
          map.removeInteraction(draw);
          map.removeInteraction(snap);
          draw.dispose();
          snap.dispose();
        },
      };

      this.stateService.addInteraction(managed);
    });

    return true;
  }
}
