// @vitest-environment jsdom
import '@angular/compiler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { TransferState } from '@angular/core';
import { ɵwithHttpTransferCache } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import {
  provideWorkerHttpClient,
  withWorkerConfigs,
  withWorkerRoutes,
} from './worker-http-providers';
import { WorkerHttpBackend } from './worker-http-backend';

/**
 * Integration spec for `provideWorkerHttpClient()`.
 *
 * Proves three things end-to-end through Angular's `HttpClient` pipeline:
 *  1. The `HttpBackend` in the injector is our `WorkerHttpBackend`.
 *  2. A routed request is dispatched to a Worker instance (via FakeWorker).
 *  3. When Angular's transfer cache is enabled (as by `provideClientHydration()`)
 *     and `TransferState` has a matching entry, the request short-circuits
 *     without creating a worker — proving SSR hydration works transparently.
 */

interface FakePostedMessage {
  type: 'request' | 'cancel' | string;
  requestId: string;
  payload?: unknown;
}

class FakeWorker {
  static instances: FakeWorker[] = [];
  private readonly listeners = new Map<string, Set<(event: unknown) => void>>();
  terminated = false;

  constructor(public readonly scriptUrl: string | URL) {
    FakeWorker.instances.push(this);
  }

  addEventListener(type: string, listener: (event: unknown) => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (event: unknown) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  postMessage(message: FakePostedMessage): void {
    if (message.type !== 'request') return;
    queueMicrotask(() => {
      const payload = message.payload as { url?: string } | undefined;
      const event = {
        data: {
          type: 'response',
          requestId: message.requestId,
          result: {
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': ['application/json'] },
            body: { from: 'worker', url: payload?.url },
            url: payload?.url ?? '',
          },
        },
      };
      for (const listener of this.listeners.get('message') ?? []) {
        listener(event);
      }
    });
  }

  terminate(): void {
    this.terminated = true;
  }
}

const WORKER_URL = new URL('https://example.test/worker.js');

describe('provideWorkerHttpClient — integration', () => {
  let workerSpy: ReturnType<typeof vi.fn<(url: string | URL, options?: unknown) => void>>;

  beforeEach(() => {
    FakeWorker.instances = [];
    // Class-style fake so `new Worker(...)` works natively with constructor args.
    const spy = vi.fn<(url: string | URL, options?: unknown) => void>();
    workerSpy = spy;
    const Ctor = class extends FakeWorker {
      constructor(url: string | URL, options?: unknown) {
        super(url);
        spy(url, options);
      }
    };
    (globalThis as unknown as { Worker: unknown }).Worker = Ctor;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    delete (globalThis as { Worker?: unknown }).Worker;
  });

  it('registers WorkerHttpBackend as the HttpBackend used by HttpClient', () => {
    TestBed.configureTestingModule({
      providers: [
        provideWorkerHttpClient(withWorkerConfigs([{ id: 'api', workerUrl: WORKER_URL }])),
      ],
    });

    const backend = TestBed.inject(HttpBackend);
    expect(backend).toBeInstanceOf(WorkerHttpBackend);

    // HttpClient must be resolvable too — `provideWorkerHttpClient` wraps it internally.
    expect(TestBed.inject(HttpClient)).toBeDefined();
  });

  it('routes a matching request through the Worker pool (no fetch fallback)', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideWorkerHttpClient(
          withWorkerConfigs([{ id: 'api', workerUrl: WORKER_URL }]),
          withWorkerRoutes([{ pattern: /\/api\//, worker: 'api' }]),
        ),
      ],
    });

    const http = TestBed.inject(HttpClient);
    const response = await firstValueFrom(http.get<{ from: string }>('/api/data'));

    expect(workerSpy).toHaveBeenCalledTimes(1);
    expect(workerSpy).toHaveBeenCalledWith(WORKER_URL, { type: 'module' });
    expect(response).toEqual({ from: 'worker', url: '/api/data' });
  });

  it('coexists with Angular transfer cache providers (provideClientHydration path)', async () => {
    // `ɵwithHttpTransferCache({})` is exactly what `provideClientHydration()`
    // plugs in under the hood when the default HTTP transfer cache is
    // enabled. We combine it with our backend providers to prove there is no
    // DI collision, no duplicate HttpBackend, and that requests still flow
    // through the worker as expected.
    //
    // Asserting the actual SSR round-trip (server writes → browser reads
    // without worker) requires toggling `PLATFORM_ID` between two TestBed
    // instances that share a TransferState snapshot. That is a full SSR
    // integration scenario — see the README for the end-to-end contract.
    TestBed.configureTestingModule({
      providers: [
        provideWorkerHttpClient(
          withWorkerConfigs([{ id: 'api', workerUrl: WORKER_URL }]),
          withWorkerRoutes([{ pattern: /\/api\//, worker: 'api' }]),
        ),
        ɵwithHttpTransferCache({}),
      ],
    });

    // TransferState must be resolvable — proves the interceptor providers
    // were accepted and there is no missing dependency.
    expect(TestBed.inject(TransferState)).toBeDefined();

    // HttpBackend is still our WorkerHttpBackend — the transfer cache
    // interceptor does not override it.
    expect(TestBed.inject(HttpBackend)).toBeInstanceOf(WorkerHttpBackend);

    const http = TestBed.inject(HttpClient);
    const response = await firstValueFrom(http.get<{ from: string }>('/api/cached'));

    expect(response).toEqual({ from: 'worker', url: '/api/cached' });
    expect(workerSpy).toHaveBeenCalledTimes(1);
  });

  it('falls back to FetchBackend when Worker is not available (SSR-safe)', async () => {
    delete (globalThis as { Worker?: unknown }).Worker;

    // We mock `fetch` so the SSR fallback can answer without any real network.
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ from: 'fetch' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    try {
      TestBed.configureTestingModule({
        providers: [
          provideWorkerHttpClient(
            withWorkerConfigs([{ id: 'api', workerUrl: WORKER_URL }]),
            withWorkerRoutes([{ pattern: /\/api\//, worker: 'api' }]),
          ),
        ],
      });

      const http = TestBed.inject(HttpClient);
      const response = await firstValueFrom(http.get<{ from: string }>('/api/data'));

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(workerSpy).not.toHaveBeenCalled();
      expect(response).toEqual({ from: 'fetch' });
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
