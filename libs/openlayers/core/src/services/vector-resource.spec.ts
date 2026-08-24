import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signal, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createVectorResource } from './vector-resource';

describe('createVectorResource', () => {
  let injector: EnvironmentInjector;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    injector = TestBed.inject(EnvironmentInjector);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty array if url is undefined or empty', async () => {
    await injector.runInContext(async () => {
      const urlSignal = signal<string | undefined>(undefined);
      const res = createVectorResource(urlSignal);

      await new Promise((r) => setTimeout(r, 20));
      expect(res.value()).toEqual([]);
    });
  });

  it('should fetch GeoJSON and convert to features', async () => {
    const geoJsonData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'f1',
          geometry: { type: 'Point', coordinates: [10, 20] },
          properties: { name: 'Test Point' },
        },
      ],
    };

    const mockResponse = {
      ok: true,
      text: async () => JSON.stringify(geoJsonData),
      clone: () => mockResponse,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as any);

    await injector.runInContext(async () => {
      const urlSignal = signal<string | undefined>('https://example.com/data.geojson');
      const res = createVectorResource(urlSignal);

      await new Promise((r) => setTimeout(r, 50));
      const value = res.value();
      expect(value).toBeDefined();
      expect(value?.length).toBe(1);
      expect(value?.[0].properties?.name).toBe('Test Point');
    });
  });

  it('should throw error when fetch fails with non-ok response', async () => {
    const mockResponse = {
      ok: false,
      statusText: 'Not Found',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as any);

    await injector.runInContext(async () => {
      const urlSignal = signal<string | undefined>('https://example.com/notfound.geojson');
      const res = createVectorResource(urlSignal);

      await new Promise((r) => setTimeout(r, 50));
      expect(res.error()).toBeDefined();
    });
  });

  it('should use browser Cache API if available', async () => {
    const geoJsonData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'cached-1',
          geometry: { type: 'Point', coordinates: [0, 0] },
          properties: { name: 'Cached Feature' },
        },
      ],
    };

    const mockCachedResponse = {
      ok: true,
      text: async () => JSON.stringify(geoJsonData),
    };

    const mockCache = {
      match: vi.fn().mockResolvedValue(mockCachedResponse),
      put: vi.fn().mockResolvedValue(undefined),
    };

    (globalThis as any).caches = {
      open: vi.fn().mockResolvedValue(mockCache),
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await injector.runInContext(async () => {
      const urlSignal = signal<string | undefined>('https://example.com/cached.geojson');
      const res = createVectorResource(urlSignal);

      await new Promise((r) => setTimeout(r, 50));
      expect(mockCache.match).toHaveBeenCalledWith('https://example.com/cached.geojson');
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(res.value()?.length).toBe(1);
    });

    delete (globalThis as any).caches;
  });
});
