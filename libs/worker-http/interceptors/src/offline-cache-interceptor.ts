import type { SerializableResponse, WorkerInterceptorFn } from './worker-interceptor.types';
import { OFFLINE_CACHE_DEFAULTS } from './offline-cache.constants';
import type { OfflineCacheConfig } from './offline-cache.types';

/**
 * Creates an offline cache interceptor that leverages native Cache API in the worker thread.
 * Only caches GET requests.
 *
 * @param config Optional configuration for the offline cache.
 */
export function offlineCacheInterceptor(config?: OfflineCacheConfig): WorkerInterceptorFn {
  const strategy = config?.strategy ?? OFFLINE_CACHE_DEFAULTS.STRATEGY;
  const cacheName = config?.cacheName ?? OFFLINE_CACHE_DEFAULTS.CACHE_NAME;
  const ttl = config?.ttl ?? OFFLINE_CACHE_DEFAULTS.TTL;
  const bypassHeader = (config?.bypassHeader ?? OFFLINE_CACHE_DEFAULTS.BYPASS_HEADER).toLowerCase();

  return async (req, next) => {
    // Only cache GET requests and only if bypass header is not present
    const bypass = Object.keys(req.headers).some((h) => h.toLowerCase() === bypassHeader);

    if (req.method.toUpperCase() !== OFFLINE_CACHE_DEFAULTS.HTTP_METHOD_GET || bypass) {
      return next(req);
    }

    const cacheKey = `${OFFLINE_CACHE_DEFAULTS.VIRTUAL_BASE_URL}${encodeURIComponent(req.url)}`;
    const cacheContext = typeof caches !== 'undefined' ? caches : null;

    if (!cacheContext) {
      // If Cache API is not supported in the current environment, fallback to direct fetch
      return next(req);
    }

    let cache: Cache;
    try {
      cache = await cacheContext.open(cacheName);
    } catch {
      // Fallback in case of opening cache failure (e.g. security constraints)
      return next(req);
    }

    const getCachedResponse = async (): Promise<SerializableResponse | null> => {
      try {
        const matched = await cache.match(cacheKey);
        if (!matched) return null;

        const dateHeader = matched.headers.get(OFFLINE_CACHE_DEFAULTS.HEADER_STORAGE_DATE);
        if (dateHeader && Date.now() - new Date(dateHeader).getTime() > ttl) {
          await cache.delete(cacheKey);
          return null;
        }

        // Convert Headers back to Record<string, string[]>
        const headersRecord: Record<string, string[]> = {};
        matched.headers.forEach((val, name) => {
          headersRecord[name] = [val];
        });

        // Safe body parsing
        let body: unknown;
        try {
          body = await matched.json();
        } catch {
          body = await matched.text();
        }

        return {
          status: matched.status,
          statusText: matched.statusText,
          headers: headersRecord,
          body,
          url: req.url,
        };
      } catch {
        return null;
      }
    };

    const cacheResponse = async (res: SerializableResponse) => {
      try {
        const responseToCache = new Response(JSON.stringify(res.body), {
          status: res.status,
          statusText: res.statusText,
          headers: {
            [OFFLINE_CACHE_DEFAULTS.HEADER_CONTENT_TYPE]: OFFLINE_CACHE_DEFAULTS.CONTENT_TYPE_JSON,
            [OFFLINE_CACHE_DEFAULTS.HEADER_STORAGE_DATE]: new Date().toISOString(),
          },
        });
        await cache.put(cacheKey, responseToCache);
      } catch (err) {
        console.error('[offlineCacheInterceptor] Error writing response to cache:', err);
      }
    };

    if (strategy === OFFLINE_CACHE_DEFAULTS.STRATEGY_CACHE_FIRST) {
      const cached = await getCachedResponse();
      if (cached) {
        // Asynchronously update cache in the background (stale-while-revalidate)
        const promise = next(req);
        if (promise && typeof promise.then === 'function') {
          promise
            .then((fresh) => {
              if (fresh && fresh.status >= 200 && fresh.status < 300) {
                cacheResponse(fresh);
              }
            })
            .catch(() => {});
        }
        return cached;
      }
    }

    try {
      const response = await next(req);
      if (response.status >= 200 && response.status < 300) {
        await cacheResponse(response);
      }
      return response;
    } catch (networkError) {
      if (strategy === OFFLINE_CACHE_DEFAULTS.STRATEGY_NETWORK_FIRST) {
        const cached = await getCachedResponse();
        if (cached) {
          return cached;
        }
      }
      throw networkError;
    }
  };
}
