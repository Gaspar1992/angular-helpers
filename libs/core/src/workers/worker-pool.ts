/* eslint-disable no-restricted-imports */
import { DestroyRef, inject } from '@angular/core';
import { detectTransferables } from '@angular-helpers/core/utils';
import { injectPlatform } from '../utils/platform';

export function injectWorkerPool(
  workerUrl: URL | string,
  options?: Omit<WorkerPoolOptions, 'workerFactory'> & {
    fallbackWorkerCode?: string;
  },
): WorkerPool {
  const { isBrowser } = injectPlatform();

  const pool = new WorkerPool({
    ...options,
    workerFactory: () => {
      if (!isBrowser || typeof Worker === 'undefined') {
        throw new Error('Web Workers are not available in this environment');
      }

      const urlString = workerUrl instanceof URL ? workerUrl.toString() : workerUrl;

      // Reject insecure HTTP URLs (except loopback hosts) to prevent MITM on worker code
      if (urlString.startsWith('http://')) {
        let hostname = '';
        try {
          hostname = new URL(urlString).hostname;
        } catch {
          hostname = '';
        }
        const isLoopback =
          hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
        if (!isLoopback) {
          throw new Error(
            `WorkerPool: worker URL must use HTTPS (received: ${urlString}). ` +
              `Loading workers over HTTP exposes sensitive code to network interception.`,
          );
        }
      }

      if (options?.fallbackWorkerCode) {
        return fetch(urlString)
          .then((res) => {
            if (res.ok) {
              return new Worker(workerUrl, { type: 'module' });
            }
            throw new Error(`Failed to fetch worker: ${res.status}`);
          })
          .catch(() => {
            try {
              const blob = new Blob([options.fallbackWorkerCode!], {
                type: 'application/javascript',
              });
              const blobUrl = URL.createObjectURL(blob);
              const w = new Worker(blobUrl, { type: 'module' });
              queueMicrotask(() => URL.revokeObjectURL(blobUrl));
              return w;
            } catch (blobError: unknown) {
              const msg = blobError instanceof Error ? blobError.message : String(blobError);
              throw new Error(
                `Failed to create fallback Blob worker (possibly blocked by Content Security Policy). ` +
                  `Original error: ${msg}. ` +
                  `Configure a custom workerUrl or fallbackExecutor to bypass this policy.`,
              );
            }
          });
      }

      return new Worker(workerUrl, { type: 'module' });
    },
  });

  try {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      pool.terminate();
    });
  } catch {
    // Fail silently if not in an injection context (e.g. simple unit testing)
  }

  return pool;
}

export interface WorkerTaskConfig<T> {
  id: string;
  type: string;
  data: unknown;
  timeout?: number;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

export interface WorkerPoolOptions {
  /** Function that creates and returns a Web Worker instance */
  workerFactory: () => Worker | Promise<Worker>;
  /** Default timeout in milliseconds for tasks. Default: 5000 */
  defaultTimeout?: number;
  /** Callback when a worker crashes */
  onCrash?: (error: unknown) => void;
  /** Callback for a fallback execution if worker is not available (e.g. SSR) */
  fallbackExecutor?: (type: string, data: unknown) => Promise<unknown>;
}

/**
 * A generic reusable Web Worker runner for heavy off-main-thread computations.
 * Handles task queuing, timeouts, worker crashes, and SSR fallbacks.
 */
export class WorkerPool {
  private worker: Worker | null = null;
  private workerPromise: Promise<Worker | null> | null = null;
  private initError: unknown = null;
  private pendingTasks = new Map<string, WorkerTaskConfig<unknown>>();
  private activeTimeoutIds = new Map<string, ReturnType<typeof setTimeout>>();
  private consecutiveCrashes = 0;

  constructor(private options: WorkerPoolOptions) {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof Worker === 'undefined') {
      return;
    }

    try {
      const res = this.options.workerFactory();
      if (res instanceof Promise) {
        const capturedPromise = res
          .then((w) => {
            if (this.workerPromise === capturedPromise) {
              this.setupWorker(w);
            } else {
              w.terminate();
            }
            return w;
          })
          .catch((err) => {
            this.handleInitError(err);
            return null;
          });
        this.workerPromise = capturedPromise;
      } else {
        this.setupWorker(res);
        this.workerPromise = Promise.resolve(res);
      }
    } catch (err) {
      this.handleInitError(err);
      this.workerPromise = Promise.resolve(null);
    }
  }

