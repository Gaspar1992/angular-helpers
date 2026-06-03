/* eslint-disable no-restricted-imports */
import { DestroyRef, inject } from '@angular/core';
import { injectPlatform } from '../utils/platform';
import { isTransferable } from '../utils/transferables';

export function injectWorkerPool(
  workerUrl: URL,
  options?: Omit<WorkerPoolOptions, 'workerFactory'>,
): WorkerPool {
  const { isBrowser } = injectPlatform();

  const pool = new WorkerPool({
    ...options,
    workerFactory: () => {
      if (!isBrowser || typeof Worker === 'undefined') {
        throw new Error('Web Workers are not available in this environment');
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
  data: any;
  timeout?: number;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

export interface WorkerPoolOptions {
  /** Function that creates and returns a Web Worker instance */
  workerFactory: () => Worker;
  /** Default timeout in milliseconds for tasks. Default: 5000 */
  defaultTimeout?: number;
  /** Callback when a worker crashes */
  onCrash?: (error: any) => void;
  /** Callback for a fallback execution if worker is not available (e.g. SSR) */
  fallbackExecutor?: (type: string, data: any) => Promise<any>;
}

/**
 * A generic reusable Web Worker Pool for heavy off-main-thread computations.
 * Handles task queuing, timeouts, worker crashes, and SSR fallbacks.
 */
export class WorkerPool {
  private worker: Worker | null = null;
  private pendingTasks = new Map<string, WorkerTaskConfig<any>>();
  private activeTimeoutIds = new Map<string, any>();

  constructor(private options: WorkerPoolOptions) {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof Worker === 'undefined') {
      return;
    }

    try {
      this.worker = this.options.workerFactory();

      this.worker.onmessage = (event: MessageEvent) => {
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
    } catch {
      this.worker = null;
    }
  }

  private restartWorker(): void {
    this.terminate();
    this.initWorker();
  }

  private handleTaskSuccess(taskId: string, result: any): void {
    const task = this.pendingTasks.get(taskId);
    if (task) {
      this.clearTaskTimeout(taskId);
      this.pendingTasks.delete(taskId);
      task.resolve(result);
    }
  }

  private handleTaskError(taskId: string, error: any): void {
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
  async execute<T = any>(
    type: string,
    data: any,
    timeoutMsOrOptions?: number | { timeoutMs?: number; transfer?: Transferable[] },
  ): Promise<T> {
    if (!this.worker) {
      if (this.options.fallbackExecutor) {
        return this.options.fallbackExecutor(type, data);
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
      const taskId = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const activeTimeout = timeoutMs ?? this.options.defaultTimeout ?? 5000;

      const task: WorkerTaskConfig<T> = {
        id: taskId,
        type,
        data,
        timeout: activeTimeout,
        resolve,
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

      // Determine transferable objects to optimize IPC communication (zero-copy transfer)
      const transferList = explicitTransfer || findTransferables(data);

      this.worker!.postMessage(
        {
          id: taskId,
          type,
          data,
        },
        transferList,
      );
    });
  }

  terminate(): void {
    if (this.worker) {
      this.failAllTasks('Worker terminated manually');
      this.worker.terminate();
      this.worker = null;
    }
  }
}

/**
 * Recursively scans a value/object structure to collect all Transferable objects (ArrayBuffer, MessagePort, etc.).
 * Guarantees no infinite loops via WeakSet checks and is environment-safe.
 */
function findTransferables(value: any): Transferable[] {
  const transfer = new Set<Transferable>();
  const visited = new WeakSet<any>();

  function scan(val: any): void {
    if (val === null || val === undefined || typeof val !== 'object') {
      return;
    }

    if (visited.has(val)) {
      return;
    }
    visited.add(val);

    if (isTransferable(val)) {
      transfer.add(val);
      return;
    }

    // Handle common typed arrays view buffer transfer
    if (ArrayBuffer.isView(val)) {
      if (val.buffer && isTransferable(val.buffer)) {
        transfer.add(val.buffer);
      }
      return;
    }

    // Handle standard Arrays
    if (Array.isArray(val)) {
      for (const item of val) {
        scan(item);
      }
    } else {
      // Handle plain objects
      for (const key of Object.keys(val)) {
        try {
          scan(val[key]);
        } catch {
          // Guard against any getter property crashes
        }
      }
    }
  }

  scan(value);
  return Array.from(transfer);
}
