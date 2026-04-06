import { describe, it, expect, vi } from 'vitest';
import { loggingInterceptor } from './logging-interceptor';
import type { SerializableRequest, SerializableResponse } from './worker-interceptor.types';

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

const okResponse: SerializableResponse = {
  status: 200,
  statusText: 'OK',
  headers: {},
  body: null,
  url: req.url,
};

describe('loggingInterceptor', () => {
  it('logs request before calling next and response after', async () => {
    const logs: string[] = [];
    const logger = vi.fn((msg: string) => logs.push(msg));
    const next = vi.fn().mockResolvedValue(okResponse);
    const interceptor = loggingInterceptor({ logger });

    await interceptor(req, next);

    expect(logger).toHaveBeenCalledTimes(2);
    expect(logs[0]).toContain('[worker] →');
    expect(logs[0]).toContain('GET');
    expect(logs[1]).toContain('[worker] ←');
    expect(logs[1]).toContain('200');
  });

  it('response log includes elapsed ms', async () => {
    const logs: string[] = [];
    const logger = vi.fn((msg: string) => logs.push(msg));
    const next = vi.fn().mockResolvedValue(okResponse);
    const interceptor = loggingInterceptor({ logger });

    await interceptor(req, next);

    expect(logs[1]).toMatch(/\d+ms/);
  });

  it('logs error and rethrows when next throws', async () => {
    const logs: string[] = [];
    const logger = vi.fn((msg: string) => logs.push(msg));
    const next = vi.fn().mockRejectedValue(Object.assign(new Error('fail'), { status: 500 }));
    const interceptor = loggingInterceptor({ logger });

    await expect(interceptor(req, next)).rejects.toThrow('fail');
    expect(logs[1]).toContain('[worker] ✕');
    expect(logs[1]).toContain('500');
  });

  it('does not break pipeline when logger throws', async () => {
    const logger = vi.fn().mockImplementation(() => {
      throw new Error('logger failed');
    });
    const next = vi.fn().mockResolvedValue(okResponse);
    const interceptor = loggingInterceptor({ logger });

    const response = await interceptor(req, next);

    expect(response.status).toBe(200);
  });

  it('uses console.log by default', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const next = vi.fn().mockResolvedValue(okResponse);
    const interceptor = loggingInterceptor();

    await interceptor(req, next);

    expect(consoleSpy).toHaveBeenCalledTimes(2);
    consoleSpy.mockRestore();
  });
});
