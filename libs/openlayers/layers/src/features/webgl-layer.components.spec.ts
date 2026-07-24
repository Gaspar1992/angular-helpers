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
    });
  });
});
