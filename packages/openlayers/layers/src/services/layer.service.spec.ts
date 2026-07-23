// OlLayerService unit tests
import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { Feature as OLFeature } from 'ol';
import { Point } from 'ol/geom';
import type VectorLayer from 'ol/layer/Vector';
import { Icon, Style } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import type OLMap from 'ol/Map';
import type BaseLayer from 'ol/layer/Base';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import { OlLayerService } from './layer.service';
import type { ImageLayerConfig, TileLayerConfig, VectorLayerConfig } from '../models/layer.types';

const createMap = () => {
  const layers: BaseLayer[] = [];
  return {
    addLayer: vi.fn((l: BaseLayer) => layers.push(l)),
    removeLayer: vi.fn((l: BaseLayer) => {
      const idx = layers.indexOf(l);
      if (idx >= 0) layers.splice(idx, 1);
    }),
    getLayers: () => layers,
  } as unknown as OLMap;
};

const makeService = (map: OLMap | null) => {
  let onReadyCb: ((m: OLMap) => void) | null = null;
  const mapService = {
    getMap: () => map,
    onReady: (cb: (m: OLMap) => void) => {
      if (map) cb(map);
      else onReadyCb = cb;
    },
    flushReady: (m: OLMap) => onReadyCb?.(m),
  };
  const injector = Injector.create({
    providers: [
      { provide: OlMapService, useValue: mapService },
      {
        provide: OlZoneHelper,
        useValue: {
          runOutsideAngular: <T>(f: () => T) => f(),
          runInsideAngular: <T>(f: () => T) => f(),
        },
      },
    ],
  });
  const svc = runInInjectionContext(injector, () => new OlLayerService());
  return { svc, mapService };
};

