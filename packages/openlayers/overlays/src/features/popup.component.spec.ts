// OlPopupComponent unit tests
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
import type Overlay from 'ol/Overlay';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import { OlPopupComponent } from './popup.component';

@Component({ selector: 'ol-popup-test-root', template: '' })
class RootComponent {}

let rootInjector: EnvironmentInjector | null = null;
const ensureRootInjector = async (): Promise<EnvironmentInjector> => {
  if (rootInjector) return rootInjector;
  const host = document.createElement('ol-popup-test-root');
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
  const map = {
    overlays: [] as Overlay[],
    addOverlay: vi.fn((o: Overlay) => {
      map.overlays.push(o);
    }),
    removeOverlay: vi.fn((o: Overlay) => {
      const idx = map.overlays.indexOf(o);
      if (idx >= 0) map.overlays.splice(idx, 1);
    }),
  } as unknown as OLMap & { overlays: Overlay[] };
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
  return { map, mapService };
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

  const componentRef = createComponent(OlPopupComponent, {
    environmentInjector: env,
    hostElement: host,
  });
  appRef.attachView(componentRef.hostView);
  componentRef.changeDetectorRef.detectChanges();

  return { stub, componentRef, host };
};

describe('OlPopupComponent', () => {
  let harness: Awaited<ReturnType<typeof buildHarness>>;

  beforeEach(async () => {
    harness = await buildHarness();
  });

  it('does NOT register an overlay when position starts as null', () => {
    expect(harness.stub.map.addOverlay).not.toHaveBeenCalled();
  });

  it('adds the overlay when position becomes non-null', () => {
    harness.componentRef.setInput('position', [1, 2]);
    harness.componentRef.changeDetectorRef.detectChanges();

    expect(harness.stub.map.addOverlay).toHaveBeenCalledOnce();
    const overlay = (harness.stub.map as unknown as { overlays: Overlay[] }).overlays[0];
    expect(overlay.getPosition()).toEqual([1, 2]);
    expect(overlay.getElement()).toBe(harness.host);
  });

  it('updates position, offset and positioning reactively', () => {
    harness.componentRef.setInput('position', [0, 0]);
    harness.componentRef.changeDetectorRef.detectChanges();

    harness.componentRef.setInput('position', [10, 20]);
    harness.componentRef.setInput('offset', [5, -5]);
    harness.componentRef.setInput('positioning', 'top-left');
    harness.componentRef.changeDetectorRef.detectChanges();

    const overlay = (harness.stub.map as unknown as { overlays: Overlay[] }).overlays[0];
    expect(overlay.getPosition()).toEqual([10, 20]);
    expect(overlay.getOffset()).toEqual([5, -5]);
    expect(overlay.getPositioning()).toBe('top-left');
  });

  it('emits closed and removes the overlay when position transitions to null', () => {
    const onClose = vi.fn();
    harness.componentRef.instance.closed.subscribe(onClose);

    harness.componentRef.setInput('position', [0, 0]);
    harness.componentRef.changeDetectorRef.detectChanges();

    harness.componentRef.setInput('position', null);
    harness.componentRef.changeDetectorRef.detectChanges();

    expect(onClose).toHaveBeenCalledOnce();
    expect(harness.stub.map.removeOverlay).toHaveBeenCalledOnce();
  });

  it('renders the close button when closeButton is true and emits closed on click', () => {
    const onClose = vi.fn();
    harness.componentRef.instance.closed.subscribe(onClose);
    harness.componentRef.setInput('position', [0, 0]);
    harness.componentRef.setInput('closeButton', true);
    harness.componentRef.changeDetectorRef.detectChanges();

    const btn = harness.host.querySelector('button.ol-popup-close') as HTMLButtonElement | null;
    expect(btn).toBeTruthy();
    btn!.click();

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does NOT render the close button by default', () => {
    harness.componentRef.setInput('position', [0, 0]);
    harness.componentRef.changeDetectorRef.detectChanges();

    expect(harness.host.querySelector('button.ol-popup-close')).toBeNull();
  });

  it('removes the overlay on destroy', () => {
    harness.componentRef.setInput('position', [0, 0]);
    harness.componentRef.changeDetectorRef.detectChanges();

    harness.componentRef.destroy();
    expect(harness.stub.map.removeOverlay).toHaveBeenCalled();
  });
});
