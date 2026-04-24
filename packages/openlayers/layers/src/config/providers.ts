// Provider functions

import type { Provider } from '@angular/core';
import type { OlFeature } from '@angular-helpers/openlayers/core';
import { OlLayerService } from '../services/layer.service';

export function withLayers(): OlFeature<'layers'> {
  return { kind: 'layers', providers: [OlLayerService] };
}
export function provideLayers(): OlFeature<'layers'> {
  return withLayers();
}
