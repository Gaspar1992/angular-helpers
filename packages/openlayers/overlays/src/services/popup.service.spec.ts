// OlPopupService unit tests
import '@angular/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApplicationRef,
  Component,
  EnvironmentInjector,
  createEnvironmentInjector,
  input,
  inputBinding,
  provideZonelessChangeDetection,
  runInInjectionContext,
  signal,
  type ComponentRef,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import type OLMap from 'ol/Map';
import type Overlay from 'ol/Overlay';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import { OlPopupService } from './popup.service';

@Component({
  selector: 'ol-test-card',
  template: `<span data-testid="title">{{ title() }}</span>`,
})
class TestCardComponent {
  title = input('default');
}

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

// Bootstrap a tiny throwaway application once so we have a real `EnvironmentInjector`
// with every framework provider that `createComponent` requires (StandaloneService, etc.).
// TestBed.configureTestingModule fails in the current Vitest+Analog combo with
// "Cannot read properties of null (reading 'ngModule')", so we side-step it.
@Component({ selector: 'ol-test-root', template: '' })
class RootComponent {}

let rootInjector: EnvironmentInjector | null = null;
const ensureRootInjector = async (): Promise<EnvironmentInjector> => {
  if (rootInjector) return rootInjector;
  const host = document.createElement('ol-test-root');
  document.body.appendChild(host);
  const appRef = await bootstrapApplication(RootComponent, {
    providers: [provideZonelessChangeDetection()],
  });
  rootInjector = appRef.injector as EnvironmentInjector;
  return rootInjector;
};

const buildService = async (ready = true) => {
  const stub = createMapStub();
  const appRefSpy = {
    attachView: vi.fn(),
    detachView: vi.fn(),
  };

  const parent = await ensureRootInjector();
  const env = createEnvironmentInjector(
    [
      { provide: OlMapService, useValue: stub.mapService },
      { provide: OlZoneHelper, useValue: passthroughZone },
      { provide: ApplicationRef, useValue: appRefSpy },
    ],
    parent,
  );

  if (ready) stub.mapService.setReady(stub.map);

  const svc = runInInjectionContext(env, () => new OlPopupService());
  return { svc, ...stub, appRefSpy, env };
};

describe('OlPopupService.open (string / HTMLElement)', () => {
  let ctx: Awaited<ReturnType<typeof buildService>>;

  beforeEach(async () => {
    ctx = await buildService();
  });

  it('creates an overlay and registers it on the map', () => {
    const handle = ctx.svc.open({ id: 'p1', position: [0, 0], content: 'hello' });

    expect(handle.id).toBe('p1');
    expect(ctx.map.addOverlay).toHaveBeenCalledOnce();
    expect((ctx.map as unknown as { overlays: Overlay[] }).overlays).toHaveLength(1);
  });

  it('renders a string content as plain text (no innerHTML)', () => {
    ctx.svc.open({ id: 'p1', position: [0, 0], content: '<b>boom</b>' });

    const overlay = (ctx.map as unknown as { overlays: Overlay[] }).overlays[0];
    const element = overlay.getElement() as HTMLElement;
    expect(element.textContent).toBe('<b>boom</b>');
    expect(element.querySelector('b')).toBeNull();
  });

  it('renders an HTMLElement content as-is', () => {
    const node = document.createElement('section');
    node.id = 'rich';
    ctx.svc.open({ id: 'p1', position: [0, 0], content: node });

    const overlay = (ctx.map as unknown as { overlays: Overlay[] }).overlays[0];
    const element = overlay.getElement() as HTMLElement;
    expect(element.querySelector('#rich')).toBe(node);
  });

  it('is idempotent by id: a second open updates content and position in place', () => {
    ctx.svc.open({ id: 'p1', position: [0, 0], content: 'first' });
    ctx.svc.open({ id: 'p1', position: [10, 10], content: 'second' });

    expect(ctx.map.addOverlay).toHaveBeenCalledOnce();
    const overlay = (ctx.map as unknown as { overlays: Overlay[] }).overlays[0];
    expect(overlay.getPosition()).toEqual([10, 10]);
    expect((overlay.getElement() as HTMLElement).textContent).toBe('second');
  });

  it('generates a stable id when none is provided', () => {
    const h1 = ctx.svc.open({ position: [0, 0], content: 'a' });
    const h2 = ctx.svc.open({ position: [0, 0], content: 'b' });
    expect(h1.id).not.toEqual(h2.id);
    expect(h1.id).toMatch(/^popup-/);
  });

  it('queues calls when the map is not ready and flushes them on ready', async () => {
    const lateCtx = await buildService(false);
    lateCtx.svc.open({ id: 'q1', position: [0, 0], content: 'queued' });

    expect(lateCtx.map.addOverlay).not.toHaveBeenCalled();

    lateCtx.mapService.setReady(lateCtx.map);
    expect(lateCtx.map.addOverlay).toHaveBeenCalledOnce();
  });

  it('close removes the overlay and is a no-op for unknown ids', () => {
    const handle = ctx.svc.open({ id: 'p1', position: [0, 0], content: 'hi' });
    handle.close();

    expect(ctx.map.removeOverlay).toHaveBeenCalledOnce();
    expect(() => ctx.svc.close('missing')).not.toThrow();
  });

  it('closeAll disposes every popup and clears pending queue', () => {
    ctx.svc.open({ id: 'a', position: [0, 0], content: 'a' });
    ctx.svc.open({ id: 'b', position: [0, 0], content: 'b' });

    ctx.svc.closeAll();
    expect(ctx.map.removeOverlay).toHaveBeenCalledTimes(2);
  });
});

