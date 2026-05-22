import { Injectable, OnDestroy } from '@angular/core';
import { WorkerPool, injectWorkerPool } from '@angular-helpers/core';
import type { RegexSecurityConfig, RegexTestResult } from './regex-types';

/**
 * Service responsible for managing Web Workers for safe regex execution.
 * Avoids creating a new worker for every single execution.
 */
@Injectable()
export class RegexWorkerPoolService implements OnDestroy {
  private pool: WorkerPool;

  constructor() {
    this.pool = new WorkerPool({
      workerFactory: () =>
        new Worker(new URL('../workers/regex.worker', import.meta.url), { type: 'module' }),
      defaultTimeout: 5000,
      fallbackExecutor: async (type, data) => {
        if (type !== 'regex-test') throw new Error(`Unknown task type: ${type}`);
        const { pattern, text } = data;
        try {
          const start = Date.now();
          const regex = new RegExp(pattern);
          const match = regex.test(text);
          return {
            match,
            executionTime: Date.now() - start,
            timeout: false,
          } as RegexTestResult;
        } catch (e: any) {
          return {
            match: false,
            executionTime: 0,
            timeout: false,
            error: e.message,
          } as RegexTestResult;
        }
      },
    });
  }

  /**
   * Executes the regular expression in a Web Worker
   */
  async executeInWorker(
    pattern: string,
    text: string,
    config: RegexSecurityConfig,
  ): Promise<RegexTestResult> {
    try {
      return await this.pool.execute<RegexTestResult>(
        'regex-test',
        {
          pattern,
          text,
          timeout: config.timeout || 5000,
        },
        config.timeout || 5000,
      );
    } catch (err: any) {
      return {
        match: false,
        executionTime: 0,
        timeout: err.message === 'Execution timeout',
        error: err.message,
      };
    }
  }

  ngOnDestroy(): void {
    this.pool.terminate();
  }
}
