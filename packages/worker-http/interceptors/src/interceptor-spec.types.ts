import type {
  CacheConfig,
  ContentIntegrityConfig,
  HmacInterceptorConfig,
  LoggingConfig,
  RateLimitConfig,
  RetryConfig,
} from './worker-interceptor.types';

/**
 * Serializable subset of LoggingConfig — `logger` is a function and cannot
 * cross the worker boundary, so it is dropped here. The configurable pipeline
 * uses `console.log` inside the worker for built-in logging.
 */
export type SerializableLoggingConfig = Omit<LoggingConfig, 'logger'>;

/**
 * Serializable subset of HmacInterceptorConfig — `payloadBuilder` is a function
 * and cannot cross the worker boundary. The default payload builder is used.
 *
 * `keyMaterial` is `ArrayBuffer | Uint8Array`, both of which ARE supported by
 * the structured clone algorithm.
 */
export type SerializableHmacConfig = Omit<HmacInterceptorConfig, 'payloadBuilder'>;

/**
 * Discriminated union of interceptor specifications that can be configured
 * from Angular DI via `withWorkerInterceptors([...])` and forwarded to the
 * worker over `postMessage`.
 *
 * For interceptors with custom function fields (loggers, payload builders),
 * register the interceptor in the worker file via `registerInterceptor()` and
 * reference it here with `kind: 'custom'`.
 */
export type WorkerInterceptorSpec =
  | { readonly kind: 'logging'; readonly config?: SerializableLoggingConfig }
  | { readonly kind: 'retry'; readonly config?: RetryConfig }
  | { readonly kind: 'cache'; readonly config?: CacheConfig }
  | { readonly kind: 'hmac-signing'; readonly config: SerializableHmacConfig }
  | { readonly kind: 'rate-limit'; readonly config?: RateLimitConfig }
  | { readonly kind: 'content-integrity'; readonly config?: ContentIntegrityConfig }
  | { readonly kind: 'custom'; readonly name: string; readonly config?: unknown };

/**
 * Wire format for the init handshake message sent from the main thread to the
 * worker. Posted exactly once per worker, before any HTTP request.
 */
export interface WorkerInterceptorInitMessage {
  readonly type: 'init-interceptors';
  readonly specs: readonly WorkerInterceptorSpec[];
}
