import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { offlineCacheInterceptor } from './offline-cache-interceptor';
import type { SerializableRequest, SerializableResponse } from './worker-interceptor.types';

const req: SerializableRequest = {
  method: 'GET',
  url: 'https://api.example.com/users',
  headers: {},
  params: {},
  body: null,
  responseType: 'json',
  withCredentials: false,
  context: {},
};

function makeResponse(body: unknown = { ok: true }): SerializableResponse {
  return { status: 200, statusText: 'OK', headers: {}, body, url: req.url };
}

describe('offlineCacheInterceptor', () => {
  let mockCaches: any;
  let mockCache: any;
  let originalCaches: any;
  let originalResponse: any;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock global Response class if not present in test env
    if (typeof globalThis.Response === 'undefined') {
      originalResponse = undefined;
      (globalThis as any).Response = class MockResponse {
        headers = new Map<string, string>();
        constructor(
          public bodyStr: string,
          public init?: any,
        ) {
          if (init?.headers) {
            Object.entries(init.headers).forEach(([k, v]) => {
              this.headers.set(k, v as string);
            });
          }
        }
        get status() {
          return this.init?.status ?? 200;
        }
        get statusText() {
          return this.init?.statusText ?? 'OK';
        }
        async json() {
          return JSON.parse(this.bodyStr);
        }
        async text() {
          return this.bodyStr;
        }
      };
    } else {
      originalResponse = globalThis.Response;
    }

    // Setup Cache Mock
    const cacheStore = new Map<string, any>();
    mockCache = {
      match: vi.fn().mockImplementation(async (key) => cacheStore.get(key) || null),
      put: vi.fn().mockImplementation(async (key, val) => {
        cacheStore.set(key, val);
      }),
      delete: vi.fn().mockImplementation(async (key) => cacheStore.delete(key)),
    };

    mockCaches = {
      open: vi.fn().mockResolvedValue(mockCache),
    };

    originalCaches = (globalThis as any).caches;
    (globalThis as any).caches = mockCaches;
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalCaches !== undefined) {
      (globalThis as any).caches = originalCaches;
    } else {
      delete (globalThis as any).caches;
    }
    if (originalResponse !== undefined) {
      globalThis.Response = originalResponse;
    }
  });

  it('performs standard network-first fetching and populates cache', async () => {
    const next = vi.fn().mockResolvedValue(makeResponse({ count: 10 }));
    const interceptor = offlineCacheInterceptor({ strategy: 'network-first' });

    const result = await interceptor(req, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(result.body).toEqual({ count: 10 });
    expect(mockCaches.open).toHaveBeenCalledWith('ah-http-offline-cache');
    expect(mockCache.put).toHaveBeenCalled();
  });

  it('serves cached response when offline/network failure in network-first strategy', async () => {
    const interceptor = offlineCacheInterceptor({ strategy: 'network-first' });

    // 1. Populates cache first
    const nextSuccess = vi.fn().mockResolvedValue(makeResponse({ count: 42 }));
    await interceptor(req, nextSuccess);

    // 2. Next request fails (network error)
    const nextFailure = vi.fn().mockRejectedValue(new Error('Network error'));
    const result = await interceptor(req, nextFailure);

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ count: 42 });
  });

  it('uses cache-first strategy to serve from cache immediately and revalidate in background', async () => {
    const interceptor = offlineCacheInterceptor({ strategy: 'cache-first' });

    // 1. Populates cache
    const nextSuccess = vi.fn().mockResolvedValue(makeResponse({ version: 1 }));
    await interceptor(req, nextSuccess);

    // 2. Request again with different server response
    const nextFresh = vi.fn().mockResolvedValue(makeResponse({ version: 2 }));
    const result = await interceptor(req, nextFresh);

    // Should return version 1 immediately
    expect(result.body).toEqual({ version: 1 });

    // But should asynchronously trigger nextFresh in background to revalidate cache
    await vi.runAllTimersAsync();
    expect(nextFresh).toHaveBeenCalledTimes(1);

    // Third request should now see version 2
    const result3 = await interceptor(req, vi.fn());
    expect(result3.body).toEqual({ version: 2 });
  });

  it('deletes expired cache entries based on TTL', async () => {
    const interceptor = offlineCacheInterceptor({ strategy: 'network-first', ttl: 5000 });

    // Populate
    await interceptor(req, vi.fn().mockResolvedValue(makeResponse({ val: 'test' })));

    // Fast-forward past TTL
    vi.advanceTimersByTime(5001);

    // Request again, network fails. Cache should be deleted and not returned
    const next = vi.fn().mockRejectedValue(new Error('Network error'));
    await expect(interceptor(req, next)).rejects.toThrow('Network error');
    expect(mockCache.delete).toHaveBeenCalled();
  });

  it('bypasses offline cache if custom bypassHeader is present', async () => {
    const bypassReq: SerializableRequest = {
      ...req,
      headers: { 'x-bypass-offline-cache': ['true'] },
    };
    const next = vi.fn().mockResolvedValue(makeResponse());
    const interceptor = offlineCacheInterceptor();

    await interceptor(bypassReq, next);

    expect(mockCaches.open).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
