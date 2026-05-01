import type { Provider } from '@angular/core';
import type { OlFeature } from '@angular-helpers/openlayers/core';
import { OlLayerService } from '@angular-helpers/openlayers/layers';
import { OlPopupService } from '../services/popup.service';

export function withOverlays(): OlFeature<'overlays'> {
  return { kind: 'overlays', providers: [OlLayerService, OlPopupService] };
}
export function provideOverlays(): OlFeature<'overlays'> {
  return withOverlays();
}
