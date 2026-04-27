// Draw interaction creation service

import { inject, Injectable } from '@angular/core';
import type OLMap from 'ol/Map';
import Draw from 'ol/interaction/Draw';
import Snap from 'ol/interaction/Snap';
import VectorSource from 'ol/source/Vector';
import type VectorLayer from 'ol/layer/Vector';
import type { Feature as OLFeature } from 'ol';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import { OlLayerService } from '@angular-helpers/openlayers/layers';
import type { DrawConfig, DrawEndEvent } from '../models/interaction.types';
import type { ManagedInteraction } from './types';
import { InteractionStateService } from './interaction-state.service';
import { olFeatureToFeature } from './feature-utils';

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
      const draw = new Draw({
        source,
        type: config.type,
        freehand: config.freehand ?? false,
        snapTolerance: config.snapTolerance ?? 12,
      });

      const snap = new Snap({ source });

      // Handle draw start event
      draw.on('drawstart', (e: { feature: OLFeature }) => {
        this.zoneHelper.runInsideAngular(() => {
          const feature = olFeatureToFeature(e.feature);
          this.stateService.emitDrawStart({ feature });
        });
      });

      // Handle draw end event
      draw.on('drawend', (e: { feature: OLFeature }) => {
        this.zoneHelper.runInsideAngular(() => {
          const feature = olFeatureToFeature(e.feature);
          const event: DrawEndEvent = { feature, type: config.type };
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
