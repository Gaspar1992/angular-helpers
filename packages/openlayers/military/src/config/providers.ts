import type { OlFeature } from '@angular-helpers/openlayers/core';
import { OlMilitaryService } from '../services/military.service';
import { OlTacticalGraphicsService } from '../services/tactical-graphics.service';

export function withMilitary(): OlFeature<'military'> {
  return {
    kind: 'military',
    providers: [OlMilitaryService, OlTacticalGraphicsService],
  };
}
export function provideMilitary(): OlFeature<'military'> {
  return withMilitary();
}
