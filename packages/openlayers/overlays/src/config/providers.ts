import type { Provider } from '@angular/core';
import type { OlFeature } from '@angular-helpers/openlayers/core';
import { OlPopupService } from '../services/popup.service';

export function withOverlays(): OlFeature<'overlays'> {
  return { kind: 'overlays', providers: [OlPopupService] };
}
export function provideOverlays(): OlFeature<'overlays'> {
  return withOverlays();
}
