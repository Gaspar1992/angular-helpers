import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimitInterceptor } from './rate-limit-interceptor';
import type { SerializableRequest } from './worker-interceptor.types';

const req: SerializableRequest = {
  method: 'GET',
  url: 'https://api.example.com/data',
  headers: {},
  params: {},
  body: null,
  responseType: 'json',
  withCredentials: false,
  context: {},
};

const okResponse = { status: 200, statusText: 'OK', headers: {}, body: null, url: req.url };

describe('rateLimitInterceptor', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('allows requests up to maxRequests within the window', async () => {
    const next = vi.fn().mockResolvedValue(okResponse);
    const interceptor = rateLimitInterceptor({ maxRequests: 3, windowMs: 60000 });

    await interceptor(req, next);
    await interceptor(req, next);
    await interceptor(req, next);

    expect(next).toHaveBeenCalledTimes(3);
  });

  it('throws 429 when maxRequests is exceeded within window', async () => {
    const next = vi.fn().mockResolvedValue(okResponse);
    const interceptor = rateLimitInterceptor({ maxRequests: 2, windowMs: 60000 });

    await interceptor(req, next);
    await interceptor(req, next);

    await expect(interceptor(req, next)).rejects.toMatchObject({ status: 429 });
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('resets counter after window expires', async () => {
    const next = vi.fn().mockResolvedValue(okResponse);
    const interceptor = rateLimitInterceptor({ maxRequests: 1, windowMs: 1000 });

    await interceptor(req, next);
    vi.advanceTimersByTime(1001);
    await interceptor(req, next);

    expect(next).toHaveBeenCalledTimes(2);
  });
});
