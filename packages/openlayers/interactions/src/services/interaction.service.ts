// OlInteractionService

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { Feature } from '@angular-helpers/openlayers/core';
import type { InteractionType, DrawConfig } from '../models/interaction.types';

@Injectable()
export class OlInteractionService {
  enableInteraction(type: InteractionType, config: unknown): unknown {
    return null;
  }
  disableInteraction(id: string): void {}
  startDrawing(type: string, options?: DrawConfig): Observable<Feature> {
    return new Observable<Feature>();
  }
}
