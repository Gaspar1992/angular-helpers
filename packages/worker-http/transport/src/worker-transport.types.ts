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

  /** Transfer strategy for large payloads */
  transferDetection?: 'auto' | 'manual' | 'none';

  /** Timeout in ms for a single request (default: 30000) */
  requestTimeout?: number;
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
