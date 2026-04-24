// Provider functions

import type { Provider } from '@angular/core';
import type { OlFeature } from '@angular-helpers/openlayers/core';
import { OlControlService } from '../services/control.service';

export function withControls(): OlFeature<'controls'> {
  return { kind: 'controls', providers: [OlControlService] };
}
export function provideControls(): OlFeature<'controls'> {
  return withControls();
}
