import type { Provider } from '@angular/core';
import type { OlFeature } from '@angular-helpers/openlayers/core';
import { OlInteractionService } from '../services/interaction.service';

export function withInteractions(): OlFeature<'interactions'> {
  return { kind: 'interactions', providers: [OlInteractionService] };
}
export function provideInteractions(): OlFeature<'interactions'> {
  return withInteractions();
}
