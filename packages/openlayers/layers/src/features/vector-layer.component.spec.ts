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
    };
    mapServiceMock = {
      getMap: vi.fn().mockReturnValue({}),
      onReady: vi.fn(),
    };
  });

  const buildHarness = async (
    inputs: { id: string; url?: string; features?: any[] } = { id: 'v-layer' },
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

    appRef.attachView(componentRef.hostView);
    componentRef.changeDetectorRef.detectChanges();

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
});
