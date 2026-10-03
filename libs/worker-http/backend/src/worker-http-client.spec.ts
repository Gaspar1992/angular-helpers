import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext } from '@angular/common/http';
import { of } from 'rxjs';
import { WorkerHttpClient } from './worker-http-client';
import { WORKER_TARGET, WORKER_HTTP_SIGNAL, WORKER_HTTP_TIMEOUT } from './worker-http-tokens';

describe('WorkerHttpClient', () => {
  let client: WorkerHttpClient;
  let mockHttpClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    head: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn().mockReturnValue(of({ data: 'ok' })),
      post: vi.fn().mockReturnValue(of({ data: 'created' })),
      put: vi.fn().mockReturnValue(of({ data: 'updated' })),
      patch: vi.fn().mockReturnValue(of({ data: 'patched' })),
      delete: vi.fn().mockReturnValue(of({ data: 'deleted' })),
      head: vi.fn().mockReturnValue(of({ data: 'head' })),
    };

    TestBed.configureTestingModule({
      providers: [WorkerHttpClient, { provide: HttpClient, useValue: mockHttpClient }],
    });

    client = TestBed.inject(WorkerHttpClient);
  });

  it('delegates get and sets default null worker context', () => {
    client.get('/api/users').subscribe();

    expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
    const [url, options] = mockHttpClient.get.mock.calls[0];
    expect(url).toBe('/api/users');
    expect(options.context.get(WORKER_TARGET)).toBeNull();
  });

  it('sets worker, signal, and timeout tokens on the HttpContext', () => {
    const controller = new AbortController();
    client
      .get('/api/secure-data', {
        worker: 'crypto-worker',
        signal: controller.signal,
        timeout: 5000,
      })
      .subscribe();

    const [, options] = mockHttpClient.get.mock.calls[0];
    const ctx: HttpContext = options.context;
    expect(ctx.get(WORKER_TARGET)).toBe('crypto-worker');
    expect(ctx.get(WORKER_HTTP_SIGNAL)).toBe(controller.signal);
    expect(ctx.get(WORKER_HTTP_TIMEOUT)).toBe(5000);
  });

  it('preserves existing HttpContext tokens passed by caller', () => {
    const existingCtx = new HttpContext();
    client
      .post('/api/items', { title: 'Item 1' }, { worker: 'heavy', context: existingCtx })
      .subscribe();

    expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
    const [url, body, options] = mockHttpClient.post.mock.calls[0];
    expect(url).toBe('/api/items');
    expect(body).toEqual({ title: 'Item 1' });
    expect(options.context.get(WORKER_TARGET)).toBe('heavy');
  });

  it('delegates put with correct parameters', () => {
    client.put('/api/items/1', { title: 'Updated' }, { worker: 'w1' }).subscribe();
    expect(mockHttpClient.put).toHaveBeenCalledWith(
      '/api/items/1',
      { title: 'Updated' },
      expect.objectContaining({
        context: expect.any(HttpContext),
      }),
    );
  });

  it('delegates patch with correct parameters', () => {
    client.patch('/api/items/1', { title: 'Patched' }, { worker: 'w2' }).subscribe();
    expect(mockHttpClient.patch).toHaveBeenCalledWith(
      '/api/items/1',
      { title: 'Patched' },
      expect.objectContaining({
        context: expect.any(HttpContext),
      }),
    );
  });

  it('delegates delete with correct parameters', () => {
    client.delete('/api/items/1', { worker: 'w3' }).subscribe();
    expect(mockHttpClient.delete).toHaveBeenCalledWith(
      '/api/items/1',
      expect.objectContaining({
        context: expect.any(HttpContext),
      }),
    );
  });

  it('delegates head with correct parameters', () => {
    client.head('/api/items/1', { worker: 'w4' }).subscribe();
    expect(mockHttpClient.head).toHaveBeenCalledWith(
      '/api/items/1',
      expect.objectContaining({
        context: expect.any(HttpContext),
      }),
    );
  });
});
