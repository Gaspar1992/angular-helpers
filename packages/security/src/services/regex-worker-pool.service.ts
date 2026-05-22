import { Injectable, OnDestroy } from '@angular/core';
import type { RegexSecurityConfig, RegexTestResult } from './regex-types';

interface WorkerTask {
  id: string;
  pattern: string;
  text: string;
  timeout: number;
  resolve: (value: RegexTestResult) => void;
}

/**
 * Service responsible for managing Web Workers for safe regex execution.
 * Avoids creating a new worker for every single execution.
 */
@Injectable()
export class RegexWorkerPoolService implements OnDestroy {
  private worker: Worker | null = null;
  private pendingTasks = new Map<string, WorkerTask>();
  private activeTimeoutIds = new Map<string, any>();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof Worker === 'undefined') {
      // In SSR environments (Node.js), Web Workers are not available globally.
      return;
    }

    // In Angular, we can use the modern worker constructor with import.meta.url
    // Note: ensure your build system is configured to handle this (e.g., Vite/Webpack)
    this.worker = new Worker(new URL('../workers/regex.worker', import.meta.url), {
      type: 'module',
    });

    this.worker.onmessage = (event: MessageEvent) => {
      const result = event.data;
      if (result.type === 'regex-result') {
        this.handleTaskResult(result.id, result.data as RegexTestResult);
      }
    };

    this.worker.onerror = (error) => {
      // If the worker crashes completely, fail all pending tasks and restart
      this.failAllTasks(`Worker crashed: ${error.message || 'Unknown error'}`);
      this.restartWorker();
    };
  }

  private restartWorker() {
    if (this.worker) {
      this.worker.terminate();
    }
    this.initWorker();
  }

  private handleTaskResult(taskId: string, result: RegexTestResult) {
    const task = this.pendingTasks.get(taskId);
    if (task) {
      this.clearTaskTimeout(taskId);
      this.pendingTasks.delete(taskId);
      task.resolve(result);
    }
  }

  private clearTaskTimeout(taskId: string) {
    const timeoutId = this.activeTimeoutIds.get(taskId);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this.activeTimeoutIds.delete(taskId);
    }
  }

  private failAllTasks(reason: string) {
    for (const [taskId, task] of this.pendingTasks.entries()) {
      this.clearTaskTimeout(taskId);
      task.resolve({
        match: false,
        executionTime: 0,
        timeout: false,
        error: reason,
      });
    }
    this.pendingTasks.clear();
  }

  /**
   * Executes the regular expression in a Web Worker
   */
  async executeInWorker(
    pattern: string,
    text: string,
    config: RegexSecurityConfig,
  ): Promise<RegexTestResult> {
    return new Promise((resolve) => {
      if (!this.worker) {
        this.initWorker();
      }

      if (!this.worker) {
        // Fallback for SSR where Web Workers are not available.
        // We execute synchronously on the main thread since SSR shouldn't
        // be doing heavy regex processing anyway.
        try {
          const start = Date.now();
          const regex = new RegExp(pattern);
          const match = regex.test(text);
          resolve({
            match,
            executionTime: Date.now() - start,
            timeout: false,
          });
        } catch (e: any) {
          resolve({
            match: false,
            executionTime: 0,
            timeout: false,
            error: e.message,
          });
        }
        return;
      }

      const taskId = `regex_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const timeoutMs = config.timeout || 5000;

      const task: WorkerTask = {
        id: taskId,
        pattern,
        text,
        timeout: timeoutMs,
        resolve,
      };

      this.pendingTasks.set(taskId, task);

      const timeoutId = setTimeout(() => {
        // If a regex takes too long, it might be stuck in a catastrophic backtrack.
        // We MUST terminate the worker to stop the runaway thread.
        this.clearTaskTimeout(taskId);
        this.pendingTasks.delete(taskId);

        resolve({
          match: false,
          executionTime: 0,
          timeout: true,
          error: 'Execution timeout',
        });

        this.restartWorker();
      }, timeoutMs);

      this.activeTimeoutIds.set(taskId, timeoutId);

      this.worker!.postMessage({
        id: taskId,
        type: 'regex-test',
        data: {
          pattern,
          text,
          timeout: timeoutMs,
        },
      });
    });
  }

  ngOnDestroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.failAllTasks('Service destroyed');
  }
}
