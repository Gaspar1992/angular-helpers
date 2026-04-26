// @angular-helpers/openlayers/core

export { OlMapComponent, type MapClickEvent } from './features/map.component';
export {
  OlMapService,
  type AnimationOptions,
  type FitOptions,
  type MapViewOptions,
} from './services/map.service';
export { OlZoneHelper } from './services/zone-helper.service';
export { provideOpenLayers, type OlFeature, type OlFeatureKind } from './config/providers';
export type {
  Coordinate,
  Extent,
  Pixel,
  Feature,
  Layer,
  ViewState,
  GeometryType,
  Geometry,
  Style,
  MapConfig,
  ProjectionCode,
} from './models/types';
