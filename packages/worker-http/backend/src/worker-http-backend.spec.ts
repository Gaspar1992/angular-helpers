// @vitest-environment jsdom
import '@angular/compiler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { getRequestBodySize } from './worker-http-backend';
import {
  provideWorkerHttpClient,
  withWorkerConfigs,
  withWorkerRoutes,
  withMinPayloadSizeForWorker,
} from './worker-http-providers';
import { WORKER_TARGET } from './worker-http-tokens';

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

  postMessage(data: any): void {
    if (data.type === 'batch') {
      for (const msg of data.messages || []) {
        if (msg.type === 'request') this.processRequest(msg);
      }
    } else if (data.type === 'request') {
      this.processRequest(data);
    }
  }

  private processRequest(message: FakePostedMessage): void {
    queueMicrotask(() => {
      const payload = message.payload as { url?: string } | undefined;
      const event = {
        data: {
          type: 'batch-response',
          responses: [
            {
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
          ],
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

describe('WorkerHttpBackend', () => {
  describe('getRequestBodySize', () => {
    it('handles null and undefined', () => {
      expect(getRequestBodySize(null)).toBe(0);
      expect(getRequestBodySize(undefined)).toBe(0);
    });

    it('calculates size of strings', () => {
      expect(getRequestBodySize('hello')).toBe(5);
      // UTF-8 encoding of emoji is 4 bytes
      expect(getRequestBodySize('🌍')).toBe(4);
    });

    it('calculates size of Blob and File', () => {
      const blob = new Blob(['hello world']);
      expect(getRequestBodySize(blob)).toBe(11);

      const file = new File(['hello'], 'hello.txt');
      expect(getRequestBodySize(file)).toBe(5);
    });

    it('calculates size of ArrayBuffer and ArrayBufferView', () => {
      const buffer = new ArrayBuffer(16);
      expect(getRequestBodySize(buffer)).toBe(16);

      const view = new Uint8Array(buffer, 4, 8);
      expect(getRequestBodySize(view)).toBe(8);
    });

    it('calculates size of URLSearchParams', () => {
      const params = new URLSearchParams({ a: '1', b: '2' });
      // "a=1&b=2" is 7 characters/bytes
      expect(getRequestBodySize(params)).toBe(7);
    });

    it('calculates size of FormData', () => {
      const formData = new FormData();
      formData.append('key1', 'value1');
      formData.append('key2', new Blob(['blobval']));
      // key1 (4) + value1 (6) + key2 (4) + blobval (7) = 21
      expect(getRequestBodySize(formData)).toBe(21);
    });

    it('calculates size of plain objects (JSON)', () => {
      const obj = { name: 'Alice' };
      // JSON.stringify(obj) -> '{"name":"Alice"}' -> 16 bytes
      expect(getRequestBodySize(obj)).toBe(16);
    });

    it('returns Infinity on circular references or errors', () => {
      const obj: any = {};
      obj.self = obj;
      expect(getRequestBodySize(obj)).toBe(Infinity);
    });

    it('uses custom serializer if provided', () => {
      const mockSerializer = {
        serialize: vi.fn(() => ({ data: 'custom-serialized-string' })),
        deserialize: vi.fn(),
      };
      expect(getRequestBodySize({ a: 1 }, mockSerializer)).toBe(24); // length of 'custom-serialized-string'
      expect(mockSerializer.serialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('routing and bypassing', () => {
    let workerSpy: ReturnType<typeof vi.fn>;
    let fetchSpy: any;

    beforeEach(() => {
      FakeWorker.instances = [];
      const spy = vi.fn();
      workerSpy = spy;
      const Ctor = class extends FakeWorker {
        constructor(url: string | URL, options?: unknown) {
          super(url);
          spy(url, options);
        }
      };
      (globalThis as any).Worker = Ctor;

      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ from: 'fetch' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    });

    afterEach(() => {
      TestBed.resetTestingModule();
      delete (globalThis as any).Worker;
      fetchSpy.mockRestore();
    });

    it('routes to worker by default when no minPayloadSize is configured', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideWorkerHttpClient(
            withWorkerConfigs([{ id: 'api', workerUrl: WORKER_URL }]),
            withWorkerRoutes([{ pattern: /\/api\//, worker: 'api' }]),
          ),
        ],
      });

      const http = TestBed.inject(HttpClient);
      const response = await firstValueFrom(
        http.post<{ from: string }>('/api/data', { text: 'small' }),
      );

      expect(response).toEqual({ from: 'worker', url: '/api/data' });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(workerSpy).toHaveBeenCalledTimes(1);
    });

    it('bypasses worker when payload size is below minPayloadSize threshold', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideWorkerHttpClient(
            withWorkerConfigs([{ id: 'api', workerUrl: WORKER_URL }]),
            withWorkerRoutes([{ pattern: /\/api\//, worker: 'api' }]),
            withMinPayloadSizeForWorker(1024), // 1KB threshold
          ),
        ],
      });

      const http = TestBed.inject(HttpClient);
      // Body is '{"text":"small"}' -> 16 bytes (< 1024)
      const response = await firstValueFrom(
        http.post<{ from: string }>('/api/data', { text: 'small' }),
      );

      expect(response).toEqual({ from: 'fetch' });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(FakeWorker.instances).toHaveLength(0); // No worker created
    });

    it('routes to worker when payload size is equal to or above minPayloadSize threshold', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideWorkerHttpClient(
            withWorkerConfigs([{ id: 'api', workerUrl: WORKER_URL }]),
            withWorkerRoutes([{ pattern: /\/api\//, worker: 'api' }]),
            withMinPayloadSizeForWorker(10), // 10 bytes threshold
          ),
        ],
      });

      const http = TestBed.inject(HttpClient);
      // Body is '{"text":"large"}' -> 16 bytes (>= 10)
      const response = await firstValueFrom(
        http.post<{ from: string }>('/api/data', { text: 'large' }),
      );

      expect(response).toEqual({ from: 'worker', url: '/api/data' });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(workerSpy).toHaveBeenCalledTimes(1);
    });

    it('explicit WORKER_TARGET context overrides minPayloadSize threshold', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideWorkerHttpClient(
            withWorkerConfigs([{ id: 'api', workerUrl: WORKER_URL }]),
            withWorkerRoutes([{ pattern: /\/api\//, worker: 'api' }]),
            withMinPayloadSizeForWorker(1024), // 1KB threshold
          ),
        ],
      });

      const http = TestBed.inject(HttpClient);
      const context = new HttpContext().set(WORKER_TARGET, 'api');
      const response = await firstValueFrom(
        http.post<{ from: string }>('/api/data', { text: 'small' }, { context }),
      );

      expect(response).toEqual({ from: 'worker', url: '/api/data' });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(workerSpy).toHaveBeenCalledTimes(1);
    });

    it('GET/HEAD requests without specific route bypass worker', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideWorkerHttpClient(
            withWorkerConfigs([{ id: 'api', workerUrl: WORKER_URL }]),
            withWorkerRoutes([{ pattern: /\/api\/specific/, worker: 'api' }]),
            withMinPayloadSizeForWorker(1024),
          ),
        ],
      });

      const http = TestBed.inject(HttpClient);
      const response = await firstValueFrom(http.get<{ from: string }>('/api/other'));
      expect(response).toEqual({ from: 'fetch' });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('GET/HEAD requests with specific route go to worker', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideWorkerHttpClient(
            withWorkerConfigs([{ id: 'api', workerUrl: WORKER_URL }]),
            withWorkerRoutes([{ pattern: /\/api\/specific/, worker: 'api' }]),
            withMinPayloadSizeForWorker(1024),
          ),
        ],
      });

      const http = TestBed.inject(HttpClient);
      const response = await firstValueFrom(http.get<{ from: string }>('/api/specific'));
      expect(response).toEqual({ from: 'worker', url: '/api/specific' });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(workerSpy).toHaveBeenCalledTimes(1);
    });
  });
});
