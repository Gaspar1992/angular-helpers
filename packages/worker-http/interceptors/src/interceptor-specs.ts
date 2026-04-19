import type {
  SerializableHmacConfig,
  SerializableLoggingConfig,
  WorkerInterceptorSpec,
} from './interceptor-spec.types';
import type {
  CacheConfig,
  ContentIntegrityConfig,
  RateLimitConfig,
  RetryConfig,
} from './worker-interceptor.types';

/**
 * Spec builders — pure factories that return POJO `WorkerInterceptorSpec`
 * objects suitable for `withWorkerInterceptors([...])`.
 *
 * Each builder mirrors the corresponding worker-side interceptor factory but
 * accepts only serializable config (no function fields).
 */
export function workerLogging(config?: SerializableLoggingConfig): WorkerInterceptorSpec {
  return { kind: 'logging', config };
}

export function workerRetry(config?: RetryConfig): WorkerInterceptorSpec {
  return { kind: 'retry', config };
}

export function workerCache(config?: CacheConfig): WorkerInterceptorSpec {
  return { kind: 'cache', config };
}

export function workerHmacSigning(config: SerializableHmacConfig): WorkerInterceptorSpec {
  return { kind: 'hmac-signing', config };
}

export function workerRateLimit(config?: RateLimitConfig): WorkerInterceptorSpec {
  return { kind: 'rate-limit', config };
}

export function workerContentIntegrity(config?: ContentIntegrityConfig): WorkerInterceptorSpec {
  return { kind: 'content-integrity', config };
}

/**
 * Reference a custom interceptor that has been registered on the worker side
 * via `registerInterceptor(name, factory)`.
 */
export function workerCustom(name: string, config?: unknown): WorkerInterceptorSpec {
  return { kind: 'custom', name, config };
}
