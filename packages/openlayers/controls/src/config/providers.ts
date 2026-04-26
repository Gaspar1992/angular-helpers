// Provider functions

import type { OlFeature } from '@angular-helpers/openlayers/core';
import { OlControlService } from '../services/control.service';
import { ROTATE_CONTROL_MAP_SERVICE } from '../features/rotate-control.component';

/**
 * Provides control services and configures the rotate control map service alias.
 * Requires OlMapService to be provided at the application level.
 */
export function withControls(): OlFeature<'controls'> {
  return {
    kind: 'controls',
    providers: [
      OlControlService,
      // Alias OlMapService to ROTATE_CONTROL_MAP_SERVICE for rotate control
      {
        provide: ROTATE_CONTROL_MAP_SERVICE,
        useFactory: () => {
          // This will be resolved when OlMapService is available
          return { getMap: () => null };
        },
      },
    ],
  };
}
export function provideControls(): OlFeature<'controls'> {
  return withControls();
}