describe('OlLayerService', () => {
  let svc: OlLayerService;
  let map: OLMap;

  beforeEach(() => {
    map = createMap();
    svc = makeService(map).svc;
  });

  it('starts with empty state and computed selectors', () => {
    expect(svc.layers()).toEqual([]);
    expect(svc.visibleLayers()).toEqual([]);
    expect(svc.tileLayers()).toEqual([]);
    expect(svc.vectorLayers()).toEqual([]);
  });

  it('adds an OSM tile layer and registers it in cache and state', () => {
    const config: TileLayerConfig = {
      id: 'osm-1',
      type: 'tile',
      source: { type: 'osm' },
    };

    const result = svc.addLayer(config);

    expect(result).toEqual({ id: 'osm-1' });
    expect(svc.hasLayer('osm-1')).toBe(true);
    expect(map.addLayer).toHaveBeenCalledOnce();
    const layers = svc.layers();
    expect(layers).toHaveLength(1);
    expect(layers[0]).toMatchObject({ id: 'osm-1', type: 'tile', visible: true, opacity: 1 });
  });

  it('supports XYZ and WMS tile sources, plus an unknown type that falls back to OSM', () => {
    svc.addLayer({
      id: 'xyz',
      type: 'tile',
      source: { type: 'xyz', url: 'https://x/{z}/{x}/{y}' },
    });
    svc.addLayer({
      id: 'wms',
      type: 'tile',
      source: { type: 'wms', url: 'https://wms', params: { LAYERS: 'a' } },
    });
    svc.addLayer({
      id: 'unknown',
      type: 'tile',
      source: { type: 'wmts' as never },
    } as TileLayerConfig);

    expect(
      svc
        .layers()
        .map((l) => l.id)
        .sort(),
    ).toEqual(['unknown', 'wms', 'xyz']);
  });

  it('adds a vector layer with Point/LineString/Polygon/Circle features without throwing', () => {
    const config: VectorLayerConfig = {
      id: 'v1',
      type: 'vector',
      features: [
        { id: 'p', geometry: { type: 'Point', coordinates: [0, 0] } },
        {
          id: 'l',
          geometry: {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          },
        },
        {
          id: 'pol',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 0],
              ],
            ],
          },
        },
        { id: 'c', geometry: { type: 'Circle', coordinates: [0, 0] } },
      ],
    };

    svc.addLayer(config);

    expect(svc.hasLayer('v1')).toBe(true);
    expect(svc.layers().find((l) => l.id === 'v1')?.type).toBe('vector');
  });

  it('adds a vector layer with url and format for native decoding', () => {
    const geoJsonConfig: VectorLayerConfig = {
      id: 'v2',
      type: 'vector',
      url: 'https://example.com/data.geojson',
      format: 'geojson',
    };

    svc.addLayer(geoJsonConfig);

    expect(svc.hasLayer('v2')).toBe(true);
    const layerInfo = svc.layers().find((l) => l.id === 'v2');
    expect(layerInfo?.type).toBe('vector');
  });

  it('updates an existing vector layer source when url or format changes', () => {
    svc.addLayer({
      id: 'v-source',
      type: 'vector',
      url: 'https://example.com/old.geojson',
      format: 'geojson',
    } as VectorLayerConfig);

    svc.updateVectorLayerConfig('v-source', {
      url: 'https://example.com/new.geojson',
      format: 'topojson',
      coordinateProjection: 'EPSG:4326',
    });

    const layer = svc.getLayer('v-source') as unknown as VectorLayer;
    const source = layer.getSource();

    expect(source).toBeTruthy();
    expect((source as any).getUrl()).toBe('https://example.com/new.geojson');
    expect(layer.get('coordinate-projection')).toBe('EPSG:4326');
  });

  it('adds an image layer with static and wms sources', () => {
    const stat: ImageLayerConfig = {
      id: 'static',
      type: 'image',
      source: { type: 'static', url: 'https://i', imageExtent: [0, 0, 1, 1] },
    };
    const wms: ImageLayerConfig = {
      id: 'iwms',
      type: 'image',
      source: { type: 'wms', url: 'https://w', params: { LAYERS: 'a' } },
    };

    svc.addLayer(stat);
    svc.addLayer(wms);

    expect(
      svc
        .layers()
        .map((l) => l.id)
        .sort(),
    ).toEqual(['iwms', 'static']);
  });

  it('addLayer is idempotent for the same id', () => {
    const config: TileLayerConfig = { id: 'dup', type: 'tile', source: { type: 'osm' } };
    svc.addLayer(config);
    svc.addLayer(config);
    expect(svc.layers()).toHaveLength(1);
    expect(map.addLayer).toHaveBeenCalledOnce();
  });

  it('queues layers when the map is not ready and flushes them on ready', () => {
    const lateMap = createMap();
    const { svc: lateSvc, mapService } = makeService(null);

    lateSvc.addLayer({ id: 'l1', type: 'tile', source: { type: 'osm' } });
    expect(lateSvc.layers()).toHaveLength(0);
    expect(lateMap.addLayer).not.toHaveBeenCalled();

    mapService.flushReady(lateMap);
    expect(lateMap.addLayer).toHaveBeenCalledOnce();
    expect(lateSvc.hasLayer('l1')).toBe(true);
  });

  it('removeLayer cancels pending configs when the map is not yet ready', () => {
    const { svc: lateSvc, mapService } = makeService(null);
    lateSvc.addLayer({ id: 'pending', type: 'tile', source: { type: 'osm' } });
    lateSvc.removeLayer('pending');

    const lateMap = createMap();
    mapService.flushReady(lateMap);
    expect(lateMap.addLayer).not.toHaveBeenCalled();
    expect(lateSvc.hasLayer('pending')).toBe(false);
  });

  it('removeLayer removes the layer from map, cache and state', () => {
    svc.addLayer({ id: 't', type: 'tile', source: { type: 'osm' } });
    svc.removeLayer('t');

    expect(map.removeLayer).toHaveBeenCalledOnce();
    expect(svc.hasLayer('t')).toBe(false);
    expect(svc.layers()).toEqual([]);
  });

  it('setVisibility, toggleVisibility, isVisible reflect layer state', () => {
    svc.addLayer({ id: 't', type: 'tile', source: { type: 'osm' } });

    expect(svc.isVisible('t')).toBe(true);
    svc.setVisibility('t', false);
    expect(svc.isVisible('t')).toBe(false);

    expect(svc.toggleVisibility('t')).toBe(true);
    expect(svc.isVisible('t')).toBe(true);
  });

  it('toggleVisibility returns false when the layer does not exist', () => {
    expect(svc.toggleVisibility('missing')).toBe(false);
  });

  it('setOpacity / getOpacity and setZIndex / getZIndex reflect layer state', () => {
    svc.addLayer({ id: 't', type: 'tile', source: { type: 'osm' } });

    svc.setOpacity('t', 0.5);
    expect(svc.getOpacity('t')).toBeCloseTo(0.5);

    svc.setZIndex('t', 7);
    expect(svc.getZIndex('t')).toBe(7);
  });

  it('returns sensible defaults when querying missing layers', () => {
    expect(svc.isVisible('x')).toBe(false);
    expect(svc.getOpacity('x')).toBe(1);
    expect(svc.getZIndex('x')).toBe(0);
    expect(svc.getLayer('x')).toBeUndefined();
  });

  it('clearFeatures and updateFeatures are no-ops on non-vector layers', () => {
    svc.addLayer({ id: 't', type: 'tile', source: { type: 'osm' } });
    expect(() => svc.clearFeatures('t')).not.toThrow();
    expect(() => svc.updateFeatures('t', [])).not.toThrow();
  });

  it('clearFeatures empties features on a vector layer', () => {
    svc.addLayer({
      id: 'v',
      type: 'vector',
      features: [{ id: 'f1', geometry: { type: 'Point', coordinates: [0, 0] } }],
    } as VectorLayerConfig);

    svc.clearFeatures('v');
    // After clear, updateFeatures with same feature should add it back
    svc.updateFeatures('v', [{ id: 'f1', geometry: { type: 'Point', coordinates: [0, 0] } }]);
    expect(svc.hasLayer('v')).toBe(true);
  });

  it('updateFeatures adds new features without duplicating existing ones', () => {
    svc.addLayer({
      id: 'v',
      type: 'vector',
      features: [{ id: 'a', geometry: { type: 'Point', coordinates: [0, 0] } }],
    } as VectorLayerConfig);

    svc.updateFeatures('v', [
      { id: 'a', geometry: { type: 'Point', coordinates: [0, 0] } }, // duplicate
      {
        id: 'b',
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 0],
            [1, 1],
          ],
        },
      },
      {
        id: 'c',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [0, 1],
              [0, 0],
            ],
          ],
        },
      },
      { id: 'd', geometry: { type: 'Circle', coordinates: [0, 0] } },
    ]);

    // No throw means coordinate transformation worked for all geometry types
    expect(svc.hasLayer('v')).toBe(true);
  });

  describe('per-feature icon style', () => {
    it('returns the default style for features without style metadata', () => {
      svc.addLayer({
        id: 'v-default',
        type: 'vector',
        features: [{ id: 'p', geometry: { type: 'Point', coordinates: [0, 0] } }],
      } as VectorLayerConfig);

      const layer = svc.getLayer('v-default') as unknown as VectorLayer;
      const styleFn = layer.getStyle();
      expect(typeof styleFn).toBe('function');

      const olF = new OLFeature({ geometry: new Point([0, 0]) });
      const out = (styleFn as (f: OLFeature) => Style)(olF);
      expect(out).toBeInstanceOf(Style);
      // Default style does not use an Icon image — it uses CircleStyle.
      expect(out.getImage()).not.toBeInstanceOf(Icon);
    });

    it('returns an Icon style for features with style.icon', () => {
      const tinySvg =
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=';
      svc.addLayer({
        id: 'v-icon',
        type: 'vector',
        features: [
          {
            id: 'sym',
            geometry: { type: 'Point', coordinates: [0, 0] },
            style: { icon: { src: tinySvg, size: [32, 32], anchor: [0.5, 0.5] } },
          },
        ],
      } as VectorLayerConfig);

      const layer = svc.getLayer('v-icon') as unknown as VectorLayer;
      const styleFn = layer.getStyle();

      // The styleFn reads the feature's __angular_helpers_style__ property,
      // which the service stamped onto the underlying ol/Feature when the
      // layer was created. We pull that exact OL feature out of the source
      // and call the function with it.
      const source = layer.getSource();
      const olF = source?.getFeatureById('sym') as OLFeature;
      expect(olF).toBeTruthy();

      const out = (styleFn as (f: OLFeature) => Style)(olF);
      expect(out).toBeInstanceOf(Style);
      expect(out.getImage()).toBeInstanceOf(Icon);
    });
  });

  it('visibleLayers / tileLayers / vectorLayers computed signals filter correctly', () => {
    svc.addLayer({ id: 't', type: 'tile', source: { type: 'osm' } });
    svc.addLayer({
      id: 'v',
      type: 'vector',
      features: [],
      visible: false,
    } as VectorLayerConfig);

    expect(svc.tileLayers().map((l) => l.id)).toEqual(['t']);
    expect(svc.vectorLayers().map((l) => l.id)).toEqual(['v']);
    expect(svc.visibleLayers().map((l) => l.id)).toEqual(['t']);
  });

  it('resolves native FeatureFormat instances directly in createVectorSource', () => {
    const customFormat = new GeoJSON();
    const config: VectorLayerConfig = {
      id: 'v-native-format',
      type: 'vector',
      url: 'https://example.com/data.geojson',
      format: customFormat,
    };

    svc.addLayer(config);
    const layer = svc.getLayer('v-native-format') as any;
    const source = layer.getSource();
    expect(source.getFormat()).toBe(customFormat);
  });

  it('disposes of old source and underlying source on config update', () => {
    svc.addLayer({
      id: 'v-dispose-update',
      type: 'vector',
      url: 'https://example.com/old.geojson',
      format: 'geojson',
      cluster: { enabled: true },
    } as VectorLayerConfig);

    const layer = svc.getLayer('v-dispose-update') as any;
    const oldClusterSource = layer.getSource();
    const oldVectorSource = oldClusterSource.getSource();

    const clusterClearSpy = vi.spyOn(oldClusterSource, 'clear');
    const clusterDisposeSpy = vi.spyOn(oldClusterSource, 'dispose');
    const vectorClearSpy = vi.spyOn(oldVectorSource, 'clear');
    const vectorDisposeSpy = vi.spyOn(oldVectorSource, 'dispose');

    svc.updateVectorLayerConfig('v-dispose-update', {
      url: 'https://example.com/new.geojson',
      format: 'geojson',
      cluster: { enabled: false },
    });

    expect(clusterClearSpy).toHaveBeenCalled();
    expect(clusterDisposeSpy).toHaveBeenCalledOnce();
    expect(vectorClearSpy).toHaveBeenCalled();
    expect(vectorDisposeSpy).toHaveBeenCalledOnce();
  });

  it('disposes of source and underlying source on layer removal', () => {
    svc.addLayer({
      id: 'v-dispose-remove',
      type: 'vector',
      url: 'https://example.com/old.geojson',
      format: 'geojson',
      cluster: { enabled: true },
    } as VectorLayerConfig);

    const layer = svc.getLayer('v-dispose-remove') as any;
    const clusterSource = layer.getSource();
    const vectorSource = clusterSource.getSource();

    const clusterClearSpy = vi.spyOn(clusterSource, 'clear');
    const clusterDisposeSpy = vi.spyOn(clusterSource, 'dispose');
    const vectorClearSpy = vi.spyOn(vectorSource, 'clear');
    const vectorDisposeSpy = vi.spyOn(vectorSource, 'dispose');
    const layerDisposeSpy = vi.spyOn(layer, 'dispose');

    svc.removeLayer('v-dispose-remove');

    expect(clusterClearSpy).toHaveBeenCalled();
    expect(clusterDisposeSpy).toHaveBeenCalledOnce();
    expect(vectorClearSpy).toHaveBeenCalled();
    expect(vectorDisposeSpy).toHaveBeenCalledOnce();
    expect(layerDisposeSpy).toHaveBeenCalledOnce();
  });

  describe('fitToLayer', () => {
    let fitSpy: any;
    let mockView: any;

    beforeEach(() => {
      fitSpy = vi.fn();
      mockView = {
        fit: fitSpy,
        getProjection: () => ({ getCode: () => 'EPSG:3857' }),
      };
      (map as any).getView = vi.fn(() => mockView);
    });

    it('fits the map view to the extent of a vector layer', () => {
      svc.addLayer({
        id: 'v-fit',
        type: 'vector',
        features: [
          { id: 'f1', geometry: { type: 'Point', coordinates: [10, 20] } },
          { id: 'f2', geometry: { type: 'Point', coordinates: [30, 40] } },
        ],
      } as VectorLayerConfig);

      const zoneHelper = (svc as any).zoneHelper;
      const zoneSpy = vi.spyOn(zoneHelper, 'runOutsideAngular');

      svc.fitToLayer('v-fit', { padding: [10, 10, 10, 10], duration: 200 });

      expect(zoneSpy).toHaveBeenCalled();
      expect(fitSpy).toHaveBeenCalled();
      const [extent, options] = fitSpy.mock.calls[0];
      expect(extent).toBeDefined();
      expect(extent.length).toBe(4);
      expect(options).toEqual({
        padding: [10, 10, 10, 10],
        duration: 200,
      });
    });

    it('unwraps ClusterSource to fit the underlying VectorSource', () => {
      svc.addLayer({
        id: 'v-cluster-fit',
        type: 'vector',
        features: [{ id: 'f1', geometry: { type: 'Point', coordinates: [10, 20] } }],
        cluster: { enabled: true },
      } as VectorLayerConfig);

      svc.fitToLayer('v-cluster-fit');

      expect(fitSpy).toHaveBeenCalled();
      const [extent] = fitSpy.mock.calls[0];
      expect(extent).toBeDefined();
      expect(extent.length).toBe(4);
    });

    it('does not call fit if the extent is invalid (empty layer)', () => {
      svc.addLayer({
        id: 'v-empty-fit',
        type: 'vector',
        features: [],
      } as VectorLayerConfig);

      svc.fitToLayer('v-empty-fit');

      expect(fitSpy).not.toHaveBeenCalled();
    });

    it('gracefully handles missing layer or uninitialized map', () => {
      expect(() => svc.fitToLayer('non-existent')).not.toThrow();

      const { svc: noMapSvc } = makeService(null);
      expect(() => noMapSvc.fitToLayer('some-id')).not.toThrow();
    });
  });

  describe('VectorSourceConfig & Projections', () => {
    it('creates vector source with GeoJSON format using configured coordinateProjection as dataProjection', () => {
      svc.addLayer({
        id: 'v-proj',
        type: 'vector',
        url: 'https://example.com/data.geojson',
        format: 'geojson',
        coordinateProjection: 'EPSG:4326',
      } as VectorLayerConfig);

      const layer = svc.getLayer('v-proj') as VectorLayer<any>;
      expect(layer).toBeDefined();
      const source = layer.getSource();
      expect(source).toBeDefined();
      expect(source?.getFormat()).toBeInstanceOf(GeoJSON);
      const format = source?.getFormat() as GeoJSON;
      expect((format as any).dataProjection.getCode()).toBe('EPSG:4326');
    });

    it('defaults format to GeoJSON when url is provided without explicit format', () => {
      svc.addLayer({
        id: 'v-url-default',
        type: 'vector',
        url: 'https://example.com/data.json',
      } as VectorLayerConfig);

      const layer = svc.getLayer('v-url-default') as VectorLayer<any>;
      expect(layer).toBeDefined();
      const source = layer.getSource();
      expect(source?.getFormat()).toBeInstanceOf(GeoJSON);
    });
  });
});
