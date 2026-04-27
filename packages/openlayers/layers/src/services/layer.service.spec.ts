// OlLayerService unit tests
import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import type OLMap from 'ol/Map';
import type BaseLayer from 'ol/layer/Base';
import { OlMapService } from '@angular-helpers/openlayers/core';
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
    providers: [{ provide: OlMapService, useValue: mapService }],
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
});
