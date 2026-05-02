// Modify interaction creation service

import { inject, Injectable } from '@angular/core';
import type OLMap from 'ol/Map';
import Modify from 'ol/interaction/Modify';
import type VectorSource from 'ol/source/Vector';
import type VectorLayer from 'ol/layer/Vector';
import type { Feature as OLFeature } from 'ol';
import { OlZoneHelper } from '@angular-helpers/openlayers/core';
import { OlLayerService } from '@angular-helpers/openlayers/layers';
import type { ModifyConfig, ModifyEvent } from '../models/interaction.types';
import type { ManagedInteraction } from './types';
import { InteractionStateService } from './interaction-state.service';
import { olFeatureToFeature } from './feature-utils';
import Snap from 'ol/interaction/Snap';

/**
 * Service responsible for creating and managing Modify interactions.
 */
@Injectable()
export class ModifyInteractionService {
  private layerService = inject(OlLayerService);
  private stateService = inject(InteractionStateService);
  private zoneHelper = inject(OlZoneHelper);

  /**
   * Creates and configures a Modify interaction.
   * @param id - Unique identifier for the interaction
   * @param config - Modify interaction configuration
   * @param map - OpenLayers map instance
   */
  createModifyInteraction(id: string, config: ModifyConfig, map: OLMap): void {
    this.zoneHelper.runOutsideAngular(() => {
      let source: VectorSource | undefined;

      if (config.source) {
        const layer = this.layerService.getLayer(config.source) as
          | VectorLayer<VectorSource>
          | undefined;
        source = layer?.getSource() ?? undefined;
      }

      if (!source) {
        // No source available, cannot create modify interaction
        return;
      }

      const modify = new Modify({
        source,
        pixelTolerance: config.snapTolerance ?? 10,
      });

      const snap = new Snap({ source: source });

      // Handle modify start event
      modify.on('modifystart', (e: { features: { getArray: () => OLFeature[] } }) => {
        this.zoneHelper.runInsideAngular(() => {
          const features = e.features.getArray().map((f) => olFeatureToFeature(f));
          const event: ModifyEvent = { interactionId: id, features, type: 'modifystart' };
          this.stateService.emitModify(event);
        });
      });

      // Handle modify end event
      modify.on('modifyend', (e: { features: { getArray: () => OLFeature[] } }) => {
        this.zoneHelper.runInsideAngular(() => {
          const features = e.features.getArray().map((f) => olFeatureToFeature(f));
          const event: ModifyEvent = { interactionId: id, features, type: 'modifyend' };
          this.stateService.emitModify(event);
        });
      });

      map.addInteraction(modify);
      map.addInteraction(snap);

      const managed: ManagedInteraction = {
        id,
        type: 'modify',
        olInteraction: modify,
        config,
        cleanup: () => {
          map.removeInteraction(modify);
          map.removeInteraction(snap);
          modify.dispose();
          snap.dispose();
        },
      };

      this.stateService.addInteraction(managed);
    });
  }
}
