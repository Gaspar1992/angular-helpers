import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cacheInterceptor } from './cache-interceptor';
import type { SerializableRequest, SerializableResponse } from './worker-interceptor.types';

const req: SerializableRequest = {
  method: 'GET',
  url: 'https://api.example.com/users',
  headers: {},
  params: {},
  body: null,
  responseType: 'json',
  withCredentials: false,
  context: {},
};

function makeResponse(body: unknown = { ok: true }): SerializableResponse {
  return { status: 200, statusText: 'OK', headers: {}, body, url: req.url };
}

describe('cacheInterceptor', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns cached response on second identical GET (next not called twice)', async () => {
    const next = vi.fn().mockResolvedValue(makeResponse({ id: 1 }));
    const interceptor = cacheInterceptor({ ttl: 60000 });

    const first = await interceptor(req, next);
    const second = await interceptor(req, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
  });

  it('re-fetches after TTL expires', async () => {
    const next = vi.fn().mockResolvedValue(makeResponse());
    const interceptor = cacheInterceptor({ ttl: 1000 });

    await interceptor(req, next);
    vi.advanceTimersByTime(1001);
    await interceptor(req, next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('does NOT cache POST requests by default', async () => {
    const postReq: SerializableRequest = { ...req, method: 'POST', body: { name: 'test' } };
    const next = vi.fn().mockResolvedValue(makeResponse());
    const interceptor = cacheInterceptor();

    await interceptor(postReq, next);
    await interceptor(postReq, next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it('evicts oldest entry when maxEntries is exceeded', async () => {
    const next = vi.fn().mockResolvedValue(makeResponse());
    const interceptor = cacheInterceptor({ ttl: 60000, maxEntries: 2 });

    const makeReq = (url: string): SerializableRequest => ({ ...req, url });

    // Fill cache: a, b
    await interceptor(makeReq('https://api.example.com/a'), next); // cache: {a}
    await interceptor(makeReq('https://api.example.com/b'), next); // cache: {a, b}
    expect(next).toHaveBeenCalledTimes(2);

    // Add c — evicts a (oldest) → cache: {b, c}
    await interceptor(makeReq('https://api.example.com/c'), next);
    expect(next).toHaveBeenCalledTimes(3);

    // c is now cached
    await interceptor(makeReq('https://api.example.com/c'), next);
    expect(next).toHaveBeenCalledTimes(3);

    // a was evicted — re-fetching adds it → evicts b (oldest) → cache: {c, a}
    await interceptor(makeReq('https://api.example.com/a'), next);
    expect(next).toHaveBeenCalledTimes(4);

    // b was also evicted by previous step — must re-fetch
    await interceptor(makeReq('https://api.example.com/b'), next);
    expect(next).toHaveBeenCalledTimes(5);
  });

  it('never caches when ttl is 0', async () => {
    const next = vi.fn().mockResolvedValue(makeResponse());
    const interceptor = cacheInterceptor({ ttl: 0 });

    await interceptor(req, next);
    await interceptor(req, next);

    expect(next).toHaveBeenCalledTimes(2);
  });
});
