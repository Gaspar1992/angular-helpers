import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpiderficationManager } from './spiderfication.manager';
import OLFeature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

describe('SpiderficationManager', () => {
  let manager: SpiderficationManager;
  let layerCache: Map<string, any>;
  let mapMock: any;
  let eventListeners: Record<string, Function>;

  beforeEach(() => {
    eventListeners = {};
    layerCache = new Map<string, any>();
    manager = new SpiderficationManager(layerCache);

    mapMock = {
      addLayer: vi.fn(),
      getView: () => ({
        getResolution: () => 1,
      }),
      on: vi.fn((event: string, handler: Function) => {
        eventListeners[event] = handler;
      }),
      forEachFeatureAtPixel: vi.fn(),
    };
  });

  it('registers on map and adds spider layer', () => {
    manager.register(mapMock);

    expect(mapMock.addLayer).toHaveBeenCalledOnce();
    expect(mapMock.on).toHaveBeenCalledWith('movestart', expect.any(Function));
    expect(mapMock.on).toHaveBeenCalledWith('singleclick', expect.any(Function));

    // Second register call is a no-op
    manager.register(mapMock);
    expect(mapMock.addLayer).toHaveBeenCalledOnce();
  });

  it('unspiderfies on movestart event', () => {
    manager.register(mapMock);

    // Trigger movestart
    expect(eventListeners['movestart']).toBeDefined();
    eventListeners['movestart']();
  });

  it('spiderfies small clusters (<=8 features) with circular layout on click', async () => {
    vi.useFakeTimers();
    manager.register(mapMock);

    const clusterFeature = new OLFeature(new Point([100, 100]));
    const childFeatures = [
      new OLFeature(new Point([100, 100])),
      new OLFeature(new Point([101, 101])),
      new OLFeature(new Point([102, 102])),
    ];
    clusterFeature.set('features', childFeatures);

    const clusterLayer = new VectorLayer({
      source: new VectorSource(),
      properties: {
        id: 'cluster-layer',
        'cluster-config': {
          spiderfyOnSelect: true,
        },
      },
    });

    mapMock.forEachFeatureAtPixel.mockImplementation((pixel: any, cb: Function) => {
      cb(clusterFeature, clusterLayer);
    });

    // Trigger singleclick
    eventListeners['singleclick']({ pixel: [50, 50] });

    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('spiderfies large clusters (>8 features) with spiral layout', async () => {
    vi.useFakeTimers();
    manager.register(mapMock);

    const clusterFeature = new OLFeature(new Point([200, 200]));
    const childFeatures = Array.from(
      { length: 12 },
      (_, i) => new OLFeature(new Point([200 + i, 200 + i])),
    );
    clusterFeature.set('features', childFeatures);

    const clusterLayer = new VectorLayer({
      source: new VectorSource(),
      properties: {
        id: 'cluster-layer-large',
        'cluster-config': {
          spiderfyOnSelect: true,
        },
      },
    });

    mapMock.forEachFeatureAtPixel.mockImplementation((pixel: any, cb: Function) => {
      cb(clusterFeature, clusterLayer);
    });

    eventListeners['singleclick']({ pixel: [100, 100] });

    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('handles click on a spider leg item and invokes onSpiderfyClick callback', () => {
    manager.register(mapMock);

    const onSpiderfyClickSpy = vi.fn();
    const clusterLayerObj = new VectorLayer({
      source: new VectorSource(),
      properties: {
        id: 'layer-with-callback',
        'cluster-config': {
          onSpiderfyClick: onSpiderfyClickSpy,
        },
      },
    });
    layerCache.set('layer-with-callback', clusterLayerObj);

    const originalFeature = new OLFeature(new Point([50, 50]));
    originalFeature.setId('orig-1');

    const spiderLegFeature = new OLFeature(new Point([55, 55]));
    spiderLegFeature.set('spider-feature', originalFeature);
    spiderLegFeature.set('cluster-layer-id', 'layer-with-callback');

    // spider layer is the added layer
    const spiderLayer = mapMock.addLayer.mock.calls[0][0];

    mapMock.forEachFeatureAtPixel.mockImplementation((pixel: any, cb: Function) => {
      cb(spiderLegFeature, spiderLayer);
    });

    eventListeners['singleclick']({ pixel: [55, 55] });

    expect(onSpiderfyClickSpy).toHaveBeenCalledOnce();
  });
});
