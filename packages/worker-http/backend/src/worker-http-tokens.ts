import { InjectionToken } from '@angular/core';
import { HttpContextToken } from '@angular/common/http';

import type {
  WorkerConfig,
  WorkerFallbackStrategy,
  WorkerRoute,
} from './worker-http-backend.types';
import type { WorkerSerializer } from '@angular-helpers/worker-http/serializer';

/**
 * Per-request HttpContextToken that carries the target worker ID.
 *
 * `null` → use URL-pattern auto-routing (or main-thread fallback if no route matches).
 *
 * @example
 * ```typescript
 * // With WorkerHttpClient (recommended)
 * this.http.get('/api/data', { worker: 'secure' });
 *
 * // With standard HttpClient (power user)
 * this.http.get('/api/data', {
 *   context: new HttpContext().set(WORKER_TARGET, 'secure'),
 * });
 * ```
 */
export const WORKER_TARGET = new HttpContextToken<string | null>(() => null);

/**
 * Registered worker definitions provided via `withWorkerConfigs()`.
 */
export const WORKER_HTTP_CONFIGS_TOKEN = new InjectionToken<WorkerConfig[]>('WorkerHttpConfigs', {
  factory: () => [],
});

/**
 * URL-pattern routing rules provided via `withWorkerRoutes()`.
 */
export const WORKER_HTTP_ROUTES_TOKEN = new InjectionToken<WorkerRoute[]>('WorkerHttpRoutes', {
  factory: () => [],
});

/**
 * Fallback strategy provided via `withWorkerFallback()`.
 * Defaults to `'main-thread'` (safe for SSR / unsupported environments).
 */
export const WORKER_HTTP_FALLBACK_TOKEN = new InjectionToken<WorkerFallbackStrategy>(
  'WorkerHttpFallback',
  { factory: () => 'main-thread' as WorkerFallbackStrategy },
);

/**
 * Optional serializer for crossing the worker boundary.
 * Provided via `withWorkerSerialization()`. Defaults to `null` (structured clone).
 *
 * When set, `WorkerHttpBackend` serializes the request body before `postMessage`
 * using this serializer. The worker-side `createWorkerPipeline()` receives the
 * serialized form — add a worker interceptor to deserialize it if needed.
 */
export const WORKER_HTTP_SERIALIZER_TOKEN = new InjectionToken<WorkerSerializer | null>(
  'WorkerHttpSerializer',
  { factory: () => null },
);
