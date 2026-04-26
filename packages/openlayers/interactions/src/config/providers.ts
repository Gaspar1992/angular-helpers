import type { Provider } from '@angular/core';
import type { OlFeature } from '@angular-helpers/openlayers/core';
import { OlInteractionService } from '../services/interaction.service';
import { InteractionStateService } from '../services/interaction-state.service';
import { SelectInteractionService } from '../services/select-interaction.service';
import { DrawInteractionService } from '../services/draw-interaction.service';
import { ModifyInteractionService } from '../services/modify-interaction.service';
import type { SelectConfig, DrawConfig, ModifyConfig } from '../models/interaction.types';

/**
 * Provide the interactions feature with OlInteractionService and all specialized services.
 * Note: ZoneHelper is inherited from core's provideOpenLayers.
 * @returns OlFeature configuration for interactions
 */
export function withInteractions(): OlFeature<'interactions'> {
  return {
    kind: 'interactions',
    providers: [
      OlInteractionService,
      InteractionStateService,
      SelectInteractionService,
      DrawInteractionService,
      ModifyInteractionService,
    ],
  };
}

/**
 * Alias for withInteractions().
 * @returns OlFeature configuration for interactions
 */
export function provideInteractions(): OlFeature<'interactions'> {
  return withInteractions();
}

/**
 * Enable select interaction when providing the interactions feature.
 * @param id Unique identifier for this interaction
 * @param config Select interaction configuration
 * @returns Provider function that enables select interaction
 */
export function withSelectInteraction(id: string, config: SelectConfig = {}): Provider {
  return {
    provide: 'SELECT_INTERACTION_CONFIG',
    useFactory: (service: OlInteractionService) => {
      service.enableSelect(id, config);
      return { id, config };
    },
    deps: [OlInteractionService],
  };
}

/**
 * Enable draw interaction when providing the interactions feature.
 * @param id Unique identifier for this interaction
 * @param config Draw interaction configuration
 * @returns Provider function that enables draw interaction
 */
export function withDrawInteraction(id: string, config: DrawConfig): Provider {
  return {
    provide: 'DRAW_INTERACTION_CONFIG',
    useFactory: (service: OlInteractionService) => {
      service.enableDraw(id, config);
      return { id, config };
    },
    deps: [OlInteractionService],
  };
}

/**
 * Enable modify interaction when providing the interactions feature.
 * @param id Unique identifier for this interaction
 * @param config Modify interaction configuration
 * @returns Provider function that enables modify interaction
 */
export function withModifyInteraction(id: string, config: ModifyConfig = {}): Provider {
  return {
    provide: 'MODIFY_INTERACTION_CONFIG',
    useFactory: (service: OlInteractionService) => {
      service.enableModify(id, config);
      return { id, config };
    },
    deps: [OlInteractionService],
  };
}
