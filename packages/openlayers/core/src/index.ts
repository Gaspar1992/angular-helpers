// @angular-helpers/openlayers/core

export { OlMapComponent, type MapClickEvent } from './features/map.component';
export {
  OlMapService,
  type AnimationOptions,
  type FitOptions,
  type MapViewOptions,
} from './services/map.service';
export { OlZoneHelper } from './services/zone-helper.service';
export { OlGeometryService } from './services/geometry.service';
export { OlTimeService } from './services/time.service';
export { createVectorResource, type VectorResourceOptions } from './services/vector-resource';
export { olFeatureToFeature, featureToOlFeature } from './utils/feature-utils';
export { provideOpenLayers, type OlFeature, type OlFeatureKind } from './config/providers';
export { withProjections, type Proj4Definition } from './config/with-projections';
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
export type { EllipseConfig, SectorConfig, DonutConfig } from './models/geometry.types';
