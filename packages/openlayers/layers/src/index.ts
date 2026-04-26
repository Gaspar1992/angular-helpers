// @angular-helpers/openlayers/layers

export { OlVectorLayerComponent } from './features/vector-layer.component';
export { OlTileLayerComponent } from './features/tile-layer.component';
export { OlImageLayerComponent } from './features/image-layer.component';
export { OlLayerService, type LayerInfo } from './services/layer.service';
export { withLayers, provideLayers } from './config/providers';
export type {
  LayerConfig,
  VectorLayerConfig,
  TileLayerConfig,
  ImageLayerConfig,
  SourceConfig,
  ImageSourceConfig,
} from './models/layer.types';
