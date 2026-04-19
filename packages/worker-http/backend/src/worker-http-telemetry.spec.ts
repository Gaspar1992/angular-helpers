// @vitest-environment jsdom
import '@angular/compiler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import {
  provideWorkerHttpClient,
  withWorkerConfigs,
  withWorkerRoutes,
  withTelemetry,
} from './worker-http-providers';
import type {
  WorkerHttpErrorEvent,
  WorkerHttpRequestEvent,
  WorkerHttpResponseEvent,
  WorkerHttpTelemetry,
} from './worker-http-telemetry';

/**
 * Telemetry-focused integration spec. Asserts the three hook invariants
 * listed in the README:
 *   1. onRequest fires before dispatch with correct metadata
 *   2. onResponse fires with matching requestId and non-negative duration
 *   3. onError isolates throwing subscribers from the HTTP request
 *   4. Multiple subscribers all receive events in registration order
 *   5. Fallback transport reports `transport: 'fallback-fetch'` and workerId=null
 */

interface FakePostedMessage {
  type: 'request' | 'cancel' | string;
  requestId: string;
  payload?: unknown;
}

class FakeWorker {
  private readonly listeners = new Map<string, Set<(event: unknown) => void>>();
  terminated = false;
  static nextResponse: {
    body?: unknown;
    status?: number;
    fail?: boolean;
  } = {};

  constructor(public readonly scriptUrl: string | URL) {
    /* no-op */
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
      if (FakeWorker.nextResponse.fail) {
        for (const listener of this.listeners.get('message') ?? []) {
          listener({
            data: {
              type: 'error',
              requestId: message.requestId,
              error: { message: 'boom' },
            },
          });
        }
        return;
      }
      for (const listener of this.listeners.get('message') ?? []) {
        listener({
          data: {
            type: 'response',
            requestId: message.requestId,
            result: {
              status: FakeWorker.nextResponse.status ?? 200,
              statusText: 'OK',
              headers: { 'content-type': ['application/json'] },
              body: FakeWorker.nextResponse.body ?? { ok: true },
              url: payload?.url ?? '',
            },
          },
        });
      }
    });
  }

  terminate(): void {
    this.terminated = true;
  }
}

const WORKER_URL = new URL('https://example.test/worker.js');

function makeSubscriber(label: string, events: unknown[]): WorkerHttpTelemetry {
  return {
    onRequest: (e) => events.push([label, e]),
    onResponse: (e) => events.push([label, e]),
    onError: (e) => events.push([label, e]),
  };
}

