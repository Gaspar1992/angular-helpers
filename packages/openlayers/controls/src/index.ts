// @angular-helpers/openlayers/controls

export { OlZoomControlComponent } from './features/zoom-control.component';
export { OlAttributionControlComponent } from './features/attribution-control.component';
export { OlScaleLineControlComponent } from './features/scale-line-control.component';
export { OlFullscreenControlComponent } from './features/fullscreen-control.component';
export {
  OlRotateControlComponent,
  ROTATE_CONTROL_MAP_SERVICE,
  type RotateControlMapService,
} from './features/rotate-control.component';
export { OlLayerSwitcherComponent } from './features/layer-switcher.component';
export { OlBasemapSwitcherComponent } from './features/basemap-switcher.component';
export { OlControlService } from './services/control.service';
export { withControls, provideControls } from './config/providers';
export type { ControlPosition, ControlConfig } from './models/control.types';

// Types from new dedicated files
export type { LayerSwitcherItem, LayerSwitcherPosition } from './models/layer-switcher.types';
export type { BasemapConfig, BasemapSwitcherPosition } from './models/basemap-switcher.types';
