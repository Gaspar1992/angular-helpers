import { describe, it, expect } from 'vitest';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import OLFeature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { createClusterStyleFn } from './cluster-style.util';

describe('cluster-style.util', () => {
  const defaultStyle = new Style({
    image: new CircleStyle({ radius: 5, fill: new Fill({ color: 'blue' }) }),
  });

  it('renders cluster badge when feature count > 1 with showCount=true', () => {
    const styleFn = createClusterStyleFn({ showCount: true }, undefined, defaultStyle);

    const f1 = new OLFeature(new Point([0, 0]));
    const f2 = new OLFeature(new Point([1, 1]));
    const clusterFeat = new OLFeature(new Point([0.5, 0.5]));
    clusterFeat.set('features', [f1, f2]);

    const style = styleFn(clusterFeat, 1);
    expect(style).toBeInstanceOf(Style);
    expect(style.getText()?.getText()).toBe('2');
    expect(style.getImage()).toBeDefined();
  });

  it('renders cluster badge without text when showCount=false', () => {
    const styleFn = createClusterStyleFn({ showCount: false }, undefined, defaultStyle);

    const f1 = new OLFeature(new Point([0, 0]));
    const f2 = new OLFeature(new Point([1, 1]));
    const clusterFeat = new OLFeature(new Point([0.5, 0.5]));
    clusterFeat.set('features', [f1, f2]);

    const style = styleFn(clusterFeat, 1);
    expect(style).toBeInstanceOf(Style);
    expect(style.getText()).toBeNull();
  });

  it('unwraps single feature and applies featureStyle override', () => {
    const customStyle = new Style({
      fill: new Fill({ color: 'purple' }),
    });

    const styleFn = createClusterStyleFn(
      { featureStyle: customStyle as any },
      undefined,
      defaultStyle,
    );

    const singleFeature = new OLFeature(new Point([10, 20]));
    const clusterFeat = new OLFeature();
    clusterFeat.set('features', [singleFeature]);

    const style = styleFn(clusterFeat, 1);
    expect(style).toBeInstanceOf(Style);
    expect(style.getGeometry()).toEqual(singleFeature.getGeometry());
  });

  it('unwraps single feature and applies styleFn when no featureStyle', () => {
    const layerStyle = new Style({
      stroke: new Stroke({ color: 'orange', width: 4 }),
    });
    const layerStyleFn = () => layerStyle;

    const styleFn = createClusterStyleFn(undefined, layerStyleFn, defaultStyle);

    const singleFeature = new OLFeature(new Point([5, 5]));
    const clusterFeat = new OLFeature();
    clusterFeat.set('features', [singleFeature]);

    const style = styleFn(clusterFeat, 1);
    expect(style).toBeInstanceOf(Style);
    expect(style.getGeometry()).toEqual(singleFeature.getGeometry());
  });

  it('falls back to defaultStyle when no cluster features and no styleFn', () => {
    const styleFn = createClusterStyleFn(undefined, undefined, defaultStyle);

    const emptyClusterFeat = new OLFeature();
    emptyClusterFeat.set('features', []);

    const style = styleFn(emptyClusterFeat, 1);
    expect(style).toBe(defaultStyle);
  });
});