describe('withTelemetry', () => {
  beforeEach(() => {
    FakeWorker.nextResponse = {};
    (globalThis as unknown as { Worker: unknown }).Worker = FakeWorker;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    delete (globalThis as { Worker?: unknown }).Worker;
  });

  it('emits onRequest → onResponse around a successful request', async () => {
    const requests: WorkerHttpRequestEvent[] = [];
    const responses: WorkerHttpResponseEvent[] = [];

    TestBed.configureTestingModule({
      providers: [
        provideWorkerHttpClient(
          withWorkerConfigs([{ id: 'api', workerUrl: WORKER_URL }]),
          withWorkerRoutes([{ pattern: /\/api\//, worker: 'api' }]),
          withTelemetry({
            onRequest: (e) => requests.push(e),
            onResponse: (e) => responses.push(e),
          }),
        ),
      ],
    });

    const http = TestBed.inject(HttpClient);
    await firstValueFrom(http.get('/api/telemetry'));

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      kind: 'request',
      method: 'GET',
      url: '/api/telemetry',
      workerId: 'api',
      transport: 'worker',
    });
    expect(requests[0].requestId).toMatch(/^whttp-/);

    expect(responses).toHaveLength(1);
    expect(responses[0]).toMatchObject({
      kind: 'response',
      status: 200,
      workerId: 'api',
      transport: 'worker',
      requestId: requests[0].requestId, // same id correlates both events
    });
    expect(responses[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('emits onError (not onResponse) when the worker signals failure', async () => {
    FakeWorker.nextResponse = { fail: true };
    const events: unknown[] = [];

    TestBed.configureTestingModule({
      providers: [
        provideWorkerHttpClient(
          withWorkerConfigs([{ id: 'api', workerUrl: WORKER_URL }]),
          withWorkerRoutes([{ pattern: /\/api\//, worker: 'api' }]),
          withTelemetry({
            onRequest: (e) => events.push(['req', e]),
            onResponse: (e) => events.push(['res', e]),
            onError: (e) => events.push(['err', e]),
          }),
        ),
      ],
    });

    const http = TestBed.inject(HttpClient);
    await expect(firstValueFrom(http.get('/api/fail'))).rejects.toBeDefined();

    const kinds = events.map(([k]) => k);
    expect(kinds).toEqual(['req', 'err']); // no 'res'

    const [, errEvent] = events[1] as ['err', WorkerHttpErrorEvent];
    expect(errEvent.kind).toBe('error');
    expect(errEvent.workerId).toBe('api');
    expect(errEvent.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('invokes all subscribers in registration order with the same event payload', async () => {
    const events: unknown[] = [];

    TestBed.configureTestingModule({
      providers: [
        provideWorkerHttpClient(
          withWorkerConfigs([{ id: 'api', workerUrl: WORKER_URL }]),
          withWorkerRoutes([{ pattern: /\/api\//, worker: 'api' }]),
          withTelemetry(makeSubscriber('A', events)),
          withTelemetry(makeSubscriber('B', events)),
          withTelemetry(makeSubscriber('C', events)),
        ),
      ],
    });

    const http = TestBed.inject(HttpClient);
    await firstValueFrom(http.get('/api/fan-out'));

    // 3 subscribers × 2 events (request + response) = 6 invocations
    expect(events).toHaveLength(6);

    const order = events.map(([label, e]) => [label, (e as { kind: string }).kind]);
    expect(order).toEqual([
      ['A', 'request'],
      ['B', 'request'],
      ['C', 'request'],
      ['A', 'response'],
      ['B', 'response'],
      ['C', 'response'],
    ]);
  });

  it('isolates throwing subscribers — HTTP request still succeeds, other subscribers still receive events', async () => {
    // Silence the deliberate console.error.
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const healthyEvents: unknown[] = [];

    TestBed.configureTestingModule({
      providers: [
        provideWorkerHttpClient(
          withWorkerConfigs([{ id: 'api', workerUrl: WORKER_URL }]),
          withWorkerRoutes([{ pattern: /\/api\//, worker: 'api' }]),
          withTelemetry({
            onRequest: () => {
              throw new Error('subscriber explosion');
            },
          }),
          withTelemetry({
            onRequest: (e) => healthyEvents.push(e),
            onResponse: (e) => healthyEvents.push(e),
          }),
        ),
      ],
    });

    const http = TestBed.inject(HttpClient);
    const res = await firstValueFrom(http.get('/api/robust'));

    expect(res).toBeDefined();
    expect(healthyEvents).toHaveLength(2); // request + response
    expect(errSpy).toHaveBeenCalledWith(
      '[WorkerHttpBackend] telemetry subscriber threw:',
      expect.any(Error),
    );

    errSpy.mockRestore();
  });

  it('reports transport=fallback-fetch and workerId=null when SSR fallback is triggered', async () => {
    delete (globalThis as { Worker?: unknown }).Worker;

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ from: 'fetch' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const requests: WorkerHttpRequestEvent[] = [];
    const responses: WorkerHttpResponseEvent[] = [];

    try {
      TestBed.configureTestingModule({
        providers: [
          provideWorkerHttpClient(
            withWorkerConfigs([{ id: 'api', workerUrl: WORKER_URL }]),
            withWorkerRoutes([{ pattern: /\/api\//, worker: 'api' }]),
            withTelemetry({
              onRequest: (e) => requests.push(e),
              onResponse: (e) => responses.push(e),
            }),
          ),
        ],
      });

      const http = TestBed.inject(HttpClient);
      await firstValueFrom(http.get('/api/ssr'));

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(requests[0]).toMatchObject({
        transport: 'fallback-fetch',
        workerId: null,
      });
      expect(responses[0]).toMatchObject({
        transport: 'fallback-fetch',
        workerId: null,
        status: 200,
      });
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
