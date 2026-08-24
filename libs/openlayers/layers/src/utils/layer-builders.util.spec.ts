import { describe, it, expect } from 'vitest';
import {
  buildVectorLayer,
  buildHeatmapLayer,
  buildTileLayer,
  buildImageLayer,
} from './layer-builders.util';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import ImageStatic from 'ol/source/ImageStatic';
import OLFeature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Fill } from 'ol/style';

describe('layer-builders.util', () => {
  it('builds VectorLayer with custom abstract style and user style function', () => {
    const source = new VectorSource();
    const layer = buildVectorLayer(
      {
        id: 'v-1',
        visible: true,
        opacity: 0.8,
        zIndex: 5,
        coordinateProjection: 'EPSG:4326',
        style: (feat) => new Style({ fill: new Fill({ color: 'green' }) }),
      },
      source,
    );

    expect(layer.get('id')).toBe('v-1');
    expect(layer.getOpacity()).toBe(0.8);
    expect(layer.getZIndex()).toBe(5);

    const styleFn = layer.get('style-fn');
    expect(styleFn).toBeDefined();

    // Test with abstract style on feature
    const featWithAbstractStyle = new OLFeature(new Point([0, 0]));
    featWithAbstractStyle.set('__angular_helpers_style__', {
      icon: { src: 'https://example.com/marker.png' },
      fill: { color: 'blue' },
      stroke: { color: 'red', width: 2 },
    });

    const evaluatedStyle = styleFn(featWithAbstractStyle, 1);
    expect(evaluatedStyle).toBeInstanceOf(Style);

    // Test with regular feature using userStyle function
    const regularFeat = new OLFeature(new Point([10, 10]));
    regularFeat.setId('reg-1');
    const userEvaluatedStyle = styleFn(regularFeat, 1);
    expect(userEvaluatedStyle).toBeInstanceOf(Style);
  });

  it('builds VectorLayer with static Style and default fallback style', () => {
    const source = new VectorSource();
    const staticStyle = new Style({ fill: new Fill({ color: 'yellow' }) });
    const layerWithStatic = buildVectorLayer({ id: 'v-static', style: staticStyle }, source);
    const styleFn = layerWithStatic.get('style-fn');

    const feat = new OLFeature(new Point([0, 0]));
    expect(styleFn(feat, 1)).toBe(staticStyle);

    // Layer without custom style falls back to defaultStyle
    const layerDefault = buildVectorLayer({ id: 'v-default' }, source);
    const defaultFn = layerDefault.get('style-fn');
    expect(defaultFn(feat, 1)).toBeDefined();
  });

  it('builds HeatmapLayer with features, blur, radius, and weight', () => {
    const layer = buildHeatmapLayer({
      id: 'heat-1',
      features: [
        {
          id: 'h1',
          geometry: { type: 'Point', coordinates: [0, 0] },
          properties: { weight: 0.5 },
        },
      ],
      blur: 20,
      radius: 10,
      weight: 'weight',
      zIndex: 2,
    });

    expect(layer.get('id')).toBe('heat-1');
    expect(layer.getBlur()).toBe(20);
    expect(layer.getRadius()).toBe(10);
  });

  it('builds TileLayer', () => {
    const source = new OSM();
    const layer = buildTileLayer({ id: 'tile-1', visible: false, opacity: 0.5, zIndex: 1 }, source);

    expect(layer.get('id')).toBe('tile-1');
    expect(layer.getVisible()).toBe(false);
    expect(layer.getOpacity()).toBe(0.5);
  });

  it('builds ImageLayer', () => {
    const source = new ImageStatic({
      url: 'https://example.com/img.png',
      imageExtent: [0, 0, 10, 10],
    });
    const layer = buildImageLayer({ id: 'img-1', visible: true, opacity: 1, zIndex: 3 }, source);

    expect(layer.get('id')).toBe('img-1');
    expect(layer.getZIndex()).toBe(3);
  });
});
