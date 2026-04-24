import type { Provider } from '@angular/core';
import type { OlFeature } from '@angular-helpers/openlayers/core';
import { OlMilitaryService } from '../services/military.service';

export function withMilitary(): OlFeature<'military'> {
  return { kind: 'military', providers: [OlMilitaryService] };
}
export function provideMilitary(): OlFeature<'military'> {
  return withMilitary();
}
