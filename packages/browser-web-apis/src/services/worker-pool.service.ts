import { Injectable, OnDestroy } from '@angular/core';

/**
 * Task to be executed in a worker pool
 */
export interface WorkerPoolTask<TPayload = unknown, _TResult = unknown> {
  id: string;
  type: string;
  payload: TPayload;
}

/**
 * Result from a worker task
 */
export interface WorkerPoolTaskResult<TResult = unknown> {
  taskId: string;
  result: TResult;
  error?: {
    message: string;
    name: string;
    stack?: string;
  };
}

/**
 * Configuration for a worker pool
 */
export interface WorkerPoolConfig {
  /** Maximum number of workers in the pool (default: 1) */
  maxWorkers?: number;
  /** Timeout for task execution in ms (default: 5000) */
  taskTimeout?: number;
  /** Whether to lazy-initialize workers (default: true) */
  lazy?: boolean;
}

/**
 * Worker pool for managing multiple worker instances
 * Used by RegexSecurityService and other worker-dependent services
 */
@Injectable({ providedIn: 'root' })
export class WorkerPoolService implements OnDestroy {
  private pools = new Map<string, WorkerPool>();

  /**
   * Get or create a worker pool
   */
  getPool(name: string, workerFactory: () => Worker, config?: WorkerPoolConfig): WorkerPool {
    if (!this.pools.has(name)) {
      this.pools.set(name, new WorkerPool(workerFactory, config));
    }
    return this.pools.get(name)!;
  }

  /**
   * Execute a task in a pooled worker
   */
  execute<TPayload, TResult>(
    poolName: string,
    workerFactory: () => Worker,
    task: Omit<WorkerPoolTask<TPayload, TResult>, 'id'>,
    config?: WorkerPoolConfig,
  ): Promise<TResult> {
    const pool = this.getPool(poolName, workerFactory, config);
    return pool.execute(task);
  }

  /**
   * Terminate all worker pools
   */
  terminateAll(): void {
    for (const pool of this.pools.values()) {
      pool.terminate();
    }
    this.pools.clear();
  }

  ngOnDestroy(): void {
    this.terminateAll();
  }
}

/**
 * Individual worker pool implementation
 */
class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: Array<{
    task: WorkerPoolTask;
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  }> = [];
  private busyWorkers = new Set<Worker>();
  private roundRobinIndex = 0;
  private terminated = false;

  constructor(
    private workerFactory: () => Worker,
    private config: WorkerPoolConfig = {},
  ) {
    const { lazy = true } = this.config;
    if (!lazy) {
      this.ensureMinWorkers();
    }
  }

  /**
   * Execute a task in the pool
   */
  execute<TPayload, TResult>(
    task: Omit<WorkerPoolTask<TPayload, TResult>, 'id'>,
  ): Promise<TResult> {
    if (this.terminated) {
      return Promise.reject(new Error('Worker pool has been terminated'));
    }

    const taskId = crypto.randomUUID();
    const fullTask: WorkerPoolTask = { ...task, id: taskId } as WorkerPoolTask;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removeFromQueue(taskId);
        reject(new Error(`Task ${taskId} timed out after ${this.config.taskTimeout ?? 5000}ms`));
      }, this.config.taskTimeout ?? 5000);

      this.taskQueue.push({
        task: fullTask,
        resolve: resolve as (value: unknown) => void,
        reject,
        timeoutId,
      });

      this.processQueue();
    });
  }

  /**
   * Process the task queue
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.getAvailableWorker();
    if (!availableWorker) {
      // No workers available, will be processed when one becomes free
      return;
    }

    const queueItem = this.taskQueue.shift();
    if (!queueItem) return;

    const { task, resolve, reject, timeoutId } = queueItem;

    this.busyWorkers.add(availableWorker);

    const messageHandler = (event: MessageEvent<WorkerPoolTaskResult>) => {
      if (event.data.taskId !== task.id) return;

      clearTimeout(timeoutId);
      availableWorker.removeEventListener('message', messageHandler);
      availableWorker.removeEventListener('error', errorHandler);
      this.busyWorkers.delete(availableWorker);

      if (event.data.error) {
        const error = new Error(event.data.error.message);
        error.name = event.data.error.name;
        (error as Error & { stack?: string }).stack = event.data.error.stack;
        reject(error);
      } else {
        resolve(event.data.result);
      }

      // Process next task in queue
      this.processQueue();
    };

    const errorHandler = (event: ErrorEvent) => {
      clearTimeout(timeoutId);
      availableWorker.removeEventListener('message', messageHandler);
      availableWorker.removeEventListener('error', errorHandler);
      this.busyWorkers.delete(availableWorker);

      reject(new Error(event.message ?? 'Worker error'));

      // Replace the crashed worker
      const index = this.workers.indexOf(availableWorker);
      if (index > -1) {
        availableWorker.terminate();
        this.workers[index] = this.createWorker();
      }

      // Process next task
      this.processQueue();
    };

    availableWorker.addEventListener('message', messageHandler);
    availableWorker.addEventListener('error', errorHandler);
    availableWorker.postMessage(task);
  }

  /**
   * Get an available worker or create a new one if under limit
   */
  private getAvailableWorker(): Worker | undefined {
    // First, try to find a non-busy existing worker
    for (const worker of this.workers) {
      if (!this.busyWorkers.has(worker)) {
        return worker;
      }
    }

    // Create new worker if under max limit
    const maxWorkers = this.config.maxWorkers ?? 1;
    if (this.workers.length < maxWorkers) {
      const worker = this.createWorker();
      this.workers.push(worker);
      return worker;
    }

    return undefined;
  }

  /**
   * Create a new worker instance
   */
  private createWorker(): Worker {
    return this.workerFactory();
  }

  /**
   * Ensure minimum number of workers
   */
  private ensureMinWorkers(): void {
    const minWorkers = Math.min(this.config.maxWorkers ?? 1, 1);
    while (this.workers.length < minWorkers) {
      this.workers.push(this.createWorker());
    }
  }

  /**
   * Remove a task from the queue by ID
   */
  private removeFromQueue(taskId: string): void {
    const index = this.taskQueue.findIndex((item) => item.task.id === taskId);
    if (index > -1) {
      const item = this.taskQueue.splice(index, 1)[0];
      clearTimeout(item.timeoutId);
    }
  }

  /**
   * Terminate all workers in the pool
   */
  terminate(): void {
    this.terminated = true;

    // Reject all pending tasks
    for (const item of this.taskQueue) {
      clearTimeout(item.timeoutId);
      item.reject(new Error('Worker pool terminated'));
    }
    this.taskQueue = [];

    // Terminate all workers
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    this.busyWorkers.clear();
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalWorkers: number;
    busyWorkers: number;
    idleWorkers: number;
    queuedTasks: number;
  } {
    return {
      totalWorkers: this.workers.length,
      busyWorkers: this.busyWorkers.size,
      idleWorkers: this.workers.length - this.busyWorkers.size,
      queuedTasks: this.taskQueue.length,
    };
  }
}
