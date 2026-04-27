// @angular-helpers/openlayers/overlays

export { OlPopupComponent } from './features/popup.component';
export { OlTooltipDirective } from './features/tooltip.directive';
export { OlPopupService } from './services/popup.service';
export { withOverlays, provideOverlays } from './config/providers';
export type {
  OverlayConfig,
  OverlayPositioning,
  PopupComponentOptions,
  PopupHandle,
  PopupOpenOptions,
} from './models/overlay.types';
// Deprecated aliases kept for backwards compatibility with the v0.2.x stub API.
export type { OverlayPosition, PopupOptions } from './models/overlay.types';
