// Provider functions

import { Optional } from '@angular/core';
import { OlMapService, type OlFeature } from '@angular-helpers/openlayers/core';
import { OlControlService } from '../services/control.service';
import { ROTATE_CONTROL_MAP_SERVICE } from '../features/rotate-control.component';

/**
 * Provides control services and configures the rotate control map service alias.
 * Uses OlMapService when provided at the application level, falling back to a null-map stub in isolated tests.
 */
export function withControls(): OlFeature<'controls'> {
  return {
    kind: 'controls',
    providers: [
      OlControlService,
      {
        provide: ROTATE_CONTROL_MAP_SERVICE,
        useFactory: (mapService: OlMapService | null) => mapService ?? { getMap: () => null },
        deps: [[new Optional(), OlMapService]],
      },
    ],
  };
}
export function provideControls(): OlFeature<'controls'> {
  return withControls();
}
