import { describe, it, expect, vi } from 'vitest';
import { HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { createWorkerTransport } from '@angular-helpers/worker-http/transport';
import {
  provideWorkerHttpClient,
  withWorkerConfigs,
  withWorkerRoutes,
  withWorkerSerialization,
  withMinPayloadSizeForWorker,
  WorkerHttpBackend,
} from '@angular-helpers/worker-http/backend';
import { offlineSyncQueueInterceptor } from '@angular-helpers/worker-http/interceptors';

describe('worker-http hardening regressions', () => {
  it('clears batchBuffer and completes status$ when terminate() is called before microtask flush', async () => {
    const postMessage = vi.fn();
    const mockWorker = {
      postMessage,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      terminate: vi.fn(),
    } as unknown as Worker;

    const transport = createWorkerTransport({ workerFactory: () => mockWorker });
    let statusCompleted = false;
    transport.status$.subscribe({
      complete: () => {
        statusCompleted = true;
      },
    });

    const sub = transport.execute({ url: '/api/test' }).subscribe({ error: () => {} });
    transport.terminate();
    await Promise.resolve();

    expect(postMessage).not.toHaveBeenCalled();
    expect(statusCompleted).toBe(true);
    sub.unsubscribe();
  });

  it('serializes request body only once when minPayloadSizeForWorker is configured', () => {
    const serialize = vi.fn((val: unknown) => ({ data: JSON.stringify(val) }));
    const mockWorker = {
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      terminate: vi.fn(),
    } as unknown as Worker;

    const originalWorker = globalThis.Worker;
    globalThis.Worker = class {} as unknown as typeof Worker;

    try {
      TestBed.configureTestingModule({
        providers: [
          provideWorkerHttpClient(
            withWorkerConfigs([{ id: 'api', workerFactory: () => mockWorker }]),
            withWorkerRoutes([{ pattern: /\/api\//, worker: 'api' }]),
            withWorkerSerialization({
              name: 'mock',
              serialize,
              deserialize: (d: unknown) => JSON.parse(String(d)),
            }),
            withMinPayloadSizeForWorker(10),
          ),
        ],
      });

      const backend = TestBed.inject(WorkerHttpBackend);
      const req = new HttpRequest('POST', '/api/items', { largePayload: 'hello-world-123456' });
      const sub = backend.handle(req).subscribe({ error: () => {} });

      expect(serialize).toHaveBeenCalledTimes(1);
      sub.unsubscribe();
    } finally {
      globalThis.Worker = originalWorker;
    }
  });

  it('locks drainQueue so concurrent requests do not replay queued mutations twice', async () => {
    const queuedItems = [
      { id: 'q1', timestamp: 1, request: { url: '/m1', method: 'POST', headers: {} } },
    ];
    const mockStore = {
      getAll: vi.fn(() => {
        const req: any = { result: [...queuedItems], onsuccess: null, onerror: null };
        queueMicrotask(() => req.onsuccess?.());
        return req;
      }),
      delete: vi.fn((id: string) => {
        const idx = queuedItems.findIndex((q) => q.id === id);
        if (idx !== -1) queuedItems.splice(idx, 1);
        const req: any = { onsuccess: null, onerror: null };
        queueMicrotask(() => req.onsuccess?.());
        return req;
      }),
    };
    const mockDb = {
      transaction: vi.fn(() => ({ objectStore: () => mockStore })),
    };

    const originalIdb = globalThis.indexedDB;
    globalThis.indexedDB = {
      open: vi.fn(() => {
        const req: any = { result: mockDb, onupgradeneeded: null, onsuccess: null, onerror: null };
        queueMicrotask(() => req.onsuccess?.());
        return req;
      }),
    } as unknown as IDBFactory;

    try {
      const interceptor = offlineSyncQueueInterceptor();
      const next = vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 15));
        return { status: 200, statusText: 'OK', headers: {}, body: null, url: '/m1' };
      });

      await Promise.all([
        interceptor({ url: '/a', method: 'GET', headers: {} } as any, next),
        interceptor({ url: '/b', method: 'GET', headers: {} } as any, next),
      ]);

      const replayCalls = next.mock.calls.filter((c) => c[0].url === '/m1');
      expect(replayCalls).toHaveLength(1);
    } finally {
      globalThis.indexedDB = originalIdb;
    }
  });
});
