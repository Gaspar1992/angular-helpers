// @angular-helpers/openlayers/core

export { OlMapComponent } from './features/map/map.component';
export {
  OlMapService,
  type AnimationOptions,
  type FitOptions,
  type MapViewOptions,
} from './services/map.service';
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
