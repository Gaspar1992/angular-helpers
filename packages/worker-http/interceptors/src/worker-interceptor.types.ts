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

/**
 * Pure-function interceptor that runs inside a web worker.
 *
 * Constraints:
 * - No `inject()` — Angular DI does not exist in the worker
 * - No DOM access — workers have no `document` or `window`
 * - No closures over external mutable state
 * - Must be serialization-safe (bundled at build time, not transferred at runtime)
 */
export type WorkerInterceptorFn = (
  req: SerializableRequest,
  next: (req: SerializableRequest) => Promise<SerializableResponse>,
) => Promise<SerializableResponse>;

/**
 * Configuration for the retry interceptor.
 */
export interface RetryConfig {
  /** Maximum number of retries (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms (default: 1000) */
  initialDelay?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** HTTP status codes that should trigger a retry (default: [408, 429, 500, 502, 503, 504]) */
  retryStatusCodes?: number[];
}

/**
 * Configuration for the cache interceptor.
 */
export interface CacheConfig {
  /** TTL in ms (default: 60000 = 1 min) */
  ttl?: number;
  /** Maximum number of cached entries (default: 100) */
  maxEntries?: number;
  /** HTTP methods to cache (default: ['GET']) */
  methods?: string[];
}

/**
 * Configuration for the HMAC signing interceptor.
 */
export interface HmacInterceptorConfig {
  /** Raw key material for HMAC signing */
  keyMaterial: ArrayBuffer | Uint8Array;
  /** Hash algorithm (default: 'SHA-256') */
  algorithm?: 'SHA-256' | 'SHA-384' | 'SHA-512';
  /** Header name for the signature (default: 'X-HMAC-Signature') */
  headerName?: string;
  /** Function to build the signing payload from the request (default: `${method}:${url}:${body}`) */
  payloadBuilder?: (req: SerializableRequest) => string;
}

/**
 * Configuration for the rate limit interceptor.
 */
export interface RateLimitConfig {
  /** Maximum requests per window (default: 100) */
  maxRequests?: number;
  /** Window size in ms (default: 60000 = 1 min) */
  windowMs?: number;
}
