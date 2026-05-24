import VectorLayer from 'ol/layer/Vector';
import HeatmapLayer from 'ol/layer/Heatmap';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorSource from 'ol/source/Vector';
import ClusterSource from 'ol/source/Cluster';
import OLFeature from 'ol/Feature';
import type OLMap from 'ol/Map';
import { Style, Circle as CircleStyle, Fill, Stroke, Icon } from 'ol/style';
import { createClusterStyleFn } from './cluster-style.util';
import { featureToOlFeature } from '@angular-helpers/openlayers/core';
import type {
  VectorLayerConfig,
  HeatmapLayerConfig,
  TileLayerConfig,
  ImageLayerConfig,
} from '../models/layer.types';

const STYLE_PROP = '__angular_helpers_style__';

const defaultStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: '#3399CC' }),
    stroke: new Stroke({ color: '#fff', width: 2 }),
  }),
});

export function buildVectorLayer(config: VectorLayerConfig, source: VectorSource | ClusterSource) {
  const clusterCfg = config.cluster;
  const userStyle = config.style;

  const styleFn = (olFeature: any, resolution: number): any => {
    const abstractStyle = olFeature.get(STYLE_PROP);
    if (abstractStyle) {
      const style = new Style();
      const { icon, fill, stroke } = abstractStyle;
      if (icon?.src) {
        style.setImage(
          new Icon({
            src: icon.src,
            ...(icon.size ? { size: icon.size } : {}),
            ...(icon.anchor ? { anchor: icon.anchor } : {}),
          }),
        );
      }
      if (fill) style.setFill(new Fill({ color: fill.color }));
      if (stroke) style.setStroke(new Stroke({ color: stroke.color, width: stroke.width }));
      if (icon?.src || fill || stroke) return style;
    }

    if (userStyle) {
      if (typeof userStyle === 'function') {
        const feature = {
          id: String(olFeature.getId() ?? ''),
          geometry: {
            type: olFeature.getGeometry()?.getType() as any,
            coordinates: [],
          },
          properties: olFeature.getProperties(),
        };
        return (userStyle as any)(feature, resolution);
      }
      return userStyle;
    }

    return defaultStyle;
  };

  const clusterStyleFn = createClusterStyleFn(clusterCfg, styleFn, defaultStyle);

  const layer = new VectorLayer({
    source,
    visible: config.visible ?? true,
    opacity: config.opacity ?? 1,
    zIndex: config.zIndex,
    style: clusterCfg?.enabled ? clusterStyleFn : styleFn,
  });

  layer.set('id', config.id);
  layer.set('cluster-config', clusterCfg);
  layer.set('style-fn', styleFn);
  layer.set('coordinate-projection', config.coordinateProjection);

  return layer;
}

export function buildHeatmapLayer(config: HeatmapLayerConfig) {
  const vectorSource = new VectorSource();

  if (config.features && config.features.length > 0) {
    const olFeatures = config.features.map((f) => featureToOlFeature(f));
    vectorSource.addFeatures(olFeatures);
  }

  const layer = new HeatmapLayer({
    source: vectorSource,
    visible: config.visible ?? true,
    opacity: config.opacity ?? 1,
    zIndex: config.zIndex,
    ...(config.blur !== undefined && { blur: config.blur }),
    ...(config.radius !== undefined && { radius: config.radius }),
    ...(config.weight !== undefined && {
      weight: config.weight as string | ((feature: OLFeature) => number),
    }),
  });

  layer.set('id', config.id);
  return layer;
}

export function buildTileLayer(config: TileLayerConfig, source: any) {
  const layer = new TileLayer({
    source,
    visible: config.visible ?? true,
    opacity: config.opacity ?? 1,
    zIndex: config.zIndex,
  });
  layer.set('id', config.id);
  return layer;
}

export function buildImageLayer(config: ImageLayerConfig, source: any) {
  const layer = new ImageLayer({
    source,
    visible: config.visible ?? true,
    opacity: config.opacity ?? 1,
    zIndex: config.zIndex,
  });
  layer.set('id', config.id);
  return layer;
}
