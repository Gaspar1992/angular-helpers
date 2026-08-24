/* eslint-disable no-restricted-imports */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  runInInjectionContext,
  createEnvironmentInjector,
  EnvironmentInjector,
} from '@angular/core';
import { injectWorkerPool, WorkerPool } from './worker-pool';

const REAL_WORKER = globalThis.Worker;

class MockWorker {
  onmessage: ((event: any) => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  postMessage = vi.fn((message: any, transfer?: Transferable[]) => {
    this.lastPostedMessage = message;
    this.lastTransfer = transfer;
  });
  terminate = vi.fn();
  lastPostedMessage: any;
  lastTransfer?: Transferable[];

  constructor(
    public url?: any,
    public options?: any,
  ) {}

  emitMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
  }

  emitError(error: any) {
    if (this.onerror) {
      this.onerror(error as ErrorEvent);
    }
  }
}

describe('injectWorkerPool', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    globalThis.Worker = REAL_WORKER;
    vi.restoreAllMocks();
  });

  it('should create a worker pool and register auto-termination on DestroyRef', () => {
    const terminateSpy = vi.fn();
    const postMessageSpy = vi.fn();

    class CustomMockWorker {
      postMessage = postMessageSpy;
      terminate = terminateSpy;
      onmessage = null;
      onerror = null;
    }

    globalThis.Worker = CustomMockWorker as any;

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const envInjector = createEnvironmentInjector([], parentInjector);

    let poolInstance: any;
    runInInjectionContext(envInjector, () => {
      poolInstance = injectWorkerPool(new URL('http://localhost/mock-worker.js'));
    });

    expect(poolInstance).toBeDefined();
    expect(terminateSpy).not.toHaveBeenCalled();

    envInjector.destroy();
    expect(terminateSpy).toHaveBeenCalled();
  });

  it('should create a worker pool even outside of an injection context without crashing', () => {
    class SimpleMockWorker {
      terminate = vi.fn();
    }
    globalThis.Worker = SimpleMockWorker as any;

    const pool = injectWorkerPool(new URL('http://localhost/mock-worker.js'));
    expect(pool).toBeDefined();
  });

  it('should throw when Web Workers are unavailable in SSR environment', async () => {
    class SimpleMockWorker {
      terminate = vi.fn();
    }
    globalThis.Worker = SimpleMockWorker as any;

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const envInjector = createEnvironmentInjector(
      [{ provide: PLATFORM_ID, useValue: 'server' }],
      parentInjector,
    );

    let poolInstance: any;
    runInInjectionContext(envInjector, () => {
      poolInstance = injectWorkerPool('https://example.com/worker.js');
    });

    await expect(poolInstance.execute('task', {})).rejects.toThrow(
      /Web Workers are not available in this environment/,
    );
  });

  it('should reject insecure HTTP URLs (non-localhost)', async () => {
    class SimpleMockWorker {
      terminate = vi.fn();
    }
    globalThis.Worker = SimpleMockWorker as any;

    const pool = injectWorkerPool('http://example.com/worker.js', {
      fallbackWorkerCode: 'console.log("fallback")',
    });

    await expect(pool.execute('test-task', {})).rejects.toThrow(/HTTPS/);
  });

  it('should allow localhost HTTP string URLs without throwing', () => {
    class SimpleMockWorker {
      terminate = vi.fn();
    }
    globalThis.Worker = SimpleMockWorker as any;

    const pool = injectWorkerPool('http://localhost:3000/worker.js');
    expect(pool).toBeDefined();
  });

  it('should fetch the workerUrl and use it if fetch is successful (ok: true)', async () => {
    const originalFetch = globalThis.fetch;
    const originalCreateObjectURL = URL.createObjectURL;

    const workerInstances: any[] = [];
    class TrackingMockWorker {
      constructor(
        public url: any,
        public options: any,
      ) {
        workerInstances.push(this);
      }
      terminate = vi.fn();
    }

    globalThis.Worker = TrackingMockWorker as any;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');

    try {
      injectWorkerPool('https://example.com/worker.js', {
        fallbackWorkerCode: 'console.log("fallback")',
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(fetchMock).toHaveBeenCalledWith('https://example.com/worker.js');
      expect(workerInstances.length).toBe(1);
      expect(workerInstances[0].url).toBe('https://example.com/worker.js');
      expect(workerInstances[0].options).toEqual({ type: 'module' });
    } finally {
      globalThis.fetch = originalFetch;
      URL.createObjectURL = originalCreateObjectURL;
    }
  });

  it('should fallback to Blob URL if fetch fails (e.g. 404)', async () => {
    const originalFetch = globalThis.fetch;
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-fallback-url');

    const workerInstances: any[] = [];
    class TrackingMockWorker {
      constructor(
        public url: any,
        public options: any,
      ) {
        workerInstances.push(this);
      }
      terminate = vi.fn();
    }

    globalThis.Worker = TrackingMockWorker as any;
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    globalThis.fetch = fetchMock;
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = vi.fn();

    try {
      injectWorkerPool('https://example.com/worker.js', {
        fallbackWorkerCode: 'console.log("fallback")',
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(fetchMock).toHaveBeenCalledWith('https://example.com/worker.js');
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-fallback-url');
      expect(workerInstances.length).toBe(1);
      expect(workerInstances[0].url).toBe('blob:mock-fallback-url');
    } finally {
      globalThis.fetch = originalFetch;
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });

  it('should fallback to Blob URL if fetch throws error', async () => {
    const originalFetch = globalThis.fetch;
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-fallback-url-2');

    const workerInstances: any[] = [];
    class TrackingMockWorker {
      constructor(
        public url: any,
        public options: any,
      ) {
        workerInstances.push(this);
      }
      terminate = vi.fn();
    }

    globalThis.Worker = TrackingMockWorker as any;
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network Error'));
    globalThis.fetch = fetchMock;
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = vi.fn();

    try {
      injectWorkerPool('https://example.com/worker.js', {
        fallbackWorkerCode: 'console.log("fallback")',
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(fetchMock).toHaveBeenCalled();
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-fallback-url-2');
      expect(workerInstances[0].url).toBe('blob:mock-fallback-url-2');
    } finally {
      globalThis.fetch = originalFetch;
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });

  it('should throw descriptive error if fallback fails due to CSP blocking blob:', async () => {
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
      const pool = injectWorkerPool('https://example.com/worker.js', {
        fallbackWorkerCode: 'console.log("fallback")',
      });

      await expect(pool.execute('test-task', {})).rejects.toThrow(/Content Security Policy/);
    } finally {
      globalThis.fetch = originalFetch;
      URL.createObjectURL = originalCreateObjectURL;
    }
  });
});

describe('WorkerPool class', () => {
  let createdWorkers: MockWorker[] = [];
  let poolsToCleanup: WorkerPool[] = [];

  beforeEach(() => {
    createdWorkers = [];
    poolsToCleanup = [];
    globalThis.Worker = MockWorker as any;
  });

  afterEach(() => {
    poolsToCleanup.forEach((p) => {
      try {
        p.terminate();
      } catch {
        // ignore
      }
    });
    globalThis.Worker = REAL_WORKER;
    vi.restoreAllMocks();
  });

  function createMockWorker(): MockWorker {
    const worker = new MockWorker();
    createdWorkers.push(worker);
    return worker;
  }

  function registerPool(pool: WorkerPool): WorkerPool {
    poolsToCleanup.push(pool);
    return pool;
  }

  describe('Task Execution & Lifecycle', () => {
    it('should successfully execute a task and resolve on worker onmessage success', async () => {
      let workerInstance!: MockWorker;
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            workerInstance = createMockWorker();
            return workerInstance as any;
          },
        }),
      );

      const execPromise = pool.execute('process-image', { width: 100, height: 100 });
      await Promise.resolve();

      expect(workerInstance.postMessage).toHaveBeenCalledTimes(1);
      const postArgs = workerInstance.postMessage.mock.calls[0];
      const message = postArgs[0];

      expect(message.type).toBe('process-image');
      expect(message.data).toEqual({ width: 100, height: 100 });
      expect(message.id).toBeDefined();

      workerInstance.emitMessage({
        id: message.id,
        data: { success: true, pixels: 10000 },
      });

      const result = await execPromise;
      expect(result).toEqual({ success: true, pixels: 10000 });
    });

    it('should reject a task when worker onmessage receives an error', async () => {
      let workerInstance!: MockWorker;
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            workerInstance = createMockWorker();
            return workerInstance as any;
          },
        }),
      );

      const execPromise = pool.execute('fail-task', { data: 123 });
      await Promise.resolve();

      const taskId = workerInstance.postMessage.mock.calls[0][0].id;

      workerInstance.emitMessage({
        id: taskId,
        error: new Error('Worker computation error'),
      });

      await expect(execPromise).rejects.toThrow('Worker computation error');
    });

    it('should ignore worker messages with unknown taskId or missing id', async () => {
      let workerInstance!: MockWorker;
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            workerInstance = createMockWorker();
            return workerInstance as any;
          },
        }),
      );

      const execPromise = pool.execute('real-task', { x: 1 });
      await Promise.resolve();

      const taskId = workerInstance.postMessage.mock.calls[0][0].id;

      workerInstance.emitMessage({ id: 'unknown_id', data: 'ignored' });
      workerInstance.emitMessage({ data: 'missing_id' });
      workerInstance.emitMessage({ id: taskId, data: 'done' });

      const result = await execPromise;
      expect(result).toBe('done');
    });
  });

  describe('Timeouts & Restarts', () => {
    it('should reject task on timeout and restart the worker (number timeout)', async () => {
      vi.useFakeTimers();
      try {
        let factoryCount = 0;
        const pool = registerPool(
          new WorkerPool({
            workerFactory: () => {
              factoryCount++;
              return createMockWorker() as any;
            },
          }),
        );

        expect(factoryCount).toBe(1);
        const worker1 = createdWorkers[0];

        const execPromise = pool.execute('long-task', {}, 50);
        await Promise.resolve();

        vi.advanceTimersByTime(60);

        await expect(execPromise).rejects.toThrow('Execution timeout');
        expect(worker1.terminate).toHaveBeenCalled();
        expect(factoryCount).toBe(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should reject task on timeout and restart the worker (options timeoutMs)', async () => {
      vi.useFakeTimers();
      try {
        let factoryCount = 0;
        const pool = registerPool(
          new WorkerPool({
            workerFactory: () => {
              factoryCount++;
              return createMockWorker() as any;
            },
            defaultTimeout: 10000,
          }),
        );

        const worker1 = createdWorkers[0];
        const execPromise = pool.execute('custom-timeout-task', {}, { timeoutMs: 200 });
        await Promise.resolve();

        vi.advanceTimersByTime(250);

        await expect(execPromise).rejects.toThrow('Execution timeout');
        expect(worker1.terminate).toHaveBeenCalled();
        expect(factoryCount).toBe(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should not schedule timeout timer when activeTimeout is 0', async () => {
      vi.useFakeTimers();
      try {
        let workerInstance!: MockWorker;
        const pool = registerPool(
          new WorkerPool({
            workerFactory: () => {
              workerInstance = createMockWorker();
              return workerInstance as any;
            },
            defaultTimeout: 0,
          }),
        );

        const execPromise = pool.execute('no-timeout-task', {}, { timeoutMs: 0 });
        await Promise.resolve();

        expect(vi.getTimerCount()).toBe(0);

        const taskId = workerInstance.postMessage.mock.calls[0][0].id;
        workerInstance.emitMessage({ id: taskId, data: 'success-without-timeout' });

        await expect(execPromise).resolves.toBe('success-without-timeout');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Worker Crashes & Consecutive Crashes Limit', () => {
    it('should call onCrash, fail all pending tasks, and restart worker on onerror', async () => {
      const onCrashSpy = vi.fn();
      let factoryCount = 0;

      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            factoryCount++;
            return createMockWorker() as any;
          },
          onCrash: onCrashSpy,
        }),
      );

      const worker1 = createdWorkers[0];

      const p1 = pool.execute('task1', {});
      const p2 = pool.execute('task2', {});
      await Promise.resolve();

      const crashError = { message: 'Out of memory' };
      worker1.emitError(crashError);

      expect(onCrashSpy).toHaveBeenCalledWith(crashError);
      await expect(p1).rejects.toThrow('Worker crashed: Out of memory');
      await expect(p2).rejects.toThrow('Worker crashed: Out of memory');
      expect(worker1.terminate).toHaveBeenCalled();
      expect(factoryCount).toBe(2);
    });

    it('should fallback to Unknown error when onerror has no message', async () => {
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => createMockWorker() as any,
        }),
      );

      const worker1 = createdWorkers[0];
      const p1 = pool.execute('task1', {});
      await Promise.resolve();

      worker1.emitError({});
      await expect(p1).rejects.toThrow('Worker crashed: Unknown error');
    });

    it('should halt restarts after 3 consecutive crashes', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let factoryCount = 0;

      registerPool(
        new WorkerPool({
          workerFactory: () => {
            factoryCount++;
            return createMockWorker() as any;
          },
        }),
      );

      expect(factoryCount).toBe(1);

      // Crash 1 -> restarts
      createdWorkers[0].emitError({ message: 'crash 1' });
      expect(factoryCount).toBe(2);

      // Crash 2 -> restarts
      createdWorkers[1].emitError({ message: 'crash 2' });
      expect(factoryCount).toBe(3);

      // Crash 3 -> restarts
      createdWorkers[2].emitError({ message: 'crash 3' });
      expect(factoryCount).toBe(4);

      // Crash 4 (consecutive crashes reaches limit 3) -> halts restarts
      createdWorkers[3].emitError({ message: 'crash 4' });
      expect(factoryCount).toBe(4);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Halting restarts to prevent infinite loops'),
      );
    });

    it('should reset consecutive crashes counter upon receiving a successful message', async () => {
      let factoryCount = 0;
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            factoryCount++;
            return createMockWorker() as any;
          },
        }),
      );

      // Crash 1 & 2
      createdWorkers[0].emitError({ message: 'crash 1' });
      createdWorkers[1].emitError({ message: 'crash 2' });
      expect(factoryCount).toBe(3);

      // Worker 3 succeeds with a task
      const execPromise = pool.execute('recover', {});
      await Promise.resolve();

      const taskId = createdWorkers[2].postMessage.mock.calls[0][0].id;
      createdWorkers[2].emitMessage({ id: taskId, data: 'recovered' });
      await execPromise;

      // Crash counter is reset
      createdWorkers[2].emitError({ message: 'crash 3' });
      expect(factoryCount).toBe(4);
    });
  });

  describe('Fallback Executor & SSR / Unavailable Worker', () => {
    it('should use fallbackExecutor when workerFactory throws during initialization', async () => {
      const fallbackSpy = vi.fn().mockResolvedValue('fallback-result');

      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            throw new Error('Worker initialization failure');
          },
          fallbackExecutor: fallbackSpy,
        }),
      );

      const result = await pool.execute('heavy-computation', { input: 42 });
      expect(result).toBe('fallback-result');
      expect(fallbackSpy).toHaveBeenCalledWith('heavy-computation', { input: 42 });
    });

    it('should throw initError when workerFactory throws and no fallbackExecutor is provided', async () => {
      const initErr = new Error('Factory crashed');
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            throw initErr;
          },
        }),
      );

      await expect(pool.execute('task', {})).rejects.toThrow('Factory crashed');
    });

    it('should throw initError when workerFactory throws a primitive string', async () => {
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            throw 'Primitive string error';
          },
        }),
      );

      await expect(pool.execute('task', {})).rejects.toBe('Primitive string error');
    });

    it('should handle SSR environment where Worker global is undefined', async () => {
      delete (globalThis as any).Worker;
      const fallbackSpy = vi.fn().mockResolvedValue('ssr-fallback');

      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            throw new Error('Should not be called');
          },
          fallbackExecutor: fallbackSpy,
        }),
      );

      const result = await pool.execute('ssr-task', { data: 'test' });
      expect(result).toBe('ssr-fallback');
      expect(fallbackSpy).toHaveBeenCalledWith('ssr-task', { data: 'test' });
    });

    it('should throw generic error when Worker is undefined and no fallbackExecutor is provided', async () => {
      delete (globalThis as any).Worker;

      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            throw new Error('Not called');
          },
        }),
      );

      await expect(pool.execute('task', {})).rejects.toThrow(
        'Worker is not available and no fallback executor was provided.',
      );
    });
  });

  describe('terminate()', () => {
    it('should terminate the active worker and reject all pending tasks', async () => {
      let workerInstance!: MockWorker;
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            workerInstance = createMockWorker();
            return workerInstance as any;
          },
        }),
      );

      const p1 = pool.execute('task1', {});
      const p2 = pool.execute('task2', {});
      await Promise.resolve();

      pool.terminate();

      expect(workerInstance.terminate).toHaveBeenCalled();
      await expect(p1).rejects.toThrow('Worker terminated manually');
      await expect(p2).rejects.toThrow('Worker terminated manually');
    });

    it('should do nothing gracefully if terminate is called when no worker is active', () => {
      delete (globalThis as any).Worker;
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => null as any,
        }),
      );

      expect(() => pool.terminate()).not.toThrow();
    });
  });

  describe('Transferable Detection (findTransferables & explicit transfer)', () => {
    it('should use explicit transfer parameter if provided in execute options', async () => {
      let workerInstance!: MockWorker;
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            workerInstance = createMockWorker();
            return workerInstance as any;
          },
        }),
      );

      const explicitBuf = new ArrayBuffer(64);
      const promise = pool.execute(
        'task-with-explicit-transfer',
        { data: 'something' },
        {
          transfer: [explicitBuf],
        },
      );
      await Promise.resolve();

      expect(workerInstance.postMessage).toHaveBeenCalledTimes(1);
      const transferList = workerInstance.postMessage.mock.calls[0][1];
      expect(transferList).toEqual([explicitBuf]);

      workerInstance.emitMessage({
        id: workerInstance.postMessage.mock.calls[0][0].id,
        data: 'ok',
      });
      await promise;
    });

    it('should automatically detect ArrayBuffer instances in data', async () => {
      let workerInstance!: MockWorker;
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            workerInstance = createMockWorker();
            return workerInstance as any;
          },
        }),
      );

      const buf1 = new ArrayBuffer(16);
      const buf2 = new ArrayBuffer(32);
      const promise = pool.execute('task-auto-transfer', {
        bufferA: buf1,
        nested: { bufferB: buf2 },
      });
      await Promise.resolve();

      const transferList = workerInstance.postMessage.mock.calls[0][1];
      expect(transferList).toContain(buf1);
      expect(transferList).toContain(buf2);
      expect(transferList?.length).toBe(2);

      workerInstance.emitMessage({
        id: workerInstance.postMessage.mock.calls[0][0].id,
        data: 'ok',
      });
      await promise;
    });

    it('should automatically detect and extract .buffer from TypedArrays', async () => {
      let workerInstance!: MockWorker;
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            workerInstance = createMockWorker();
            return workerInstance as any;
          },
        }),
      );

      const uint8 = new Uint8Array(8);
      const float32 = new Float32Array(4);
      const promise = pool.execute('task-typed-arrays', {
        array1: uint8,
        array2: float32,
      });
      await Promise.resolve();

      const transferList = workerInstance.postMessage.mock.calls[0][1];
      expect(transferList).toContain(uint8.buffer);
      expect(transferList).toContain(float32.buffer);
      expect(transferList?.length).toBe(2);

      workerInstance.emitMessage({
        id: workerInstance.postMessage.mock.calls[0][0].id,
        data: 'ok',
      });
      await promise;
    });

    it('should handle complex nested arrays and objects', async () => {
      let workerInstance!: MockWorker;
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            workerInstance = createMockWorker();
            return workerInstance as any;
          },
        }),
      );

      const buf = new ArrayBuffer(8);
      const arr = [1, 'str', [new Uint16Array(4), { deeply: { nested: buf } }]];
      const promise = pool.execute('complex-task', arr);
      await Promise.resolve();

      const transferList = workerInstance.postMessage.mock.calls[0][1];
      expect(transferList).toContain(buf);

      workerInstance.emitMessage({
        id: workerInstance.postMessage.mock.calls[0][0].id,
        data: 'ok',
      });
      await promise;
    });

    it('should safely handle circular references without infinite looping', async () => {
      let workerInstance!: MockWorker;
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            workerInstance = createMockWorker();
            return workerInstance as any;
          },
        }),
      );

      const buf = new ArrayBuffer(12);
      const circularObj: any = { name: 'circular', buf };
      circularObj.self = circularObj;
      circularObj.inner = { parent: circularObj };

      const promise = pool.execute('circular-task', circularObj);
      await Promise.resolve();

      const transferList = workerInstance.postMessage.mock.calls[0][1];
      expect(transferList).toContain(buf);
      expect(transferList?.length).toBe(1);

      workerInstance.emitMessage({
        id: workerInstance.postMessage.mock.calls[0][0].id,
        data: 'ok',
      });
      await promise;
    });

    it('should safely handle property getters that throw errors', async () => {
      let workerInstance!: MockWorker;
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            workerInstance = createMockWorker();
            return workerInstance as any;
          },
        }),
      );

      const buf = new ArrayBuffer(8);
      const trickyObj = {
        get faultyGetter() {
          throw new Error('Getter boom');
        },
        validBuf: buf,
      };

      const promise = pool.execute('getter-task', trickyObj);
      await Promise.resolve();

      const transferList = workerInstance.postMessage.mock.calls[0][1];
      expect(transferList).toContain(buf);

      workerInstance.emitMessage({
        id: workerInstance.postMessage.mock.calls[0][0].id,
        data: 'ok',
      });
      await promise;
    });

    it('should return empty transfer list for primitives and null/undefined', async () => {
      let workerInstance!: MockWorker;
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => {
            workerInstance = createMockWorker();
            return workerInstance as any;
          },
        }),
      );

      const p1 = pool.execute('primitive-null', null);
      const p2 = pool.execute('primitive-number', 123);
      const p3 = pool.execute('primitive-string', 'hello');
      await Promise.resolve();

      expect(workerInstance.postMessage.mock.calls[0][1]).toEqual([]);
      expect(workerInstance.postMessage.mock.calls[1][1]).toEqual([]);
      expect(workerInstance.postMessage.mock.calls[2][1]).toEqual([]);

      workerInstance.emitMessage({ id: workerInstance.postMessage.mock.calls[0][0].id, data: 1 });
      workerInstance.emitMessage({ id: workerInstance.postMessage.mock.calls[1][0].id, data: 2 });
      workerInstance.emitMessage({ id: workerInstance.postMessage.mock.calls[2][0].id, data: 3 });

      await Promise.all([p1, p2, p3]);
    });
  });

  describe('Promise-based workerFactory', () => {
    it('should wait for Promise workerFactory to resolve and execute tasks', async () => {
      const mockWorker = createMockWorker();
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => Promise.resolve(mockWorker as any),
        }),
      );

      const execPromise = pool.execute('async-init-task', { test: true });

      // Yield microtasks until worker is ready and execute posts message
      for (let i = 0; i < 5; i++) {
        await Promise.resolve();
      }

      expect(mockWorker.postMessage).toHaveBeenCalled();
      const taskId = mockWorker.postMessage.mock.calls[0][0].id;
      mockWorker.emitMessage({ id: taskId, data: 'async-init-success' });

      const result = await execPromise;
      expect(result).toBe('async-init-success');
    });

    it('should reject tasks when Promise workerFactory rejects', async () => {
      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => Promise.reject(new Error('Async worker construction failed')),
        }),
      );

      await expect(pool.execute('task', {})).rejects.toThrow('Async worker construction failed');
    });

    it('should terminate superseded worker if workerPromise changes before resolution', async () => {
      let resolveFirstWorker!: (w: any) => void;
      const firstWorkerPromise = new Promise((resolve) => {
        resolveFirstWorker = resolve;
      });

      const lateWorker = createMockWorker();

      const pool = registerPool(
        new WorkerPool({
          workerFactory: () => firstWorkerPromise as any,
        }),
      );

      // Terminating or restarting resets this.workerPromise
      pool.terminate();

      // Now resolve the obsolete worker
      resolveFirstWorker(lateWorker);
      for (let i = 0; i < 5; i++) {
        await Promise.resolve();
      }

      expect(lateWorker.terminate).toHaveBeenCalled();
    });
  });
});
