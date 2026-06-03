/* eslint-disable no-restricted-imports */
import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  runInInjectionContext,
  createEnvironmentInjector,
  EnvironmentInjector,
} from '@angular/core';
import { injectWorkerPool } from './worker-pool';

describe('injectWorkerPool', () => {
  it('should create a worker pool and register auto-termination on DestroyRef', () => {
    // Mock global Worker class to avoid actual thread creation
    const originalWorker = globalThis.Worker;
    const terminateSpy = vi.fn();
    const postMessageSpy = vi.fn();

    class MockWorker {
      postMessage = postMessageSpy;
      terminate = terminateSpy;
      onmessage = null;
      onerror = null;
    }

    globalThis.Worker = MockWorker as any;

    try {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });

      const parentInjector = TestBed.inject(EnvironmentInjector);
      const envInjector = createEnvironmentInjector([], parentInjector);

      let poolInstance: any;
      runInInjectionContext(envInjector, () => {
        poolInstance = injectWorkerPool(new URL('http://mock-worker.js'));
      });

      expect(poolInstance).toBeDefined();
      expect(terminateSpy).not.toHaveBeenCalled();

      // Destroy the environment injector to trigger DestroyRef callbacks
      envInjector.destroy();

      expect(terminateSpy).toHaveBeenCalled();
    } finally {
      globalThis.Worker = originalWorker;
    }
  });

  it('should create a worker pool even outside of an injection context without crashing', () => {
    const originalWorker = globalThis.Worker;
    class MockWorker {
      terminate = vi.fn();
    }
    globalThis.Worker = MockWorker as any;

    try {
      const pool = injectWorkerPool(new URL('http://mock-worker.js'));
      expect(pool).toBeDefined();
    } finally {
      globalThis.Worker = originalWorker;
    }
  });
});
