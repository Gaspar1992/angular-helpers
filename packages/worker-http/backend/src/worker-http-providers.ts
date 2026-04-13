import { EnvironmentProviders, Provider, makeEnvironmentProviders } from '@angular/core';
import { FetchBackend, HttpBackend, provideHttpClient, withFetch } from '@angular/common/http';

import { WorkerHttpBackend } from './worker-http-backend';
import { WorkerHttpClient } from './worker-http-client';
import {
  WORKER_HTTP_CONFIGS_TOKEN,
  WORKER_HTTP_FALLBACK_TOKEN,
  WORKER_HTTP_ROUTES_TOKEN,
  WORKER_HTTP_SERIALIZER_TOKEN,
} from './worker-http-tokens';
import type { WorkerSerializer } from '../../serializer/src/worker-serializer.types';
import type {
  WorkerConfig,
  WorkerFallbackStrategy,
  WorkerHttpFeature,
  WorkerHttpFeatureKind,
  WorkerRoute,
} from './worker-http-backend.types';

/**
 * Sets up the worker HTTP infrastructure and replaces Angular's `HttpBackend`
 * with `WorkerHttpBackend`.
 *
 * Drop-in companion to `provideHttpClient()`. Can be used INSTEAD of it —
 * `HttpClient` and the full interceptor chain are included automatically.
 *
 * @example
 * ```typescript
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideWorkerHttpClient(
 *       withWorkerConfigs([
 *         { id: 'public', workerUrl: new URL('./workers/public.worker', import.meta.url) },
 *       ]),
 *       withWorkerRoutes([
 *         { pattern: /\/api\//, worker: 'public', priority: 1 },
 *       ]),
 *       withWorkerFallback('main-thread'),
 *     ),
 *   ],
 * };
 * ```
 */
export function provideWorkerHttpClient(
  ...features: WorkerHttpFeature<WorkerHttpFeatureKind>[]
): EnvironmentProviders {
  const featureProviders: Provider[] = features.flatMap((f) => f.providers);

  return makeEnvironmentProviders([
    provideHttpClient(withFetch()),
    FetchBackend,
    { provide: HttpBackend, useClass: WorkerHttpBackend },
    WorkerHttpClient,
    ...featureProviders,
  ]);
}

/**
 * Registers worker definitions (id + workerUrl + optional pool size).
 *
 * At least one config is required for any request to reach a worker.
 *
 * @example
 * ```typescript
 * withWorkerConfigs([
 *   { id: 'public', workerUrl: new URL('./workers/public.worker', import.meta.url) },
 *   { id: 'secure', workerUrl: new URL('./workers/secure.worker', import.meta.url), maxInstances: 2 },
 * ])
 * ```
 */
export function withWorkerConfigs(configs: WorkerConfig[]): WorkerHttpFeature<'WorkerConfigs'> {
  return {
    kind: 'WorkerConfigs',
    providers: [{ provide: WORKER_HTTP_CONFIGS_TOKEN, useValue: configs }],
  };
}

/**
 * Declares URL-pattern → worker routing rules evaluated in priority order.
 *
 * When a request URL matches a pattern, the associated worker handles it.
 * Explicit `WORKER_TARGET` context always takes precedence over routes.
 *
 * @example
 * ```typescript
 * withWorkerRoutes([
 *   { pattern: /\/api\/secure\//, worker: 'secure', priority: 10 },
 *   { pattern: /\/api\//, worker: 'public', priority: 1 },
 * ])
 * ```
 */
export function withWorkerRoutes(routes: WorkerRoute[]): WorkerHttpFeature<'WorkerRoutes'> {
  return {
    kind: 'WorkerRoutes',
    providers: [{ provide: WORKER_HTTP_ROUTES_TOKEN, useValue: routes }],
  };
}

/**
 * Sets the fallback strategy when workers are unavailable (SSR, old browsers,
 * or when no route matches).
 *
 * - `'main-thread'` (default) — silently delegates to `FetchBackend`
 * - `'error'` — throws, forcing explicit handling in the application
 *
 * @example
 * ```typescript
 * withWorkerFallback('main-thread') // SSR-safe
 * ```
 */
export function withWorkerFallback(
  strategy: WorkerFallbackStrategy,
): WorkerHttpFeature<'WorkerFallback'> {
  return {
    kind: 'WorkerFallback',
    providers: [{ provide: WORKER_HTTP_FALLBACK_TOKEN, useValue: strategy }],
  };
}

/**
 * Configures a custom serializer for crossing the worker boundary.
 *
 * By default `WorkerHttpBackend` relies on the browser's structured clone algorithm
 * (safe for plain objects, arrays, primitives, `Date`, `ArrayBuffer`).
 * Use `withWorkerSerialization` when your request bodies contain types that
 * structured clone cannot handle (e.g. class instances, circular references, `Map`, `Set`).
 *
 * **Worker-side note:** The serialized form is what the worker receives as `req.body`.
 * If you use `createSerovalSerializer` or similar, add a worker-side interceptor
 * to deserialize the body before calling `fetch()`.
 *
 * @example
 * ```typescript
 * import { createSerovalSerializer } from '@angular-helpers/worker-http/serializer';
 *
 * provideWorkerHttpClient(
 *   withWorkerConfigs([...]),
 *   withWorkerSerialization(createSerovalSerializer()),
 * )
 * ```
 */
export function withWorkerSerialization(
  serializer: WorkerSerializer,
): WorkerHttpFeature<'WorkerSerialization'> {
  return {
    kind: 'WorkerSerialization',
    providers: [{ provide: WORKER_HTTP_SERIALIZER_TOKEN, useValue: serializer }],
  };
}
