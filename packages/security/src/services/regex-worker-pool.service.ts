import { Injectable, InjectionToken, type OnDestroy, inject } from '@angular/core';
import { WorkerPool, injectPlatform, injectWorkerPool } from '@angular-helpers/core';
import type { RegexSecurityConfig, RegexTestResult } from './regex-types';
import { REGEX_WORKER_INLINE } from '../workers/regex.worker.inline';

export interface RegexWorkerConfig {
  workerUrl?: string | URL;
}

export const REGEX_WORKER_CONFIG = new InjectionToken<RegexWorkerConfig>('REGEX_WORKER_CONFIG');

/**
 * Service responsible for managing Web Workers for safe regex execution.
 * Avoids creating a new worker for every single execution.
 */
@Injectable()
export class RegexWorkerPoolService implements OnDestroy {
  private config = inject(REGEX_WORKER_CONFIG, { optional: true });
  private pool: WorkerPool;

  constructor() {
    const { document } = injectPlatform();
    let workerUrl: URL | string;

    if (this.config?.workerUrl) {
      workerUrl = this.config.workerUrl;
    } else {
      workerUrl = document
        ? new URL('assets/workers/regex.worker.js', document.baseURI)
        : new URL('assets/workers/regex.worker.js', 'https://example.com'); // SSR: never instantiated
    }

    this.pool = injectWorkerPool(workerUrl, {
      defaultTimeout: 5000,
      fallbackWorkerCode: REGEX_WORKER_INLINE,
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
