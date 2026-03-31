import type { Observable } from 'rxjs';

/**
 * Configuration for creating a worker transport.
 */
export interface WorkerTransportConfig {
  /** URL of the worker script (use `new URL('./worker.ts', import.meta.url)`) */
  workerUrl: URL;

  /** Maximum number of worker instances in the pool (default: 1) */
  maxInstances?: number;

  /** Transfer strategy for large payloads */
  transferDetection?: 'auto' | 'manual' | 'none';

  /** Timeout in ms for a single request (default: 30000) */
  requestTimeout?: number;

  /** Whether to create the worker lazily on first request (default: true) */
  lazy?: boolean;
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
