import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { offlineSyncQueueInterceptor } from './offline-sync-queue';
import type { SerializableRequest, SerializableResponse } from './worker-interceptor.types';

const req: SerializableRequest = {
  method: 'POST',
  url: 'https://api.example.com/users',
  headers: {},
  params: {},
  body: { name: 'Alice' },
  responseType: 'json',
  withCredentials: false,
  context: {},
};

function makeResponse(body: unknown = { id: '123' }): SerializableResponse {
  return { status: 201, statusText: 'Created', headers: {}, body, url: req.url };
}

describe('offlineSyncQueueInterceptor', () => {
  const dbStore = new Map<string, any>();
  let originalIndexedDB: any;
  let originalNavigator: any;

  beforeEach(() => {
    vi.useFakeTimers();
    dbStore.clear();

    // Mock IndexedDB
    const mockIDBRequest = (result: any = null) => {
      const r: any = { onsuccess: null, onerror: null, result };
      return r;
    };

    const mockIDBTransaction = {
      objectStore: vi.fn().mockImplementation(() => {
        return {
          add: vi.fn().mockImplementation((item) => {
            dbStore.set(item.id, item);
            const r = mockIDBRequest(item.id);
            queueMicrotask(() => r.onsuccess?.({ target: { result: item.id } }));
            return r;
          }),
          getAll: vi.fn().mockImplementation(() => {
            const r = mockIDBRequest();
            queueMicrotask(() => {
              r.result = Array.from(dbStore.values());
              r.onsuccess?.();
            });
            return r;
          }),
          delete: vi.fn().mockImplementation((id) => {
            dbStore.delete(id);
            const r = mockIDBRequest();
            queueMicrotask(() => r.onsuccess?.());
            return r;
          }),
        };
      }),
    };

    const mockDB = {
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(true),
      },
      transaction: vi.fn().mockReturnValue(mockIDBTransaction),
      close: vi.fn(),
    };

    const mockIDBOpenRequest = {
      result: mockDB,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    };

    const mockIndexedDB = {
      open: vi.fn().mockImplementation(() => {
        queueMicrotask(() => {
          mockIDBOpenRequest.onupgradeneeded?.();
          mockIDBOpenRequest.onsuccess?.();
        });
        return mockIDBOpenRequest;
      }),
    };

    originalIndexedDB = (globalThis as any).indexedDB;
    (globalThis as any).indexedDB = mockIndexedDB;

    // Mock Navigator
    originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalIndexedDB !== undefined) {
      (globalThis as any).indexedDB = originalIndexedDB;
    } else {
      delete (globalThis as any).indexedDB;
    }
    if (originalNavigator !== undefined) {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    } else {
      delete (globalThis as any).navigator;
    }
  });

  it('passes request straight to next when online and no pending queue exists', async () => {
    const next = vi.fn().mockResolvedValue(makeResponse());
    const interceptor = offlineSyncQueueInterceptor();

    const result = await interceptor(req, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(201);
    expect(dbStore.size).toBe(0);
  });

  it('intercepts and enqueues mutations (POST/PUT/PATCH/DELETE) when offline', async () => {
    // Simulate offline state
    (globalThis as any).navigator.onLine = false;

    const next = vi.fn();
    const interceptor = offlineSyncQueueInterceptor();

    const resultPromise = interceptor(req, next);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(next).not.toHaveBeenCalled();
    expect(result.status).toBe(202);
    expect(result.statusText).toBe('Accepted (Enqueued Offline)');
    expect(dbStore.size).toBe(1);

    const queued = Array.from(dbStore.values())[0];
    expect(queued.request.method).toBe('POST');
    expect(queued.request.body).toEqual({ name: 'Alice' });
  });

  it('drains the queue in strict FIFO sequence when going online', async () => {
    const interceptor = offlineSyncQueueInterceptor();

    // 1. Enqueue two requests while offline
    (globalThis as any).navigator.onLine = false;
    const req1: SerializableRequest = { ...req, body: { order: 1 } };
    const req2: SerializableRequest = { ...req, body: { order: 2 } };

    const p1 = interceptor(req1, vi.fn());
    await vi.runAllTimersAsync();
    await p1;

    // Advance timer slightly to ensure deterministic timestamp order
    vi.advanceTimersByTime(10);

    const p2 = interceptor(req2, vi.fn());
    await vi.runAllTimersAsync();
    await p2;

    expect(dbStore.size).toBe(2);

    // 2. Transition back online and execute a new request
    (globalThis as any).navigator.onLine = true;
    const next = vi.fn().mockResolvedValue(makeResponse());

    const finalReq: SerializableRequest = {
      ...req,
      method: 'GET',
      url: 'https://api.example.com/status',
    };
    const finalPromise = interceptor(finalReq, next);
    await vi.runAllTimersAsync();
    await finalPromise;

    // "next" should have been called 3 times total:
    // - once for req1 (order: 1)
    // - once for req2 (order: 2)
    // - once for final status request
    expect(next).toHaveBeenCalledTimes(3);
    expect(next.mock.calls[0][0].body).toEqual({ order: 1 });
    expect(next.mock.calls[1][0].body).toEqual({ order: 2 });
    expect(next.mock.calls[2][0].url).toBe('https://api.example.com/status');
    expect(dbStore.size).toBe(0); // All mutations replayed and dequeued
  });

  it('handles synthetic offline-sync-status checks correctly', async () => {
    // Setup 1 pending request
    dbStore.set('xyz', { id: 'xyz', timestamp: Date.now(), request: req });

    const statusReq: SerializableRequest = {
      ...req,
      method: 'GET',
      url: 'https://angular-helpers.local/offline-sync-status',
    };

    const next = vi.fn();
    const interceptor = offlineSyncQueueInterceptor();

    const resultPromise = interceptor(statusReq, next);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(next).not.toHaveBeenCalled();
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      online: true,
      pendingCount: 1,
    });
  });

  it('handles synthetic offline-sync-drain request correctly', async () => {
    // Setup 1 pending request
    dbStore.set('xyz', { id: 'xyz', timestamp: Date.now(), request: req });

    const drainReq: SerializableRequest = {
      ...req,
      method: 'GET',
      url: 'https://angular-helpers.local/offline-sync-drain',
    };

    const next = vi.fn().mockResolvedValue(makeResponse());
    const interceptor = offlineSyncQueueInterceptor();

    const resultPromise = interceptor(drainReq, next);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    // Should call next to process the queued mutation, but NOT the drain request itself
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].body).toEqual({ name: 'Alice' });
    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.pendingCount).toBe(0);
    expect(dbStore.size).toBe(0);
  });
});
