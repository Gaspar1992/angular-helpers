import { describe, it, expect, vi } from 'vitest';
import { retryInterceptor } from './retry-interceptor';
import type { SerializableRequest, SerializableResponse } from './worker-interceptor.types';

const baseReq: SerializableRequest = {
  method: 'GET',
  url: 'https://api.example.com/data',
  headers: {},
  params: {},
  body: null,
  responseType: 'json',
  withCredentials: false,
  context: {},
};

function makeResponse(
  status: number,
  headers: Record<string, string[]> = {},
): SerializableResponse {
  return { status, statusText: String(status), headers, body: null, url: baseReq.url };
}

describe('retryInterceptor', () => {
  it('passes through successful responses without retrying', async () => {
    const next = vi.fn().mockResolvedValue(makeResponse(200));
    const interceptor = retryInterceptor({ maxRetries: 3 });

    const response = await interceptor(baseReq, next);

    expect(response.status).toBe(200);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('retries on 503 up to maxRetries times then throws', async () => {
    const next = vi.fn().mockResolvedValue(makeResponse(503));
    const interceptor = retryInterceptor({ maxRetries: 2, initialDelay: 0 });

    await expect(interceptor(baseReq, next)).rejects.toThrow('Max retries exceeded');
    expect(next).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('does NOT retry on 404 (not in default retryStatusCodes)', async () => {
    const next = vi.fn().mockResolvedValue(makeResponse(404));
    const interceptor = retryInterceptor({ maxRetries: 3 });

    const response = await interceptor(baseReq, next);

    expect(response.status).toBe(404);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not retry when maxRetries is 0', async () => {
    const next = vi.fn().mockResolvedValue(makeResponse(503));
    const interceptor = retryInterceptor({ maxRetries: 0 });

    const response = await interceptor(baseReq, next);

    expect(response.status).toBe(503);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('retries on network error when retryOnNetworkError is true', async () => {
    let calls = 0;
    const next = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls < 3) throw new Error('Network error');
      return makeResponse(200);
    });
    const interceptor = retryInterceptor({
      maxRetries: 3,
      initialDelay: 0,
      retryOnNetworkError: true,
    });

    const response = await interceptor(baseReq, next);

    expect(response.status).toBe(200);
    expect(next).toHaveBeenCalledTimes(3);
  });

  it('respects Retry-After header (seconds)', async () => {
    vi.useFakeTimers();

    const next = vi
      .fn()
      .mockResolvedValueOnce(makeResponse(429, { 'retry-after': ['0'] }))
      .mockResolvedValue(makeResponse(200));

    const interceptor = retryInterceptor({ maxRetries: 1, initialDelay: 1000 });
    const promise = interceptor(baseReq, next);
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(response.status).toBe(200);
    vi.useRealTimers();
  });
});
