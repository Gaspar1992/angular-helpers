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
import { OlAttributionControlComponent } from './attribution-control.component';
import { OlFullscreenControlComponent } from './fullscreen-control.component';
import { OlRotateControlComponent, ROTATE_CONTROL_MAP_SERVICE } from './rotate-control.component';
import { OlScaleLineControlComponent } from './scale-line-control.component';
import { OlZoomControlComponent } from './zoom-control.component';
import { OlGeolocationControlComponent } from './geolocation-control.component';

import Attribution from 'ol/control/Attribution';
import FullScreen from 'ol/control/FullScreen';
import Rotate from 'ol/control/Rotate';
import ScaleLine from 'ol/control/ScaleLine';
import Zoom from 'ol/control/Zoom';
import Control from 'ol/control/Control';
import Geolocation from 'ol/Geolocation';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

@Component({ selector: 'ol-controls-test-root', template: '' })
class RootComponent {}

let rootInjector: EnvironmentInjector | null = null;
const ensureRootInjector = async (): Promise<EnvironmentInjector> => {
  if (rootInjector) return rootInjector;
  const host = document.createElement('ol-controls-test-root');
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

describe('Map Control Components', () => {
  let mapMock: any;
  let mapServiceMock: any;

  beforeEach(() => {
    mapMock = {
      addControl: vi.fn(),
      removeControl: vi.fn(),
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

  const runControlTest = async (componentClass: any, controlClass: any, inputs: any = {}) => {
    const parent = await ensureRootInjector();
    const env = createEnvironmentInjector(
      [
        { provide: OlMapService, useValue: mapServiceMock },
        { provide: ROTATE_CONTROL_MAP_SERVICE, useValue: mapServiceMock },
        { provide: OlZoneHelper, useValue: passthroughZone },
      ],
      parent,
    );

    const appRef = parent.get(ApplicationRef);
    const host = document.createElement('div');
    document.body.appendChild(host);

    const componentRef = createComponent(componentClass, {
      environmentInjector: env,
      hostElement: host,
    });

    Object.keys(inputs).forEach((key) => {
      componentRef.setInput(key, inputs[key]);
    });

    appRef.attachView(componentRef.hostView);
    componentRef.changeDetectorRef.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const disposeSpy = vi.spyOn(controlClass.prototype, 'dispose');

    componentRef.destroy();

    expect(mapMock.removeControl).toHaveBeenCalled();
    expect(disposeSpy).toHaveBeenCalledOnce();
  };

  it('OlAttributionControlComponent disposes of native control on destroy', async () => {
    await runControlTest(OlAttributionControlComponent, Attribution);
  });

  it('OlFullscreenControlComponent disposes of native control on destroy', async () => {
    await runControlTest(OlFullscreenControlComponent, FullScreen);
  });

  it('OlRotateControlComponent disposes of native control on destroy', async () => {
    await runControlTest(OlRotateControlComponent, Rotate);
  });

  it('OlScaleLineControlComponent disposes of native control on destroy', async () => {
    await runControlTest(OlScaleLineControlComponent, ScaleLine);
  });

  it('OlZoomControlComponent disposes of native control on destroy', async () => {
    await runControlTest(OlZoomControlComponent, Zoom);
  });

  it('OlGeolocationControlComponent disposes of all native resources on destroy', async () => {
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

    const componentRef = createComponent(OlGeolocationControlComponent, {
      environmentInjector: env,
      hostElement: host,
    });

    appRef.attachView(componentRef.hostView);
    componentRef.changeDetectorRef.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const controlDisposeSpy = vi.spyOn(Control.prototype, 'dispose');
    const geolocationDisposeSpy = vi.spyOn(Geolocation.prototype, 'dispose');
    const layerDisposeSpy = vi.spyOn(VectorLayer.prototype, 'dispose');
    const sourceDisposeSpy = vi.spyOn(VectorSource.prototype, 'dispose');
    const sourceClearSpy = vi.spyOn(VectorSource.prototype, 'clear');

    componentRef.destroy();

    expect(mapMock.removeControl).toHaveBeenCalled();
    expect(mapMock.removeLayer).toHaveBeenCalled();
    expect(controlDisposeSpy).toHaveBeenCalledOnce();
    expect(geolocationDisposeSpy).toHaveBeenCalledOnce();
    expect(layerDisposeSpy).toHaveBeenCalledOnce();
    expect(sourceDisposeSpy).toHaveBeenCalledOnce();
    expect(sourceClearSpy).toHaveBeenCalledWith(true);
  });
});
