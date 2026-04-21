import type { Observable } from 'rxjs';

/**
 * Configuration for creating a worker transport.
 *
 * IMPORTANT: Angular CLI's esbuild bundler only detects web workers when
 * `new Worker(new URL(...))` appears directly in application source code.
 * For pre-transpiled workers, use `workerUrl` instead.
 */
export interface WorkerTransportConfig {
  /**
   * Factory function that creates a new Worker instance.
   * The `new Worker(new URL(...))` call MUST be in your app code (not a library)
   * for Angular CLI to bundle the worker correctly.
   *
   * @example
   * ```typescript
   * workerFactory: () => new Worker(new URL('./echo.worker.ts', import.meta.url), { type: 'module' })
   * ```
   */
  workerFactory?: () => Worker;

  /**
   * URL to a pre-transpiled worker file.
   * Use this when workers are built separately (e.g., with Vite) and distributed
   * as static assets. Resolves against the document's base URI.
   *
   * @example
   * ```typescript
   * workerUrl: 'assets/workers/echo.worker.js'
   * // or with full URL
   * workerUrl: new URL('workers/echo.worker.js', import.meta.url).href
   * ```
   */
  workerUrl?: string | URL;

  /** Maximum number of worker instances in the pool (default: 1) */
  maxInstances?: number;

  /**
   * Transfer strategy for `postMessage` payloads.
   *
   * - `'none'` (default) — payloads are always structured-cloned, preserving
   *   the caller's access to the original data after post.
   * - `'auto'` — shallowly walks the payload and passes every detected
   *   `Transferable` (ArrayBuffer, MessagePort, ImageBitmap, OffscreenCanvas,
   *   ReadableStream, WritableStream, TransformStream) in the transfer list
   *   of `postMessage`. Large buffers move zero-copy; their `byteLength`
   *   becomes `0` in the main thread after post.
   *
   * The `'manual'` value is reserved for a future API where callers supply
   * their own transfer list per request. It currently behaves like `'none'`.
   */
  transferDetection?: 'auto' | 'manual' | 'none';

  /**
   * Per-request timeout in milliseconds. If the worker does not respond
   * within this window, `execute()` errors with `WorkerHttpTimeoutError`
   * and a cancel message is posted to the worker. Set to `0` or
   * non-finite to disable the timeout entirely. Default: `30000` (30 s).
   */
  requestTimeout?: number;

  /**
   * Optional handshake message posted to every worker as soon as it is
   * created, BEFORE any request. Useful to ship runtime configuration
   * (e.g. interceptor specs) that the worker uses to build its pipeline.
   *
   * The shape is opaque to the transport — the worker is responsible for
   * recognising and acting on it.
   */
  initMessage?: { type: string; [key: string]: unknown };
}

/**
 * Message sent from main thread to worker.
 */
export interface WorkerMessage<TPayload = unknown> {
  type: 'request' | 'cancel';
  requestId: string;
  payload?: TPayload;
  transferables?: Transferable[];
}

/**
 * Successful response from worker to main thread.
 */
export interface WorkerResponse<TResult = unknown> {
  type: 'response';
  requestId: string;
  result: TResult;
  transferables?: Transferable[];
}

/**
 * Error response from worker to main thread.
 */
export interface WorkerErrorResponse {
  type: 'error';
  requestId: string;
  error: {
    message: string;
    name: string;
    stack?: string;
    status?: number;
    statusText?: string;
  };
}

/**
 * Typed transport interface for communicating with a web worker.
 * Observable-based: unsubscribing sends a cancel message to the worker.
 */
export interface WorkerTransport<TRequest = unknown, TResponse = unknown> {
  /** Send a request to the worker and get an Observable response */
  execute(request: TRequest): Observable<TResponse>;

  /** Terminate all workers and release resources */
  terminate(): void;

  /** Whether the transport has active workers */
  readonly isActive: boolean;

  /** Number of currently active worker instances */
  readonly activeInstances: number;
}
