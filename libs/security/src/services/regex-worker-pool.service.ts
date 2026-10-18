import { DestroyRef, Injectable, InjectionToken, type OnDestroy, inject } from '@angular/core';
import { WorkerPool, injectPlatform, injectWorkerPool } from '@angular-helpers/core';
import {
  REGEX_SECURITY_DEFAULTS,
  type RegexSecurityConfig,
  type RegexTestResult,
} from './regex-types';
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
  private readonly config = inject(REGEX_WORKER_CONFIG, { optional: true });
  private readonly defaults = inject(REGEX_SECURITY_DEFAULTS, { optional: true });
  private readonly destroyRef = inject(DestroyRef, { optional: true });
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
      defaultTimeout: this.defaults?.defaultTimeout || 5000,
      fallbackWorkerCode: REGEX_WORKER_INLINE,
      fallbackExecutor: async (type, data) => {
        if (type !== 'regex-test') throw new Error(`Unknown task type: ${type}`);
        const { pattern, text } = data as { pattern: string; text: string };
        try {
          const start = Date.now();
          const regex = new RegExp(pattern);
          const match = regex.test(text);
          return {
            match,
            executionTime: Date.now() - start,
            timeout: false,
          } as RegexTestResult;
        } catch (e: unknown) {
          return {
            match: false,
            executionTime: 0,
            timeout: false,
            error: e instanceof Error ? e.message : String(e),
          } as RegexTestResult;
        }
      },
    });

    this.destroyRef?.onDestroy(() => {
      this.pool.terminate();
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
    const timeout = config.timeout || this.defaults?.defaultTimeout || 5000;
    try {
      return await this.pool.execute<RegexTestResult>(
        'regex-test',
        {
          pattern,
          text,
          timeout,
        },
        timeout,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        match: false,
        executionTime: 0,
        timeout: message === 'Execution timeout',
        error: message,
      };
    }
  }

  ngOnDestroy(): void {
    this.pool.terminate();
  }
}
