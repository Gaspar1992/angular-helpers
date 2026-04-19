import type { Provider } from '@angular/core';

/**
 * Discriminated union for worker HTTP feature kinds.
 * Mirrors Angular's HttpFeatureKind pattern.
 */
export type WorkerHttpFeatureKind =
  | 'WorkerConfigs'
  | 'WorkerRoutes'
  | 'WorkerFallback'
  | 'WorkerSerialization'
  | 'WorkerInterceptors'
  | 'Telemetry';

/**
 * Feature object — mirrors Angular's HttpFeature<K> shape.
 */
export interface WorkerHttpFeature<K extends WorkerHttpFeatureKind> {
  readonly kind: K;
  readonly providers: Provider[];
}

/**
 * Single worker definition.
 */
export interface WorkerConfig {
  /** Unique identifier used for routing / explicit selection */
  id: string;
  /** URL of the worker script (passed to `new Worker(url)`) */
  workerUrl: URL;
  /** Maximum worker instances in the pool (default: 1) */
  maxInstances?: number;
}

/**
 * URL-pattern to worker auto-routing rule.
 */
export interface WorkerRoute {
  /** URL pattern to match (RegExp or string prefix) */
  pattern: RegExp | string;
  /** Must match a WorkerConfig.id */
  worker: string;
  /** Higher priority = evaluated first (default: 0) */
  priority?: number;
}

/**
 * Fallback strategy when workers are unavailable (SSR, old browsers).
 */
export type WorkerFallbackStrategy = 'main-thread' | 'error';

/**
 * Serializable HTTP request — POJO version of Angular's HttpRequest.
 * Structured-clone safe: no classes, no functions, no prototype chains.
 */
export interface SerializableRequest {
  method: string;
  url: string;
  headers: Record<string, string[]>;
  params: Record<string, string[]>;
  body: unknown;
  responseType: 'json' | 'text' | 'blob' | 'arraybuffer';
  withCredentials: boolean;
  context: Record<string, unknown>;
}

/**
 * Serializable HTTP response — POJO version of Angular's HttpResponse.
 */
export interface SerializableResponse {
  status: number;
  statusText: string;
  headers: Record<string, string[]>;
  body: unknown;
  url: string;
}
