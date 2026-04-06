import { describe, it, expect, vi } from 'vitest';
import { composeInterceptors } from './compose-interceptors';
import type {
  SerializableRequest,
  SerializableResponse,
  WorkerInterceptorFn,
} from './worker-interceptor.types';

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

describe('composeInterceptors', () => {
  it('calls interceptors left-to-right then final next', async () => {
    const order: string[] = [];

    const a: WorkerInterceptorFn = (r, next) => {
      order.push('a');
      return next(r);
    };

    const b: WorkerInterceptorFn = (r, next) => {
      order.push('b');
      return next(r);
    };

    const finalNext = vi.fn().mockResolvedValue(okResponse);
    const composed = composeInterceptors(a, b);

    await composed(req, finalNext);

    expect(order).toEqual(['a', 'b']);
    expect(finalNext).toHaveBeenCalledTimes(1);
  });

  it('single interceptor is equivalent to calling it directly', async () => {
    const spy = vi.fn().mockImplementation((_r, next) => next(_r));
    const finalNext = vi.fn().mockResolvedValue(okResponse);
    const composed = composeInterceptors(spy);

    await composed(req, finalNext);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(finalNext).toHaveBeenCalledTimes(1);
  });

  it('empty array is equivalent to calling next directly', async () => {
    const finalNext = vi.fn().mockResolvedValue(okResponse);
    const composed = composeInterceptors();

    const response = await composed(req, finalNext);

    expect(finalNext).toHaveBeenCalledTimes(1);
    expect(response).toEqual(okResponse);
  });

  it('each interceptor can modify the request before passing it down', async () => {
    const addHeader =
      (name: string, value: string): WorkerInterceptorFn =>
      (r, next) =>
        next({ ...r, headers: { ...r.headers, [name]: [value] } });

    const finalNext = vi.fn().mockResolvedValue(okResponse);
    const composed = composeInterceptors(addHeader('X-A', '1'), addHeader('X-B', '2'));

    await composed(req, finalNext);

    const receivedReq = finalNext.mock.calls[0][0] as SerializableRequest;
    expect(receivedReq.headers['X-A']).toEqual(['1']);
    expect(receivedReq.headers['X-B']).toEqual(['2']);
  });
});
