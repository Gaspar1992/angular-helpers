import '@angular/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApplicationRef,
  Component,
  EnvironmentInjector,
  createComponent,
  createEnvironmentInjector,
  provideZonelessChangeDetection,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import { OlWebGLTileLayerComponent } from './webgl-tile-layer.component';
import { OlWebGLVectorLayerComponent } from './webgl-vector-layer.component';
import XYZ from 'ol/source/XYZ';
import WebGLTileLayer from 'ol/layer/WebGLTile';
import VectorSource from 'ol/source/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';

@Component({ selector: 'ol-webgl-test-root', template: '' })
class RootComponent {}

let rootInjector: EnvironmentInjector | null = null;
const ensureRootInjector = async (): Promise<EnvironmentInjector> => {
  if (rootInjector) return rootInjector;
  const host = document.createElement('ol-webgl-test-root');
  document.body.appendChild(host);
  const appRef = await bootstrapApplication(RootComponent, {
    providers: [provideZonelessChangeDetection()],
  });
  rootInjector = appRef.injector as EnvironmentInjector;
  return rootInjector;
};

const passthroughZone = {
  runOutsideAngular: <T>(f: () => T) => f(),
  runInsideAngular: <T>(f: () => T) => f(),
};

describe('WebGL Layer Components', () => {
  let mapMock: any;
  let mapServiceMock: any;

  beforeEach(() => {
    mapMock = {
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      getView: () => ({
        getProjection: () => ({
          getCode: () => 'EPSG:3857',
        }),
      }),
    };
    mapServiceMock = {
      getMap: () => mapMock,
      onReady: (cb: any) => cb(mapMock),
    };
  });

  describe('OlWebGLTileLayerComponent', () => {
    it('disposes of the layer and source on destroy', async () => {
      const parent = await ensureRootInjector();
      const env = createEnvironmentInjector(
        [
          { provide: OlMapService, useValue: mapServiceMock },
          { provide: OlZoneHelper, useValue: passthroughZone },
        ],
        parent,
      );

      const appRef = parent.get(ApplicationRef);
      const host = document.createElement('div');
      document.body.appendChild(host);

      const componentRef = createComponent(OlWebGLTileLayerComponent, {
        environmentInjector: env,
        hostElement: host,
      });

      componentRef.setInput('id', 'tile-layer');
      componentRef.setInput('source', 'xyz');
      componentRef.setInput('url', 'https://example.com/{z}/{x}/{y}.png');

      appRef.attachView(componentRef.hostView);
      componentRef.changeDetectorRef.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const sourceSpy = vi.spyOn(XYZ.prototype, 'dispose');
      const layerSpy = vi.spyOn(WebGLTileLayer.prototype, 'dispose');

      componentRef.destroy();

      expect(mapMock.removeLayer).toHaveBeenCalled();
      expect(sourceSpy).toHaveBeenCalledOnce();
      expect(layerSpy).toHaveBeenCalledOnce();
    });
  });

  describe('OlWebGLVectorLayerComponent', () => {
    it('disposes of the layer and source on destroy', async () => {
      const parent = await ensureRootInjector();
      const env = createEnvironmentInjector(
        [
          { provide: OlMapService, useValue: mapServiceMock },
          { provide: OlZoneHelper, useValue: passthroughZone },
        ],
        parent,
      );

      const appRef = parent.get(ApplicationRef);
      const host = document.createElement('div');
      document.body.appendChild(host);

      const componentRef = createComponent(OlWebGLVectorLayerComponent, {
        environmentInjector: env,
        hostElement: host,
      });

      componentRef.setInput('id', 'vector-layer');
      componentRef.setInput('flatStyle', {
        'circle-radius': 5,
        'circle-fill-color': 'red',
      });

      appRef.attachView(componentRef.hostView);
      componentRef.changeDetectorRef.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const sourceClearSpy = vi.spyOn(VectorSource.prototype, 'clear');
      const sourceDisposeSpy = vi.spyOn(VectorSource.prototype, 'dispose');
      const layerSpy = vi.spyOn(WebGLVectorLayer.prototype, 'dispose');

      componentRef.destroy();

      expect(mapMock.removeLayer).toHaveBeenCalled();
      expect(sourceClearSpy).toHaveBeenCalledWith(true);
      expect(sourceDisposeSpy).toHaveBeenCalledOnce();
      expect(layerSpy).toHaveBeenCalledOnce();
    });

    it('resolves string URL source input into resolvedSourceConfig', async () => {
      const parent = await ensureRootInjector();
      const env = createEnvironmentInjector(
        [
          { provide: OlMapService, useValue: mapServiceMock },
          { provide: OlZoneHelper, useValue: passthroughZone },
        ],
        parent,
      );

      const host = document.createElement('div');
      document.body.appendChild(host);

      const componentRef = createComponent(OlWebGLVectorLayerComponent, {
        environmentInjector: env,
        hostElement: host,
      });

      componentRef.setInput('id', 'vector-layer-url');
      componentRef.setInput('source', 'https://example.com/data.geojson');
      componentRef.setInput('flatStyle', {
        'circle-radius': 5,
        'circle-fill-color': 'blue',
      });

      expect(componentRef.instance.resolvedSourceConfig()).toEqual({
        features: [],
        url: 'https://example.com/data.geojson',
        format: undefined,
        coordinateProjection: 'EPSG:4326',
        autoFit: false,
      });

      componentRef.destroy();
    });

    it('resolves array and object source inputs into resolvedSourceConfig', async () => {
      const parent = await ensureRootInjector();
      const env = createEnvironmentInjector(
        [
          { provide: OlMapService, useValue: mapServiceMock },
          { provide: OlZoneHelper, useValue: passthroughZone },
        ],
        parent,
      );

      const host = document.createElement('div');
      document.body.appendChild(host);

      const componentRef = createComponent(OlWebGLVectorLayerComponent, {
        environmentInjector: env,
        hostElement: host,
      });

      const sampleFeatures = [
        { id: 'f1', geometry: { type: 'Point' as const, coordinates: [0, 0] } },
      ];
      componentRef.setInput('id', 'vector-layer-poly');
      componentRef.setInput('flatStyle', { 'circle-radius': 4 });

      expect(componentRef.instance.resolvedSourceConfig().features).toEqual([]);

      componentRef.setInput('source', sampleFeatures);

      expect(componentRef.instance.resolvedSourceConfig().features).toEqual(sampleFeatures);

      componentRef.setInput('source', {
        url: 'https://example.com/custom.kml',
        format: 'kml',
        autoFit: true,
      });

      expect(componentRef.instance.resolvedSourceConfig()).toEqual({
        features: [],
        url: 'https://example.com/custom.kml',
        format: 'kml',
        coordinateProjection: 'EPSG:4326',
        autoFit: true,
      });

      componentRef.destroy();
    });

    it('syncs all geometry types, updates reactive inputs, and handles updateVariables', async () => {
      const parent = await ensureRootInjector();
      const env = createEnvironmentInjector(
        [
          { provide: OlMapService, useValue: mapServiceMock },
          { provide: OlZoneHelper, useValue: passthroughZone },
        ],
        parent,
      );

      const appRef = parent.get(ApplicationRef);
      const host = document.createElement('div');
      document.body.appendChild(host);

      const componentRef = createComponent(OlWebGLVectorLayerComponent, {
        environmentInjector: env,
        hostElement: host,
      });

      const featuresList: any[] = [
        {
          id: 'pt',
          geometry: { type: 'Point', coordinates: [-3.7, 40.4] },
          properties: { name: 'Madrid' },
        },
        {
          id: 'line',
          geometry: {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          },
        },
        {
          id: 'poly',
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
        {
          id: 'circle-default',
          geometry: { type: 'Circle', coordinates: [2, 2] },
        },
        {
          id: 'circle-radius',
          geometry: { type: 'Circle', coordinates: [2, 2], radius: 500 },
        },
        {
          id: 'no-coords',
          geometry: { type: 'Point', coordinates: undefined },
        },
        {
          id: 'unknown-geom',
          geometry: { type: 'MultiPoint', coordinates: [[0, 0]] },
        },
      ];

      componentRef.setInput('id', 'vector-full');
      componentRef.setInput('flatStyle', { 'circle-radius': 6 });
      componentRef.setInput('features', featuresList);
      componentRef.setInput('variables', { threshold: 10 });

      // Calling updateVariables before layer exists should be a no-op
      componentRef.instance.updateVariables({ threshold: 5 });

      // Pre-seed layer so initial effect execution evaluates arguments inside optional chaining
      (componentRef.instance as any).layer = {
        setStyle: vi.fn(),
        setOpacity: vi.fn(),
        setVisible: vi.fn(),
        setZIndex: vi.fn(),
        updateStyleVariables: vi.fn(),
      };

      appRef.attachView(componentRef.hostView);
      componentRef.changeDetectorRef.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const fakeLayer = {
        setStyle: vi.fn(),
        setOpacity: vi.fn(),
        setVisible: vi.fn(),
        setZIndex: vi.fn(),
        updateStyleVariables: vi.fn(),
        dispose: vi.fn(() => {
          throw new Error('WebGL context already lost');
        }),
      };
      (componentRef.instance as any).layer = fakeLayer;

      const source: VectorSource = (componentRef.instance as any).vectorSource;
      expect(source.getFeatures().length).toBe(7);

      // Update reactive inputs to trigger effects when this.layer is present
      componentRef.setInput('opacity', 0.5);
      componentRef.setInput('visible', false);
      componentRef.setInput('zIndex', 10);
      componentRef.setInput('flatStyle', { 'circle-radius': 10 });
      componentRef.setInput('variables', { threshold: 20 });
      componentRef.setInput('features', [featuresList[0]]);
      componentRef.changeDetectorRef.detectChanges();
      appRef.tick();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeLayer.setOpacity).toHaveBeenCalledWith(0.5);
      expect(fakeLayer.setVisible).toHaveBeenCalledWith(false);
      expect(fakeLayer.setZIndex).toHaveBeenCalledWith(10);
      expect(fakeLayer.setStyle).toHaveBeenCalledWith({ 'circle-radius': 10 });
      expect(fakeLayer.updateStyleVariables).toHaveBeenCalledWith({ threshold: 20 });
      expect(source.getFeatures().length).toBe(1);

      // Imperative updateVariables
      componentRef.instance.updateVariables({ threshold: 99 });
      expect(fakeLayer.updateStyleVariables).toHaveBeenCalledWith({ threshold: 99 });

      // Destroy should swallow layer.dispose errors gracefully
      expect(() => componentRef.destroy()).not.toThrow();
    });

    it('gracefully handles missing map on initialization', async () => {
      mapServiceMock.getMap = () => null;
      const parent = await ensureRootInjector();
      const env = createEnvironmentInjector(
        [
          { provide: OlMapService, useValue: mapServiceMock },
          { provide: OlZoneHelper, useValue: passthroughZone },
        ],
        parent,
      );

      const appRef = parent.get(ApplicationRef);
      const host = document.createElement('div');
      document.body.appendChild(host);

      const componentRef = createComponent(OlWebGLVectorLayerComponent, {
        environmentInjector: env,
        hostElement: host,
      });

      componentRef.setInput('id', 'no-map-vector');
      componentRef.setInput('flatStyle', { 'circle-radius': 5 });

      appRef.attachView(componentRef.hostView);
      componentRef.changeDetectorRef.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mapMock.addLayer).not.toHaveBeenCalled();
      componentRef.destroy();
    });
  });

  describe('OlWebGLTileLayerComponent additional sources and effects', () => {
    it('supports osm and mvt sources, reactive style/variables effects, and updateVariables', async () => {
      const parent = await ensureRootInjector();
      const env = createEnvironmentInjector(
        [
          { provide: OlMapService, useValue: mapServiceMock },
          { provide: OlZoneHelper, useValue: passthroughZone },
        ],
        parent,
      );

      const appRef = parent.get(ApplicationRef);
      const hostOsm = document.createElement('div');
      document.body.appendChild(hostOsm);

      const osmRef = createComponent(OlWebGLTileLayerComponent, {
        environmentInjector: env,
        hostElement: hostOsm,
      });

      osmRef.setInput('id', 'osm-layer');
      osmRef.setInput('source', 'osm');
      osmRef.setInput('tileStyle', { brightness: 0.2 });
      osmRef.setInput('variables', { brightness: 0.2 });

      // Calling updateVariables before layer is created
      osmRef.instance.updateVariables({ brightness: 0.1 });

      // Pre-seed layer so initial effect run evaluates arguments inside optional chaining
      (osmRef.instance as any).layer = {
        setOpacity: vi.fn(),
        setVisible: vi.fn(),
        setZIndex: vi.fn(),
        setStyle: vi.fn(),
        updateStyleVariables: vi.fn(),
      };

      appRef.attachView(osmRef.hostView);
      osmRef.changeDetectorRef.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mapMock.addLayer).toHaveBeenCalled();

      // Replace layer with spy object to test reactive effects without full WebGL context
      const fakeTileLayer = {
        setOpacity: vi.fn(),
        setVisible: vi.fn(),
        setZIndex: vi.fn(),
        setStyle: vi.fn(),
        updateStyleVariables: vi.fn(),
        dispose: vi.fn(),
      };
      (osmRef.instance as any).layer = fakeTileLayer;

      osmRef.setInput('opacity', 0.7);
      osmRef.setInput('visible', false);
      osmRef.setInput('zIndex', 5);
      osmRef.setInput('tileStyle', { contrast: 0.5 });
      osmRef.setInput('variables', { brightness: 0.8 });
      osmRef.changeDetectorRef.detectChanges();
      appRef.tick();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeTileLayer.setOpacity).toHaveBeenCalledWith(0.7);
      expect(fakeTileLayer.setVisible).toHaveBeenCalledWith(false);
      expect(fakeTileLayer.setZIndex).toHaveBeenCalledWith(5);
      expect(fakeTileLayer.setStyle).toHaveBeenCalledWith({ contrast: 0.5 });
      expect(fakeTileLayer.updateStyleVariables).toHaveBeenCalledWith({ brightness: 0.8 });

      osmRef.instance.updateVariables({ brightness: 1 });
      expect(fakeTileLayer.updateStyleVariables).toHaveBeenCalledWith({ brightness: 1 });

      osmRef.destroy();

      // Test MVT source branch
      const hostMvt = document.createElement('div');
      document.body.appendChild(hostMvt);
      const mvtRef = createComponent(OlWebGLTileLayerComponent, {
        environmentInjector: env,
        hostElement: hostMvt,
      });

      mvtRef.setInput('id', 'mvt-layer');
      mvtRef.setInput('source', 'mvt');
      mvtRef.setInput('url', 'https://example.com/tiles/{z}/{x}/{y}.pbf');
      mvtRef.setInput('variables', { zoomLevel: 5 });

      appRef.attachView(mvtRef.hostView);
      mvtRef.changeDetectorRef.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const fakeMvtLayer = {
        setOpacity: vi.fn(),
        setVisible: vi.fn(),
        setZIndex: vi.fn(),
        setStyle: vi.fn(),
        updateStyleVariables: vi.fn(),
        dispose: vi.fn(),
      };
      (mvtRef.instance as any).layer = fakeMvtLayer;

      mvtRef.setInput('tileStyle', { 'stroke-color': 'red' });
      mvtRef.changeDetectorRef.detectChanges();
      appRef.tick();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(fakeMvtLayer.setStyle).toHaveBeenCalledWith({ 'stroke-color': 'red' });

      mvtRef.destroy();
    });

    it('gracefully handles missing map on initialization', async () => {
      mapServiceMock.getMap = () => null;
      const parent = await ensureRootInjector();
      const env = createEnvironmentInjector(
        [
          { provide: OlMapService, useValue: mapServiceMock },
          { provide: OlZoneHelper, useValue: passthroughZone },
        ],
        parent,
      );

      const appRef = parent.get(ApplicationRef);
      const host = document.createElement('div');
      document.body.appendChild(host);

      const componentRef = createComponent(OlWebGLTileLayerComponent, {
        environmentInjector: env,
        hostElement: host,
      });

      componentRef.setInput('id', 'no-map-tile');
      componentRef.setInput('source', 'osm');

      appRef.attachView(componentRef.hostView);
      componentRef.changeDetectorRef.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mapMock.addLayer).not.toHaveBeenCalled();
      componentRef.destroy();
    });
  });
});
