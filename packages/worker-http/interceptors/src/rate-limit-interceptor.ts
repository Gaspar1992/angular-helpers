import type { RateLimitConfig, WorkerInterceptorFn } from './worker-interceptor.types';

/**
 * Creates a client-side rate limiting interceptor using a sliding window algorithm.
 *
 * Tracks request timestamps within the configured window. When the limit is
 * exceeded, throws an error with status 429. State is per-factory-instance
 * (resets when the worker is terminated).
 *
 * @example
 * ```typescript
 * createWorkerPipeline([
 *   rateLimitInterceptor({ maxRequests: 10, windowMs: 5000 }),
 * ]);
 * ```
 */
export function rateLimitInterceptor(config?: RateLimitConfig): WorkerInterceptorFn {
  const maxRequests = config?.maxRequests ?? 100;
  const windowMs = config?.windowMs ?? 60_000;

  const timestamps: number[] = [];

  return async (req, next) => {
    const now = Date.now();
    const windowStart = now - windowMs;

    let i = 0;
    while (i < timestamps.length && timestamps[i] < windowStart) {
      i++;
    }
    timestamps.splice(0, i);

    if (timestamps.length >= maxRequests) {
      throw Object.assign(new Error('Rate limit exceeded'), { status: 429 });
    }

    timestamps.push(now);

    return next(req);
  };
}
