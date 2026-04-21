import { Observable } from 'rxjs';

import { detectTransferables } from './detect-transferables';
import { WorkerHttpTimeoutError } from './worker-http-timeout-error';
import type {
  WorkerTransport,
  WorkerTransportConfig,
  WorkerErrorResponse,
  WorkerResponse,
} from './worker-transport.types';

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

/**
 * Creates a typed, Observable-based transport for communicating with a web worker.
 *
 * Features:
 * - Request/response correlation via `requestId`
 * - Cancellation on Observable unsubscribe (also aborts `fetch()` in the worker)
 * - Per-request timeout (default 30 s) rejecting with `WorkerHttpTimeoutError`
 * - Optional worker pool with round-robin dispatch
 * - Lazy worker creation (default)
 * - Opt-in transferable detection (`transferDetection: 'auto'`) for zero-copy
 *   `ArrayBuffer` / stream payloads
 *
 * @example
 * ```typescript
 * const transport = createWorkerTransport<MyRequest, MyResponse>({
 *   workerFactory: () => new Worker(new URL('./my.worker.ts', import.meta.url), { type: 'module' }),
 *   maxInstances: 2,
 * });
 *
 * transport.execute(request).subscribe({
 *   next: (response) => console.log(response),
 *   error: (err) => console.error(err),
 * });
 * ```
 */
export function createWorkerTransport<TRequest = unknown, TResponse = unknown>(
  config: WorkerTransportConfig,
): WorkerTransport<TRequest, TResponse> {
  const workers: Worker[] = [];
  let roundRobinIndex = 0;
  let terminated = false;

  const maxInstances = Math.min(
    config.maxInstances ?? 1,
    typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? 4) : 1,
  );

  const requestTimeout = config.requestTimeout ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const transferDetection = config.transferDetection ?? 'none';

  function createWorker(): Worker {
    if (config.workerFactory) {
      return config.workerFactory();
    }
    if (config.workerUrl) {
      const url =
        typeof config.workerUrl === 'string'
          ? new URL(config.workerUrl, document.baseURI)
          : config.workerUrl;
      return new Worker(url, { type: 'module' });
    }
    throw new Error('Either workerFactory or workerUrl must be provided');
  }

  function getOrCreateWorker(): Worker {
    if (workers.length < maxInstances) {
      const worker = createWorker();
      if (config.initMessage) {
        worker.postMessage(config.initMessage);
      }
      workers.push(worker);
      return worker;
    }
    const worker = workers[roundRobinIndex % workers.length];
    roundRobinIndex++;
    return worker;
  }

  function execute(request: TRequest): Observable<TResponse> {
    if (terminated) {
      return new Observable((subscriber) => {
        subscriber.error(new Error('WorkerTransport has been terminated'));
      });
    }

    const requestId = crypto.randomUUID();

    return new Observable<TResponse>((subscriber) => {
      const worker = getOrCreateWorker();
      let settled = false;
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

      const cleanup = () => {
        worker.removeEventListener('message', messageHandler);
        worker.removeEventListener('error', errorHandler);
        if (timeoutHandle !== undefined) {
          clearTimeout(timeoutHandle);
          timeoutHandle = undefined;
        }
      };

      const messageHandler = (
        event: MessageEvent<WorkerResponse<TResponse> | WorkerErrorResponse>,
      ) => {
        const data = event.data;
        if (data.requestId !== requestId) return;
        if (settled) return;
        settled = true;
        cleanup();

        if (data.type === 'error') {
          const err = (data as WorkerErrorResponse).error;
          subscriber.error(new Error(err.message));
        } else {
          subscriber.next((data as WorkerResponse<TResponse>).result);
          subscriber.complete();
        }
      };

      const errorHandler = (event: ErrorEvent) => {
        if (settled) return;
        settled = true;
        cleanup();
        subscriber.error(new Error(event.message ?? 'Worker error'));
      };

      worker.addEventListener('message', messageHandler);
      worker.addEventListener('error', errorHandler);

      if (transferDetection === 'auto') {
        const transferables = detectTransferables(request);
        worker.postMessage({ type: 'request', requestId, payload: request }, transferables);
      } else {
        worker.postMessage({ type: 'request', requestId, payload: request });
      }

      if (requestTimeout > 0 && Number.isFinite(requestTimeout)) {
        timeoutHandle = setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          // Ask the worker to abort any in-flight work for this id. The
          // cancellation fix wires this through to `fetch()`.
          worker.postMessage({ type: 'cancel', requestId });
          subscriber.error(new WorkerHttpTimeoutError(requestTimeout));
        }, requestTimeout);
      }

      // Teardown: send cancel message on unsubscribe
      return () => {
        if (settled) return;
        settled = true;
        cleanup();
        worker.postMessage({ type: 'cancel', requestId });
      };
    });
  }

  function terminate(): void {
    terminated = true;
    for (const worker of workers) {
      worker.terminate();
    }
    workers.length = 0;
  }

  return {
    execute,
    terminate,
    get isActive() {
      return !terminated && workers.length > 0;
    },
    get activeInstances() {
      return workers.length;
    },
  };
}
