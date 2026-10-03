import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildChain, executeFetch } from './worker-fetch-executor';
import type {
  SerializableRequest,
  SerializableResponse,
  WorkerInterceptorFn,
} from './worker-interceptor.types';

describe('worker-fetch-executor', () => {
  describe('buildChain', () => {
    it('executes interceptors in order and reaches finalHandler', async () => {
      const order: string[] = [];

      const interceptor1: WorkerInterceptorFn = async (req, next) => {
        order.push('i1-start');
        const res = await next(req);
        order.push('i1-end');
        return res;
      };

      const interceptor2: WorkerInterceptorFn = async (req, next) => {
        order.push('i2-start');
        const res = await next(req);
        order.push('i2-end');
        return res;
      };

      const finalHandler = async (req: SerializableRequest) => {
        order.push('final');
        return {
          status: 200,
          statusText: 'OK',
          headers: {},
          body: { success: true },
          url: req.url,
        };
      };

      const chain = buildChain([interceptor1, interceptor2], finalHandler);
      const req: SerializableRequest = {
        id: '1',
        url: '/test',
        method: 'GET',
        headers: {},
        params: {},
        responseType: 'json',
        withCredentials: false,
      };

      const res = await chain(req);
      expect(order).toEqual(['i1-start', 'i2-start', 'final', 'i2-end', 'i1-end']);
      expect(res.status).toBe(200);
    });
  });

  describe('executeFetch', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
      vi.restoreAllMocks();
    });

    it('translates SerializableRequest to fetch and serializes JSON response', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        url: 'https://api.example.com/items?filter=active',
        headers: new Headers({
          'content-type': 'application/json',
          'x-custom': 'val1',
        }),
        json: vi.fn().mockResolvedValue({ id: 1, name: 'Item' }),
      };

      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse as any);

      const req: SerializableRequest = {
        id: 'req-1',
        url: 'https://api.example.com/items',
        method: 'POST',
        headers: { authorization: ['Bearer token'] },
        params: { filter: ['active'] },
        body: { query: 'test' },
        responseType: 'json',
        withCredentials: true,
      };

      const result = await executeFetch(req);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.example.com/items?filter=active',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ query: 'test' }),
        }),
      );
      expect(result.status).toBe(200);
      expect(result.body).toEqual({ id: 1, name: 'Item' });
      expect(result.headers['content-type']).toEqual(['application/json']);
    });

    it('handles responseType text, arraybuffer, and blob', async () => {
      const mockText = 'raw-text';
      const mockBuffer = new ArrayBuffer(8);
      const mockBlob = new Blob(['blob-data']);

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          url: '/text',
          headers: new Headers(),
          text: () => Promise.resolve(mockText),
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          url: '/buffer',
          headers: new Headers(),
          arrayBuffer: () => Promise.resolve(mockBuffer),
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          url: '/blob',
          headers: new Headers(),
          blob: () => Promise.resolve(mockBlob),
        } as any);

      const baseReq: SerializableRequest = {
        id: '1',
        url: '/test',
        method: 'GET',
        headers: {},
        params: {},
        withCredentials: false,
      };

      const textRes = await executeFetch({ ...baseReq, responseType: 'text' });
      expect(textRes.body).toBe(mockText);

      const bufferRes = await executeFetch({ ...baseReq, responseType: 'arraybuffer' });
      expect(bufferRes.body).toBe(mockBuffer);

      const blobRes = await executeFetch({ ...baseReq, responseType: 'blob' });
      expect(blobRes.body).toBe(mockBlob);
    });
  });
});
