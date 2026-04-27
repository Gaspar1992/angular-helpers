// OlMapService unit tests
import '@angular/compiler';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import type OLMap from 'ol/Map';
import { OlMapService } from './map.service';
import { OlZoneHelper } from './zone-helper.service';

const createView = () => ({
  getCenter: vi.fn(() => [10, 20] as [number, number]),
  getZoom: vi.fn(() => 5),
  getRotation: vi.fn(() => 0),
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  fit: vi.fn(),
  animate: vi.fn((_opts: unknown, cb?: () => void) => cb?.()),
});

const createMap = (view = createView()) =>
  ({
    getView: vi.fn(() => view),
    updateSize: vi.fn(),
  }) as unknown as OLMap;

const makeService = (): OlMapService => {
  // Provide a passthrough OlZoneHelper so we don't need NgZone
  const zoneHelper = {
    runOutsideAngular: <T>(f: () => T) => f(),
    runInsideAngular: <T>(f: () => T) => f(),
  };
  const injector = Injector.create({
    providers: [{ provide: OlZoneHelper, useValue: zoneHelper }],
  });
  return runInInjectionContext(injector, () => new OlMapService());
};

describe('OlMapService', () => {
  let svc: OlMapService;

  beforeEach(() => {
    svc = makeService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null map and view before setMap', () => {
    expect(svc.getMap()).toBeNull();
    expect(svc.getView()).toBeNull();
    expect(svc.getViewState()).toEqual({ center: [0, 0], zoom: 0, rotation: 0 });
  });

  it('queues onReady callbacks and flushes them when setMap is called', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    svc.onReady(cb1);
    svc.onReady(cb2);
    expect(cb1).not.toHaveBeenCalled();

    const map = createMap();
    svc.setMap(map);

    expect(cb1).toHaveBeenCalledWith(map);
    expect(cb2).toHaveBeenCalledWith(map);
  });

  it('invokes onReady callbacks immediately when map is already set', () => {
    const map = createMap();
    svc.setMap(map);
    const cb = vi.fn();
    svc.onReady(cb);
    expect(cb).toHaveBeenCalledWith(map);
  });

  it('setCenter and setZoom delegate to the current view', () => {
    const view = createView();
    svc.setMap(createMap(view));

    svc.setCenter([1, 2]);
    svc.setZoom(8);

    expect(view.setCenter).toHaveBeenCalledWith([1, 2]);
    expect(view.setZoom).toHaveBeenCalledWith(8);
  });

  it('setCenter and setZoom are no-ops when there is no map', () => {
    expect(() => svc.setCenter([0, 0])).not.toThrow();
    expect(() => svc.setZoom(1)).not.toThrow();
  });

  it('fitExtent updates size and fits the view on next macrotask', () => {
    const view = createView();
    const map = createMap(view);
    svc.setMap(map);

    svc.fitExtent([0, 0, 10, 10], { maxZoom: 18, duration: 250 });
    expect(view.fit).not.toHaveBeenCalled();

    vi.runAllTimers();

    expect(map.updateSize).toHaveBeenCalled();
    expect(view.fit).toHaveBeenCalledWith([0, 0, 10, 10], { maxZoom: 18, duration: 250 });
  });

  it('fitExtent is a no-op when no map is present', () => {
    expect(() => svc.fitExtent([0, 0, 1, 1])).not.toThrow();
    vi.runAllTimers();
  });

  it('animateView resolves via the callback after view.animate completes', async () => {
    const view = createView();
    svc.setMap(createMap(view));

    const promise = svc.animateView({ center: [3, 4], zoom: 9, duration: 100 });
    await promise;

    expect(view.animate).toHaveBeenCalledOnce();
  });

  it('animateView resolves immediately when there is no view', async () => {
    await expect(svc.animateView({ center: [0, 0], zoom: 0 })).resolves.toBeUndefined();
  });

  it('animateView uses default duration of 250ms when not provided', async () => {
    const view = createView();
    svc.setMap(createMap(view));

    await svc.animateView({ center: [0, 0], zoom: 1 });

    expect(view.animate).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 250 }),
      expect.any(Function),
    );
  });

  it('getViewState returns center, zoom and rotation from the view', () => {
    const view = createView();
    svc.setMap(createMap(view));

    expect(svc.getViewState()).toEqual({ center: [10, 20], zoom: 5, rotation: 0 });
  });

  it('getViewState falls back to defaults when view returns nullish values', () => {
    const view = createView();
    view.getCenter.mockReturnValueOnce(undefined as never);
    view.getZoom.mockReturnValueOnce(undefined as never);
    view.getRotation.mockReturnValueOnce(undefined as never);
    svc.setMap(createMap(view));

    expect(svc.getViewState()).toEqual({ center: [0, 0], zoom: 0, rotation: 0 });
  });
});
