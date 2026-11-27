import { ENVIRONMENT_INITIALIZER, inject } from '@angular/core';
import type { OlFeature } from '@angular-helpers/openlayers/core';
import { OlLayerService } from '@angular-helpers/openlayers/layers';
import { OlInteractionService } from '../services/interaction.service';
import { InteractionStateService } from '../services/interaction-state.service';
import { SelectInteractionService } from '../services/select-interaction.service';
import { DrawInteractionService } from '../services/draw-interaction.service';
import { ModifyInteractionService } from '../services/modify-interaction.service';
import { MeasurementInteractionService } from '../services/measurement-interaction.service';
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
      OlLayerService, // DX: interactions often need layers
      OlInteractionService,
      InteractionStateService,
      SelectInteractionService,
      DrawInteractionService,
      ModifyInteractionService,
      MeasurementInteractionService,
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
export function withSelectInteraction(
  id: string,
  config: SelectConfig = {},
): OlFeature<'interactions'> {
  return {
    kind: 'interactions',
    providers: [
      {
        provide: ENVIRONMENT_INITIALIZER,
        multi: true,
        useValue: () => {
          inject(OlInteractionService).enableSelect(id, config);
        },
      },
    ],
  };
}

/**
 * Enable draw interaction when providing the interactions feature.
 * @param id Unique identifier for this interaction
 * @param config Draw interaction configuration
 * @returns OlFeature configuration that enables draw interaction
 */
export function withDrawInteraction(id: string, config: DrawConfig): OlFeature<'interactions'> {
  return {
    kind: 'interactions',
    providers: [
      {
        provide: ENVIRONMENT_INITIALIZER,
        multi: true,
        useValue: () => {
          inject(OlInteractionService).enableDraw(id, config);
        },
      },
    ],
  };
}

/**
 * Enable modify interaction when providing the interactions feature.
 * @param id Unique identifier for this interaction
 * @param config Modify interaction configuration
 * @returns OlFeature configuration that enables modify interaction
 */
export function withModifyInteraction(
  id: string,
  config: ModifyConfig = {},
): OlFeature<'interactions'> {
  return {
    kind: 'interactions',
    providers: [
      {
        provide: ENVIRONMENT_INITIALIZER,
        multi: true,
        useValue: () => {
          inject(OlInteractionService).enableModify(id, config);
        },
      },
    ],
  };
}

/**
 * Enable measurement interaction when providing the interactions feature.
 * @returns OlFeature configuration that initializes measurement interaction service
 */
export function withMeasurementInteraction(): OlFeature<'interactions'> {
  return {
    kind: 'interactions',
    providers: [
      {
        provide: ENVIRONMENT_INITIALIZER,
        multi: true,
        useValue: () => {
          inject(MeasurementInteractionService);
        },
      },
    ],
  };
}
