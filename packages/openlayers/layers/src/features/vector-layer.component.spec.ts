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
import { OlLayerService } from '../services/layer.service';
import { OlVectorLayerComponent } from './vector-layer.component';

@Component({ selector: 'ol-vector-layer-test-root', template: '' })
class RootComponent {}

let rootInjector: EnvironmentInjector | null = null;
const ensureRootInjector = async (): Promise<EnvironmentInjector> => {
  if (rootInjector) return rootInjector;
  const host = document.createElement('ol-vector-layer-test-root');
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

describe('OlVectorLayerComponent', () => {
  let layerServiceMock: any;
  let mapServiceMock: any;

  beforeEach(() => {
    layerServiceMock = {
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      getLayer: vi.fn().mockReturnValue({}),
      updateFeatures: vi.fn(),
      updateVectorLayerConfig: vi.fn(),
      setOpacity: vi.fn(),
      setVisibility: vi.fn(),
      setZIndex: vi.fn(),
      fitToLayer: vi.fn(),
    };
    mapServiceMock = {
      getMap: vi.fn().mockReturnValue({}),
      onReady: vi.fn(),
    };
  });

  const buildHarness = async (
    inputs: { id: string; url?: string; features?: any[]; autoFit?: any } = { id: 'v-layer' },
  ) => {
    const parent = await ensureRootInjector();
    const env = createEnvironmentInjector(
      [
        { provide: OlMapService, useValue: mapServiceMock },
        { provide: OlLayerService, useValue: layerServiceMock },
        { provide: OlZoneHelper, useValue: passthroughZone },
      ],
      parent,
    );

    const appRef = parent.get(ApplicationRef);
    const host = document.createElement('div');
    document.body.appendChild(host);

    const componentRef = createComponent(OlVectorLayerComponent, {
      environmentInjector: env,
      hostElement: host,
    });

    componentRef.setInput('id', inputs.id);
    if (inputs.url !== undefined) {
      componentRef.setInput('url', inputs.url);
    }
    if (inputs.features !== undefined) {
      componentRef.setInput('features', inputs.features);
    }
    if (inputs.autoFit !== undefined) {
      componentRef.setInput('autoFit', inputs.autoFit);
    }

    appRef.attachView(componentRef.hostView);
    componentRef.changeDetectorRef.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    return { componentRef, host };
  };

  it('does not call updateFeatures when features is undefined and url is configured', async () => {
    await buildHarness({ id: 'v-layer', url: 'https://example.com/data.geojson' });
    expect(layerServiceMock.updateFeatures).not.toHaveBeenCalled();
  });

  it('calls updateFeatures when features is explicitly provided (even if empty)', async () => {
    await buildHarness({ id: 'v-layer', url: 'https://example.com/data.geojson', features: [] });
    expect(layerServiceMock.updateFeatures).toHaveBeenCalledWith('v-layer', []);
  });

  it('triggers auto-fit on initialization for static features', async () => {
    await buildHarness({ id: 'v-layer', features: [], autoFit: true });
    expect(layerServiceMock.fitToLayer).toHaveBeenCalledWith('v-layer', undefined);
  });

  it('triggers auto-fit with custom options', async () => {
    const customOptions = { padding: [10], duration: 150 };
    await buildHarness({ id: 'v-layer', features: [], autoFit: customOptions });
    expect(layerServiceMock.fitToLayer).toHaveBeenCalledWith('v-layer', customOptions);
  });

  it('sets up featuresloadend listener for remote url and fits on load', async () => {
    let loadEndCallback: any;
    const mockSource = {
      on: vi.fn((event, cb) => {
        if (event === 'featuresloadend') {
          loadEndCallback = cb;
        }
      }),
    };
    layerServiceMock.getLayer = vi.fn().mockReturnValue({
      getSource: () => mockSource,
    });

    const customOptions = { padding: [10], duration: 150 };
    await buildHarness({
      id: 'v-layer',
      url: 'https://example.com/data.geojson',
      autoFit: customOptions,
    });

    expect(mockSource.on).toHaveBeenCalledWith('featuresloadend', expect.any(Function));
    expect(layerServiceMock.fitToLayer).not.toHaveBeenCalled();

    // Trigger the load end event
    loadEndCallback();
    expect(layerServiceMock.fitToLayer).toHaveBeenCalledWith('v-layer', customOptions);
  });

  it('triggers auto-fit reactively when features change', async () => {
    const { componentRef } = await buildHarness({
      id: 'v-layer',
      features: [{ id: 'f1', geometry: { type: 'Point', coordinates: [0, 0] } }],
      autoFit: true,
    });

    // Initial fit
    expect(layerServiceMock.fitToLayer).toHaveBeenCalledWith('v-layer', undefined);
    layerServiceMock.fitToLayer.mockClear();

    // Update features
    componentRef.setInput('features', [{ id: 'f1' }, { id: 'f2' }]);
    componentRef.changeDetectorRef.detectChanges();

    // Flush microtasks
    await Promise.resolve();
    expect(layerServiceMock.fitToLayer).toHaveBeenCalledWith('v-layer', undefined);
  });
});
