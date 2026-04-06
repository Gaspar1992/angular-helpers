import type {
  CacheConfig,
  SerializableResponse,
  WorkerInterceptorFn,
} from './worker-interceptor.types';

interface CacheEntry {
  response: SerializableResponse;
  expiresAt: number;
}

/**
 * Creates a cache interceptor that stores responses in worker memory.
 *
 * Caches GET responses by default (configurable). Evicts oldest entry
 * when `maxEntries` is reached (insertion-order eviction).
 * Each factory call creates an independent cache instance.
 *
 * @example
 * ```typescript
 * createWorkerPipeline([
 *   cacheInterceptor({ ttl: 30000, maxEntries: 50 }),
 * ]);
 * ```
 */
export function cacheInterceptor(config?: CacheConfig): WorkerInterceptorFn {
  const ttl = config?.ttl ?? 60_000;
  const maxEntries = config?.maxEntries ?? 100;
  const methods = config?.methods ?? ['GET'];

  const cache = new Map<string, CacheEntry>();

  return async (req, next) => {
    if (!methods.includes(req.method.toUpperCase())) {
      return next(req);
    }

    if (ttl === 0) {
      return next(req);
    }

    const cacheKey = `${req.method.toUpperCase()}:${req.url}`;
    const now = Date.now();

    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.response;
    }

    if (cached) {
      cache.delete(cacheKey);
    }

    const response = await next(req);

    if (cache.size >= maxEntries) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    cache.set(cacheKey, { response, expiresAt: now + ttl });

    return response;
  };
}
