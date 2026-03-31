import type { Provider } from '@angular/core';

/**
 * Discriminated union for worker HTTP feature kinds.
 * Mirrors Angular's HttpFeatureKind pattern.
 */
export type WorkerHttpFeatureKind =
  | 'WorkerConfigs'
  | 'WorkerRoutes'
  | 'WorkerFallback'
  | 'WorkerSerialization';

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
