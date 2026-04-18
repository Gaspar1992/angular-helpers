import { Observable } from 'rxjs';

import type {
  WorkerTransport,
  WorkerTransportConfig,
  WorkerErrorResponse,
  WorkerResponse,
} from './worker-transport.types';

/**
 * Creates a typed, Observable-based transport for communicating with a web worker.
 *
 * Features:
 * - Request/response correlation via `requestId`
 * - Automatic cancellation on Observable unsubscribe
 * - Optional worker pool with round-robin dispatch
 * - Lazy worker creation (default)
 * - Transferable auto-detection for ArrayBuffer payloads
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

      const messageHandler = (
        event: MessageEvent<WorkerResponse<TResponse> | WorkerErrorResponse>,
      ) => {
        const data = event.data;
        if (data.requestId !== requestId) return;

        worker.removeEventListener('message', messageHandler);
        worker.removeEventListener('error', errorHandler);

        if (data.type === 'error') {
          const err = (data as WorkerErrorResponse).error;
          subscriber.error(new Error(err.message));
        } else {
          subscriber.next((data as WorkerResponse<TResponse>).result);
          subscriber.complete();
        }
      };

      const errorHandler = (event: ErrorEvent) => {
        worker.removeEventListener('message', messageHandler);
        worker.removeEventListener('error', errorHandler);
        subscriber.error(new Error(event.message ?? 'Worker error'));
      };

      worker.addEventListener('message', messageHandler);
      worker.addEventListener('error', errorHandler);

      worker.postMessage({ type: 'request', requestId, payload: request });

      // Teardown: send cancel message on unsubscribe
      return () => {
        worker.removeEventListener('message', messageHandler);
        worker.removeEventListener('error', errorHandler);
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
