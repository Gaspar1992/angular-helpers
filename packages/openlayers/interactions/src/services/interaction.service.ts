// OlInteractionService - Main orchestrator for OpenLayers interactions

import { inject, Injectable } from '@angular/core';
import type OLMap from 'ol/Map';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import type { SelectConfig, DrawConfig, ModifyConfig } from '../models/interaction.types';
import { InteractionStateService } from './interaction-state.service';
import { SelectInteractionService } from './select-interaction.service';
import { DrawInteractionService } from './draw-interaction.service';
import { ModifyInteractionService } from './modify-interaction.service';

/**
 * Main service for managing OpenLayers map interactions.
 * Orchestrates specialized interaction services and exposes unified API.
 *
 * @example
 * ```typescript
 * const interactionService = inject(OlInteractionService);
 *
 * // Enable select interaction
 * interactionService.enableSelect('select-1', { layers: ['cities'], multi: true });
 *
 * // React to selection changes
 * effect(() => {
 *   const selected = interactionService.selectedFeatures();
 *   console.log('Selected:', selected);
 * });
 * ```
 */
@Injectable()
export class OlInteractionService {
  private mapService = inject(OlMapService);
  private stateService = inject(InteractionStateService);
  private zoneHelper = inject(OlZoneHelper);

  // Specialized interaction services (injected, not instantiated)
  private selectService = inject(SelectInteractionService);
  private drawService = inject(DrawInteractionService);
  private modifyService = inject(ModifyInteractionService);

  // Public signals and observables delegated to state service
  readonly selectedFeatures = this.stateService.selectedFeatures;
  readonly selectionCount = this.stateService.selectionCount;
  readonly hasSelection = this.stateService.hasSelection;
  readonly activeInteractions = this.stateService.activeInteractions;
  readonly drawStart$ = this.stateService.drawStart$;
  readonly drawEnd$ = this.stateService.drawEnd$;
  readonly modify$ = this.stateService.modify$;
  readonly select$ = this.stateService.select$;

  /**
   * Enable a select interaction on the map.
   * @param id - Unique identifier for this interaction
   * @param config - Selection configuration
   * @returns Object with cleanup method
   */
  enableSelect(id: string, config: SelectConfig = {}): { cleanup: () => void } {
    if (this.stateService.findInteraction(id)) {
      return { cleanup: () => this.disableInteraction(id) };
    }

    this.mapService.onReady((map: OLMap) => {
      this.selectService.createSelectInteraction(id, config, map);
    });

    return { cleanup: () => this.disableInteraction(id) };
  }

  /**
   * Enable a draw interaction on the map.
   * @param id - Unique identifier for this interaction
   * @param config - Draw configuration
   * @returns Object with cleanup method and isActive signal
   */
  enableDraw(id: string, config: DrawConfig): { cleanup: () => void; isActive: () => boolean } {
    if (this.stateService.findInteraction(id)) {
      return { cleanup: () => this.disableInteraction(id), isActive: () => false };
    }

    let isActive = false;

    this.mapService.onReady((map: OLMap) => {
      isActive = this.drawService.createDrawInteraction(id, config, map);
    });

    return {
      cleanup: () => this.disableInteraction(id),
      isActive: () => isActive,
    };
  }

  /**
   * Enable a modify interaction on the map.
   * @param id - Unique identifier for this interaction
   * @param config - Modify configuration
   * @returns Object with cleanup method
   */
  enableModify(id: string, config: ModifyConfig = {}): { cleanup: () => void } {
    if (this.stateService.findInteraction(id)) {
      return { cleanup: () => this.disableInteraction(id) };
    }

    this.mapService.onReady((map: OLMap) => {
      this.modifyService.createModifyInteraction(id, config, map);
    });

    return { cleanup: () => this.disableInteraction(id) };
  }

  /**
   * Disable and remove an interaction by id.
   * @param id - The interaction identifier
   */
  disableInteraction(id: string): void {
    const interaction = this.stateService.findInteraction(id);
    if (!interaction) return;

    // Run cleanup outside Angular zone
    this.zoneHelper.runOutsideAngular(() => {
      interaction.cleanup();
    });

    // Remove from state
    this.stateService.removeInteraction(id);

    // Clear selection if this was a select interaction
    if (interaction.type === 'select') {
      this.stateService.clearSelection();
    }
  }

  /**
   * Disable all active interactions.
   */
  disableAll(): void {
    const ids = this.stateService.getInteractions().map((i) => i.id);
    for (const id of ids) {
      this.disableInteraction(id);
    }
  }

  /**
   * Clear the current selection.
   * Also clears the OL Select interaction's internal feature collection so the
   * visual selection is removed from the map.
   */
  clearSelection(): void {
    const interactions = this.stateService.getInteractions();
    for (const managed of interactions) {
      if (managed.type === 'select') {
        this.zoneHelper.runOutsideAngular(() => {
          const olSelect = managed.olInteraction as unknown as {
            getFeatures(): { clear(): void } | undefined;
          };
          olSelect.getFeatures?.()?.clear();
        });
      }
    }
    this.stateService.clearSelection();
  }

  /**
   * Check if an interaction is currently active.
   * @param id - The interaction identifier
   * @returns True if active, false otherwise
   */
  isActive(id: string): boolean {
    return this.stateService.isActive(id);
  }

  /**
   * Get current interaction state.
   * @returns Array of interaction state summaries
   */
  getInteractionState() {
    return this.stateService.getInteractionState();
  }
}
