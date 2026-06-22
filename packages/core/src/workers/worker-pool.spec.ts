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

  it('should fetch the workerUrl and use it if fetch is successful (ok: true)', async () => {
    const originalWorker = globalThis.Worker;
    const originalFetch = globalThis.fetch;
    const originalCreateObjectURL = URL.createObjectURL;

    const workerInstances: any[] = [];
    class MockWorker {
      constructor(
        public url: any,
        public options: any,
      ) {
        workerInstances.push(this);
      }
      terminate = vi.fn();
    }

    globalThis.Worker = MockWorker as any;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');

    try {
      injectWorkerPool('http://example.com/worker.js', {
        fallbackWorkerCode: 'console.log("fallback")',
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(fetchMock).toHaveBeenCalledWith('http://example.com/worker.js');
      expect(workerInstances.length).toBe(1);
      expect(workerInstances[0].url).toBe('http://example.com/worker.js');
      expect(workerInstances[0].options).toEqual({ type: 'module' });
    } finally {
      globalThis.Worker = originalWorker;
      globalThis.fetch = originalFetch;
      URL.createObjectURL = originalCreateObjectURL;
    }
  });

  it('should fallback to Blob URL if fetch fails (e.g. 404)', async () => {
    const originalWorker = globalThis.Worker;
    const originalFetch = globalThis.fetch;
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-fallback-url');
    const originalCreateObjectURL = URL.createObjectURL;

    const workerInstances: any[] = [];
    class MockWorker {
      constructor(
        public url: any,
        public options: any,
      ) {
        workerInstances.push(this);
      }
      terminate = vi.fn();
    }

    globalThis.Worker = MockWorker as any;
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    globalThis.fetch = fetchMock;
    URL.createObjectURL = createObjectURLMock;

    try {
      injectWorkerPool('http://example.com/worker.js', {
        fallbackWorkerCode: 'console.log("fallback")',
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(fetchMock).toHaveBeenCalledWith('http://example.com/worker.js');
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(workerInstances.length).toBe(1);
      expect(workerInstances[0].url).toBe('blob:mock-fallback-url');
    } finally {
      globalThis.Worker = originalWorker;
      globalThis.fetch = originalFetch;
      URL.createObjectURL = originalCreateObjectURL;
    }
  });

  it('should fallback to Blob URL if fetch throws error', async () => {
    const originalWorker = globalThis.Worker;
    const originalFetch = globalThis.fetch;
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-fallback-url-2');
    const originalCreateObjectURL = URL.createObjectURL;

    const workerInstances: any[] = [];
    class MockWorker {
      constructor(
        public url: any,
        public options: any,
      ) {
        workerInstances.push(this);
      }
      terminate = vi.fn();
    }

    globalThis.Worker = MockWorker as any;
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network Error'));
    globalThis.fetch = fetchMock;
    URL.createObjectURL = createObjectURLMock;

    try {
      injectWorkerPool('http://example.com/worker.js', {
        fallbackWorkerCode: 'console.log("fallback")',
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(fetchMock).toHaveBeenCalled();
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(workerInstances[0].url).toBe('blob:mock-fallback-url-2');
    } finally {
      globalThis.Worker = originalWorker;
      globalThis.fetch = originalFetch;
      URL.createObjectURL = originalCreateObjectURL;
    }
  });

  it('should throw descriptive error if fallback fails due to CSP blocking blob:', async () => {
    const originalWorker = globalThis.Worker;
    const originalFetch = globalThis.fetch;
    const originalCreateObjectURL = URL.createObjectURL;

    globalThis.Worker = class {
      constructor() {
        throw new Error(
          "Refused to create a worker from 'blob:...' because it violates the Content Security Policy directive",
        );
      }
    } as any;
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    URL.createObjectURL = vi.fn().mockReturnValue('blob:csp-blocked-url');

    try {
      const pool = injectWorkerPool('http://example.com/worker.js', {
        fallbackWorkerCode: 'console.log("fallback")',
      });

      await expect(pool.execute('test-task', {})).rejects.toThrow(/Content Security Policy/);
    } finally {
      globalThis.Worker = originalWorker;
      globalThis.fetch = originalFetch;
      URL.createObjectURL = originalCreateObjectURL;
    }
  });
});
