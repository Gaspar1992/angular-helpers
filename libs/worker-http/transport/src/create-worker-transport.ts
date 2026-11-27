import { Observable, BehaviorSubject } from 'rxjs';

import { detectTransferables } from './detect-transferables';
import { WorkerHttpAbortError } from './worker-http-abort-error';
import { WorkerHttpTimeoutError } from './worker-http-timeout-error';
import { wrapWorker } from './wrap-worker';
import type { TransportPort } from './transport-port.types';
import type {
  WorkerExecuteOptions,
  WorkerTransport,
  WorkerTransportConfig,
  WorkerErrorResponse,
  WorkerResponse,
  WorkerMessage,
  WorkerBatchResponse,
} from './worker-transport.types';

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

function generateRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Creates a typed, Observable-based transport for communicating with a web worker.
 */
export function createWorkerTransport<TRequest = unknown, TResponse = unknown>(
  config: WorkerTransportConfig,
): WorkerTransport<TRequest, TResponse> {
  const instances: TransportPort[] = [];
  let roundRobinIndex = 0;
  let terminated = false;

  const batchBuffer = new Map<TransportPort, Omit<WorkerMessage, 'transferables'>[]>();
  const batchTransferables = new Map<TransportPort, Transferable[]>();
  let flushScheduled = false;

  function scheduleFlush() {
    if (flushScheduled || terminated) return;
    flushScheduled = true;
    queueMicrotask(() => {
      flushScheduled = false;
      if (terminated) {
        batchBuffer.clear();
        batchTransferables.clear();
        return;
      }

      for (const [instance, messages] of batchBuffer.entries()) {
        const transferables = batchTransferables.get(instance) || [];
        instance.postMessage({ type: 'batch', messages }, transferables);
      }

      batchBuffer.clear();
      batchTransferables.clear();
    });
  }

  function dispatchToWorker(
    instance: TransportPort,
    msg: Omit<WorkerMessage, 'transferables'>,
    transferables?: Transferable[],
  ) {
    if (!batchBuffer.has(instance)) {
      batchBuffer.set(instance, []);
    }
    batchBuffer.get(instance)!.push(msg);

    if (transferables?.length) {
      if (!batchTransferables.has(instance)) {
        batchTransferables.set(instance, []);
      }
      batchTransferables.get(instance)!.push(...transferables);
    }
    scheduleFlush();
  }

  const mode = config.mode ?? 'worker';
  const sharedWorkerName = config.sharedWorkerName ?? 'worker-http';

  const maxInstances = Math.min(
    config.maxInstances ?? 1,
    typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? 4) : 1,
  );

  const requestTimeout = config.requestTimeout ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const transferDetection = config.transferDetection ?? 'none';
  const streamsPolyfill = config.streamsPolyfill ?? false;
  let polyfillLoaded = false;
  let polyfillPromise: Promise<void> | null = null;
  let deserializeFn: ((port: MessagePort) => ReadableStream) | null = null;

  // Active requests mapped by request ID for O(1) demuxing
  const activeRequests = new Map<
    string,
    {
      subscriber: any;
      instance: TransportPort;
      cleanup: () => void;
      onResponse: (data: WorkerResponse<TResponse> | WorkerErrorResponse) => void;
      onError: (event: ErrorEvent) => void;
    }
  >();

  const instanceDemuxListeners = new Map<
    TransportPort,
    {
      message: (event: MessageEvent) => void;
      error: (event: ErrorEvent) => void;
    }
  >();

  function ensureDemuxListeners(instance: TransportPort) {
    if (instanceDemuxListeners.has(instance)) return;
    const message = (
      event: MessageEvent<WorkerResponse<TResponse> | WorkerErrorResponse | WorkerBatchResponse>,
    ) => {
      const data = event.data;
      if (!data) return;
      if (data.type === 'batch-response') {
        for (const item of data.responses) {
          const entry = activeRequests.get(item.requestId);
          entry?.onResponse(item as any);
        }
      } else if ('requestId' in data && data.requestId) {
        const entry = activeRequests.get(data.requestId);
        entry?.onResponse(data as any);
      }
    };
    const error = (event: ErrorEvent) => {
      for (const entry of Array.from(activeRequests.values())) {
        if (entry.instance === instance) {
          entry.onError(event);
        }
      }
    };
    instance.addEventListener('message', message);
    instance.addEventListener('error', error);
    instanceDemuxListeners.set(instance, { message, error });
  }

  const statusSubject = new BehaviorSubject<'healthy' | 'degraded' | 'unsupported'>(
    typeof Worker === 'undefined' ? 'unsupported' : 'healthy',
  );

  // Heartbeat monitoring schedules
  const heartbeatIntervals = new Map<TransportPort, ReturnType<typeof setInterval>>();
  const heartbeatTimeouts = new Map<TransportPort, ReturnType<typeof setTimeout>>();

  function startHeartbeat(instance: TransportPort) {
    const interval = config.heartbeatInterval ?? 0;
    if (interval <= 0) return;

    const timeoutMs = config.heartbeatTimeout ?? 2000;

    const pongListener = (event: MessageEvent) => {
      const data = event.data ?? {};
      if (data.type === 'pong') {
        const timeoutHandle = heartbeatTimeouts.get(instance);
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          heartbeatTimeouts.delete(instance);
        }
        if (statusSubject.value === 'degraded') {
          statusSubject.next('healthy');
        }
      }
    };
    instance.addEventListener('message', pongListener);

    const errorCrashListener = (event: ErrorEvent) => {
      handleInstanceCrash(
        instance,
        new Error(event.message ?? 'Worker exited with execution error'),
      );
    };
    instance.addEventListener('error', errorCrashListener);

    const intervalHandle = setInterval(() => {
      if (heartbeatTimeouts.has(instance)) return;

      const pingRequestId = generateRequestId();

      const timeoutHandle = setTimeout(() => {
        handleInstanceCrash(
          instance,
          new Error('Web Worker heartbeat timeout (possible OOM crash)'),
        );
      }, timeoutMs);

      heartbeatTimeouts.set(instance, timeoutHandle);
      instance.postMessage({ type: 'ping', requestId: pingRequestId });
    }, interval);

    heartbeatIntervals.set(instance, intervalHandle);

    // Save listeners onto instance to clean them up on teardown
    (instance as any)._pongListener = pongListener;
    (instance as any)._errorCrashListener = errorCrashListener;
  }

  function handleInstanceCrash(instance: TransportPort, error: Error) {
    statusSubject.next('degraded');
    try {
      if (instance.terminate) {
        instance.terminate();
      }
    } catch {
      /* ignore */
    }

    const intervalHandle = heartbeatIntervals.get(instance);
    if (intervalHandle) {
      clearInterval(intervalHandle);
      heartbeatIntervals.delete(instance);
    }
    const timeoutHandle = heartbeatTimeouts.get(instance);
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      heartbeatTimeouts.delete(instance);
    }

    if ((instance as any)._pongListener) {
      instance.removeEventListener('message', (instance as any)._pongListener);
    }
    if ((instance as any)._errorCrashListener) {
      instance.removeEventListener('error', (instance as any)._errorCrashListener);
    }

    const idx = instances.indexOf(instance);
    if (idx !== -1) {
      instances.splice(idx, 1);
    }

    // Fail all active subscriptions routed to this dead instance
    for (const [, req] of activeRequests.entries()) {
      if (req.instance === instance) {
        req.cleanup();
        req.subscriber.error(error);
      }
    }
  }

  function createInstance(index: number): TransportPort {
    let worker: Worker | SharedWorker;

    if (config.workerFactory) {
      worker = config.workerFactory() as Worker | SharedWorker;
    } else if (config.workerUrl) {
      const url =
        typeof config.workerUrl === 'string'
          ? new URL(
              config.workerUrl,
              typeof document !== 'undefined' ? document.baseURI : 'http://localhost',
            )
          : config.workerUrl;

      if (mode === 'shared') {
        const name = maxInstances > 1 ? `${sharedWorkerName}-${index}` : sharedWorkerName;
        worker = new SharedWorker(url, { type: 'module', name });
      } else {
        worker = new Worker(url, { type: 'module' });
      }
    } else {
      throw new Error('Either workerFactory or workerUrl must be provided');
    }

    return wrapWorker(worker);
  }

  function getOrCreateInstance(): TransportPort {
    if (instances.length < maxInstances) {
      const instance = createInstance(instances.length);
      if (instance.start) {
        instance.start();
      }
      if (config.initMessage) {
        instance.postMessage(config.initMessage);
      }
      instances.push(instance);
      startHeartbeat(instance);
      return instance;
    }
    const instance = instances[roundRobinIndex % instances.length];
    roundRobinIndex++;
    return instance;
  }

  function execute(request: TRequest, options?: WorkerExecuteOptions): Observable<TResponse> {
    if (terminated) {
      return new Observable((subscriber) => {
        subscriber.error(new Error('WorkerTransport has been terminated'));
      });
    }

    const requestId = generateRequestId();
    const externalSignal = options?.signal;
    const effectiveTimeout = options?.timeout ?? requestTimeout;

    return new Observable<TResponse>((subscriber) => {
      if (externalSignal?.aborted) {
        subscriber.error(new WorkerHttpAbortError(externalSignal.reason));
        return () => undefined;
      }

      if (streamsPolyfill && !polyfillLoaded && !polyfillPromise) {
        polyfillPromise = loadStreamsPolyfill().catch((err) => {
          // oxlint-disable-next-line no-console
          console.warn('[worker-http] Streams polyfill failed to load:', err);
        });
      }

      const instance = getOrCreateInstance();
      ensureDemuxListeners(instance);
      let settled = false;
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
      let abortListener: (() => void) | undefined;

      const cleanup = () => {
        if (timeoutHandle !== undefined) {
          clearTimeout(timeoutHandle);
          timeoutHandle = undefined;
        }
        if (abortListener && externalSignal) {
          externalSignal.removeEventListener('abort', abortListener);
          abortListener = undefined;
        }
        activeRequests.delete(requestId);
      };

      const deliverResponse = (data: WorkerResponse<TResponse> | WorkerErrorResponse) => {
        if (data.type === 'error') {
          subscriber.error(new Error(data.error.message));
        } else {
          const result = data.result as any;
          if (result && typeof result === 'object') {
            if (result._bodyWasString && result.body instanceof ArrayBuffer) {
              if (typeof TextDecoder !== 'undefined') {
                result.body = new TextDecoder().decode(result.body);
              }
              delete result._bodyWasString;
            }
            if (
              deserializeFn &&
              result.body &&
              typeof result.body === 'object' &&
              result.body.__isStreamPolyfillPort
            ) {
              result.body = deserializeFn(result.body.port);
            }
          }
          subscriber.next(data.result);
          subscriber.complete();
        }
      };

      const handleResponse = (data: WorkerResponse<TResponse> | WorkerErrorResponse) => {
        if (data.requestId !== requestId) return;
        if (settled) return;
        settled = true;
        cleanup();

        if (streamsPolyfill && !polyfillLoaded && polyfillPromise) {
          void polyfillPromise.then(() => deliverResponse(data));
          return;
        }
        deliverResponse(data);
      };

      const errorHandler = (event: ErrorEvent) => {
        if (settled) return;
        settled = true;
        cleanup();
        subscriber.error(new Error(event.message ?? 'Worker error'));
      };

      // Register this active request for O(1) demux
      activeRequests.set(requestId, {
        subscriber,
        instance,
        cleanup: () => {
          settled = true;
          cleanup();
        },
        onResponse: handleResponse,
        onError: errorHandler,
      });

      let finalRequest = request as any;
      const requestTransferables: Transferable[] = [];

      if (
        finalRequest &&
        typeof finalRequest === 'object' &&
        typeof finalRequest.body === 'string'
      ) {
        const bodyStr = finalRequest.body;
        if (typeof TextEncoder !== 'undefined') {
          const encoded = new TextEncoder().encode(bodyStr);
          if (encoded.byteLength > 102400) {
            finalRequest = {
              ...finalRequest,
              body: encoded.buffer,
              _bodyWasString: true,
            };
            requestTransferables.push(encoded.buffer);
          }
        }
      }

      let extraTransferables: Transferable[] = [];
      if (transferDetection === 'auto') {
        extraTransferables = detectTransferables(finalRequest);
      }
      const allTransferables = [...new Set([...requestTransferables, ...extraTransferables])];

      if (allTransferables.length > 0) {
        dispatchToWorker(
          instance,
          { type: 'request', requestId, payload: finalRequest },
          allTransferables,
        );
      } else {
        dispatchToWorker(instance, { type: 'request', requestId, payload: finalRequest });
      }

      if (effectiveTimeout > 0 && Number.isFinite(effectiveTimeout)) {
        timeoutHandle = setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          dispatchToWorker(instance, { type: 'cancel', requestId });
          subscriber.error(new WorkerHttpTimeoutError(effectiveTimeout));
        }, effectiveTimeout);
      }

      if (externalSignal) {
        abortListener = () => {
          if (settled) return;
          settled = true;
          const reason = externalSignal.reason;
          cleanup();
          dispatchToWorker(instance, { type: 'cancel', requestId });
          subscriber.error(new WorkerHttpAbortError(reason));
        };
        externalSignal.addEventListener('abort', abortListener, { once: true });
      }

      return () => {
        if (settled) return;
        settled = true;
        cleanup();
        dispatchToWorker(instance, { type: 'cancel', requestId });
      };
    });
  }

  async function loadStreamsPolyfill(): Promise<void> {
    if (!streamsPolyfill || polyfillLoaded) {
      return;
    }

    try {
      const { needsPolyfill, ponyfillStreams, deserializePortToStream } =
        await import('@angular-helpers/worker-http/streams-polyfill');

      if (needsPolyfill()) {
        await ponyfillStreams();
        deserializeFn = deserializePortToStream;
      }

      polyfillLoaded = true;
    } catch (err) {
      // oxlint-disable-next-line no-console
      console.warn('[worker-http] Failed to load streams polyfill:', err);
    }
  }

  function terminate(): void {
    terminated = true;
    batchBuffer.clear();
    batchTransferables.clear();
    for (const instance of instances) {
      const intervalHandle = heartbeatIntervals.get(instance);
      if (intervalHandle) clearInterval(intervalHandle);
      const timeoutHandle = heartbeatTimeouts.get(instance);
      if (timeoutHandle) clearTimeout(timeoutHandle);

      if ((instance as any)._pongListener) {
        instance.removeEventListener('message', (instance as any)._pongListener);
      }
      if ((instance as any)._errorCrashListener) {
        instance.removeEventListener('error', (instance as any)._errorCrashListener);
      }

      const demux = instanceDemuxListeners.get(instance);
      if (demux) {
        instance.removeEventListener('message', demux.message);
        instance.removeEventListener('error', demux.error);
      }

      try {
        if (instance.terminate) instance.terminate();
      } catch {
        /* ignore */
      }
    }
    instances.length = 0;
    heartbeatIntervals.clear();
    heartbeatTimeouts.clear();
    instanceDemuxListeners.clear();

    for (const [, req] of activeRequests.entries()) {
      req.cleanup();
    }
    activeRequests.clear();
    statusSubject.complete();
  }

  return {
    execute,
    terminate,
    get isActive() {
      return !terminated && instances.length > 0;
    },
    get activeInstances() {
      return instances.length;
    },
    status$: statusSubject.asObservable(),
  };
}
