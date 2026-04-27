// OlTooltipDirective unit tests
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
import type OLMap from 'ol/Map';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import { OlTooltipDirective } from './tooltip.directive';

@Component({ selector: 'ol-tooltip-test-root', template: '' })
class RootComponent {}

@Component({
  selector: 'ol-tooltip-host',
  hostDirectives: [
    {
      directive: OlTooltipDirective,
      inputs: ['olTooltip', 'olTooltipLayer'],
    },
  ],
  template: '',
})
class HostComponent {}

let rootInjector: EnvironmentInjector | null = null;
const ensureRootInjector = async (): Promise<EnvironmentInjector> => {
  if (rootInjector) return rootInjector;
  const host = document.createElement('ol-tooltip-test-root');
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

const createMapStub = () => {
  let stored: OLMap | null = null;
  let onReadyCb: ((m: OLMap) => void) | null = null;
  const viewport = document.createElement('div');
  document.body.appendChild(viewport);
  const handlers = new Map<string, Array<(event: unknown) => void>>();
  const map = {
    on: vi.fn((name: string, h: (event: unknown) => void) => {
      const list = handlers.get(name) ?? [];
      list.push(h);
      handlers.set(name, list);
    }),
    un: vi.fn((name: string, h: (event: unknown) => void) => {
      const list = handlers.get(name) ?? [];
      const idx = list.indexOf(h);
      if (idx >= 0) list.splice(idx, 1);
    }),
    getViewport: () => viewport,
    forEachFeatureAtPixel: vi.fn(),
    fire: (name: string, event: unknown) => {
      for (const h of handlers.get(name) ?? []) h(event);
    },
  } as unknown as OLMap & { fire: (name: string, event: unknown) => void };
  const mapService = {
    getMap: () => stored,
    onReady: (cb: (m: OLMap) => void) => {
      if (stored) cb(stored);
      else onReadyCb = cb;
    },
    setReady: (m: OLMap) => {
      stored = m;
      onReadyCb?.(m);
    },
  };
  return { map, mapService, viewport };
};

const buildHarness = async () => {
  const stub = createMapStub();
  const parent = await ensureRootInjector();
  const env = createEnvironmentInjector(
    [
      { provide: OlMapService, useValue: stub.mapService },
      { provide: OlZoneHelper, useValue: passthroughZone },
    ],
    parent,
  );
  stub.mapService.setReady(stub.map);

  const appRef = parent.get(ApplicationRef);
  const host = document.createElement('div');
  document.body.appendChild(host);

  const componentRef = createComponent(HostComponent, {
    environmentInjector: env,
    hostElement: host,
  });
  appRef.attachView(componentRef.hostView);
  componentRef.setInput('olTooltip', 'name');
  componentRef.changeDetectorRef.detectChanges();

  return { stub, componentRef, host };
};

describe('OlTooltipDirective', () => {
  let harness: Awaited<ReturnType<typeof buildHarness>>;

  beforeEach(async () => {
    harness = await buildHarness();
  });

  it('registers a pointermove listener and appends a tooltip element to the viewport', () => {
    expect(harness.stub.map.on).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(harness.stub.viewport.querySelector('[role="tooltip"]')).toBeTruthy();
  });

  it('cleans up listener and tooltip element on destroy', () => {
    harness.componentRef.destroy();
    expect(harness.stub.map.un).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(harness.stub.viewport.querySelector('[role="tooltip"]')).toBeNull();
  });
});