describe('OlPopupService.openComponent (Angular component)', () => {
  let ctx: Awaited<ReturnType<typeof buildService>>;

  beforeEach(async () => {
    ctx = await buildService();
  });

  it('creates a ComponentRef, attaches the view and uses the host element as overlay', () => {
    ctx.svc.openComponent({
      id: 'c1',
      position: [0, 0],
      component: TestCardComponent,
    });

    expect(ctx.map.addOverlay).toHaveBeenCalledOnce();
    expect(ctx.appRefSpy.attachView).toHaveBeenCalledOnce();
    const overlay = (ctx.map as unknown as { overlays: Overlay[] }).overlays[0];
    const element = overlay.getElement() as HTMLElement;
    // The provided hostElement IS used as the component host (no wrapper),
    // so we look for the rendered template content instead of the selector tag.
    expect(element.querySelector('[data-testid="title"]')).toBeTruthy();
  });

  it('renders bound inputs reactively via inputBinding', () => {
    const title = signal('Madrid');
    ctx.svc.openComponent({
      id: 'c1',
      position: [0, 0],
      component: TestCardComponent,
      bindings: [inputBinding('title', title)],
    });

    const element = (
      ctx.map as unknown as { overlays: Overlay[] }
    ).overlays[0].getElement() as HTMLElement;
    // Note: signal-driven bindings update on CD ticks; we trigger detection on the host view manually.
    const overlayWithRef = (
      ctx.svc as unknown as { popups: Map<string, { componentRef?: ComponentRef<unknown> }> }
    ).popups.get('c1')!;
    overlayWithRef.componentRef!.changeDetectorRef.detectChanges();
    expect(element.textContent).toContain('Madrid');

    title.set('Barcelona');
    overlayWithRef.componentRef!.changeDetectorRef.detectChanges();
    expect(element.textContent).toContain('Barcelona');
  });

  it('close destroys the ComponentRef and detaches the view', () => {
    const destroySpy = vi.fn();
    ctx.svc.openComponent({
      id: 'c1',
      position: [0, 0],
      component: TestCardComponent,
    });
    const managed = (
      ctx.svc as unknown as { popups: Map<string, { componentRef?: ComponentRef<unknown> }> }
    ).popups.get('c1')!;
    managed.componentRef!.onDestroy(destroySpy);

    ctx.svc.close('c1');

    expect(ctx.appRefSpy.detachView).toHaveBeenCalledOnce();
    expect(destroySpy).toHaveBeenCalledOnce();
    expect(ctx.map.removeOverlay).toHaveBeenCalledOnce();
  });

  it('a second call with the same id destroys the previous ComponentRef before creating a new one', () => {
    ctx.svc.openComponent({ id: 'c1', position: [0, 0], component: TestCardComponent });
    ctx.svc.openComponent({ id: 'c1', position: [10, 10], component: TestCardComponent });

    expect(ctx.map.addOverlay).toHaveBeenCalledTimes(2);
    expect(ctx.map.removeOverlay).toHaveBeenCalledTimes(1);
    expect(ctx.appRefSpy.attachView).toHaveBeenCalledTimes(2);
    expect(ctx.appRefSpy.detachView).toHaveBeenCalledTimes(1);
  });
});