  private setupWorker(worker: Worker): void {
    this.worker = worker;
    this.worker.onmessage = (event: MessageEvent) => {
      this.consecutiveCrashes = 0; // Reset crash counter on successful message
      const { id, data, error } = event.data;
      if (id && this.pendingTasks.has(id)) {
        if (error) {
          this.handleTaskError(id, error);
        } else {
          this.handleTaskSuccess(id, data);
        }
      }
    };

    this.worker.onerror = (error: ErrorEvent) => {
      this.options.onCrash?.(error);
      this.failAllTasks(`Worker crashed: ${error.message || 'Unknown error'}`);
      this.restartWorker();
    };
  }

  private handleInitError(err: unknown): void {
    this.worker = null;
    this.initError = err;
    const message = err instanceof Error ? err.message : String(err);
    this.failAllTasks(message);
  }

  private restartWorker(): void {
    this.terminate();
    if (this.consecutiveCrashes >= 3) {
      console.error(
        'WorkerPool: Web Worker crashed repeatedly. Halting restarts to prevent infinite loops.',
      );
      return;
    }
    this.consecutiveCrashes++;
    this.initWorker();
  }

  private handleTaskSuccess(taskId: string, result: unknown): void {
    const task = this.pendingTasks.get(taskId);
    if (task) {
      this.clearTaskTimeout(taskId);
      this.pendingTasks.delete(taskId);
      task.resolve(result);
    }
  }

  private handleTaskError(taskId: string, error: unknown): void {
    const task = this.pendingTasks.get(taskId);
    if (task) {
      this.clearTaskTimeout(taskId);
      this.pendingTasks.delete(taskId);
      task.reject(error);
    }
  }

  private clearTaskTimeout(taskId: string): void {
    const timeoutId = this.activeTimeoutIds.get(taskId);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this.activeTimeoutIds.delete(taskId);
    }
  }

  private failAllTasks(reason: string): void {
    for (const [taskId, task] of this.pendingTasks.entries()) {
      this.clearTaskTimeout(taskId);
      task.reject(new Error(reason));
    }
    this.pendingTasks.clear();
  }

  /**
   * Executes a task in the worker
   */
  async execute<T = unknown>(
    type: string,
    data: unknown,
    timeoutMsOrOptions?: number | { timeoutMs?: number; transfer?: Transferable[] },
  ): Promise<T> {
    if (this.workerPromise) {
      await this.workerPromise;
    }

    if (!this.worker) {
      // Prefer fallbackExecutor over throwing — allows graceful degradation (e.g. main-thread regex)
      // even when worker initialization failed (CSP block, SSR, network error).
      if (this.options.fallbackExecutor) {
        return this.options.fallbackExecutor(type, data) as Promise<T>;
      }
      if (this.initError) {
        throw this.initError;
      }
      throw new Error('Worker is not available and no fallback executor was provided.');
    }

    const options =
      typeof timeoutMsOrOptions === 'number'
        ? { timeoutMs: timeoutMsOrOptions }
        : timeoutMsOrOptions || {};

    const timeoutMs = options.timeoutMs;
    const explicitTransfer = options.transfer;

    return new Promise<T>((resolve, reject) => {
      const randomPart =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 9);
      const taskId = `${type}_${Date.now()}_${randomPart}`;
      const activeTimeout = timeoutMs ?? this.options.defaultTimeout ?? 5000;

      const task: WorkerTaskConfig<unknown> = {
        id: taskId,
        type,
        data,
        timeout: activeTimeout,
        resolve: resolve as (value: unknown) => void,
        reject,
      };

      this.pendingTasks.set(taskId, task);

      if (activeTimeout > 0) {
        const timeoutId = setTimeout(() => {
          this.clearTaskTimeout(taskId);
          this.pendingTasks.delete(taskId);

          reject(new Error('Execution timeout'));

          this.restartWorker();
        }, activeTimeout);

        this.activeTimeoutIds.set(taskId, timeoutId);
      }

      try {
        // Determine transferable objects to optimize IPC communication (zero-copy transfer)
        const transferList = explicitTransfer || detectTransferables(data);

        this.worker!.postMessage(
          {
            id: taskId,
            type,
            data,
          },
          transferList,
        );
      } catch (postError) {
        this.clearTaskTimeout(taskId);
        this.pendingTasks.delete(taskId);
        reject(postError);
      }
    });
  }

  terminate(): void {
    if (this.worker) {
      this.failAllTasks('Worker terminated manually');
      this.worker.terminate();
      this.worker = null;
    }
    this.workerPromise = null;
    this.initError = null;
  }
}
