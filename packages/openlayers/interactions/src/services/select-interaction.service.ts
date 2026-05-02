// Select interaction creation service

import { inject, Injectable } from '@angular/core';
import type OLMap from 'ol/Map';
import Select from 'ol/interaction/Select';
import type BaseLayer from 'ol/layer/Base';
import type { Feature as OLFeature } from 'ol';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import type { SelectConfig } from '../models/interaction.types';
import type { ManagedInteraction } from './types';
import { InteractionStateService } from './interaction-state.service';
import { olFeatureToFeature } from './feature-utils';

/**
 * Service responsible for creating and managing Select interactions.
 */
@Injectable()
export class SelectInteractionService {
  private mapService = inject(OlMapService);
  private stateService = inject(InteractionStateService);
  private zoneHelper = inject(OlZoneHelper);

  /**
   * Creates and configures a Select interaction.
   * @param id - Unique identifier for the interaction
   * @param config - Select interaction configuration
   * @param map - OpenLayers map instance
   * @returns Promise that resolves when the interaction is created
   */
  createSelectInteraction(id: string, config: SelectConfig, map: OLMap): void {
    this.zoneHelper.runOutsideAngular(() => {
      const select = new Select({
        layers: config.layers
          ? (layer: BaseLayer) => {
              const layerId = layer.get('id');
              return config.layers?.includes(layerId) ?? false;
            }
          : undefined,
        multi: config.multi ?? false,
        hitTolerance: config.hitTolerance ?? 0,
      });

      // Listen to selection changes — use getFeatures().getArray() for the full
      // accumulated collection, not e.selected which only contains newly added ones
      select.on('select', (e: { selected: OLFeature[]; deselected: OLFeature[] }) => {
        this.zoneHelper.runInsideAngular(() => {
          const allSelected = select
            .getFeatures()
            .getArray()
            .map((f) => olFeatureToFeature(f));

          this.stateService.setSelectedFeatures(allSelected);

          this.stateService.emitSelect({
            interactionId: id,
            selected: e.selected.map((f) => olFeatureToFeature(f)),
            deselected: e.deselected.map((f) => olFeatureToFeature(f)),
          });
        });
      });

      map.addInteraction(select);

      const managed: ManagedInteraction = {
        id,
        type: 'select',
        olInteraction: select,
        config,
        cleanup: () => {
          map.removeInteraction(select);
          select.dispose();
        },
      };

      this.stateService.addInteraction(managed);
    });
  }
}
