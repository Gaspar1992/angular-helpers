import { describe, it, expect } from 'vitest';
import { hmacSigningInterceptor } from './hmac-signing-interceptor';
import type { SerializableRequest } from './worker-interceptor.types';

const keyMaterial = new TextEncoder().encode('test-secret-key-32bytes-padding!!');

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

const okResponse = { status: 200, statusText: 'OK', headers: {}, body: null, url: baseReq.url };

describe('hmacSigningInterceptor', () => {
  it('adds HMAC signature header to outgoing request', async () => {
    let capturedReq: SerializableRequest | null = null;
    const next = (r: SerializableRequest) => {
      capturedReq = r;
      return Promise.resolve(okResponse);
    };

    const interceptor = hmacSigningInterceptor({ keyMaterial });
    await interceptor(baseReq, next);

    expect(capturedReq).not.toBeNull();
    expect(capturedReq!.headers['X-HMAC-Signature']).toBeDefined();
    expect(capturedReq!.headers['X-HMAC-Signature'][0]).toMatch(/^[0-9a-f]{64}$/);
  });

  it('uses custom header name from config', async () => {
    let capturedReq: SerializableRequest | null = null;
    const next = (r: SerializableRequest) => {
      capturedReq = r;
      return Promise.resolve(okResponse);
    };

    const interceptor = hmacSigningInterceptor({ keyMaterial, headerName: 'X-Custom-Sig' });
    await interceptor(baseReq, next);

    expect(capturedReq!.headers['X-Custom-Sig']).toBeDefined();
    expect(capturedReq!.headers['X-HMAC-Signature']).toBeUndefined();
  });

  it('produces different signatures for different request bodies', async () => {
    const signatures: string[] = [];
    const next = (r: SerializableRequest) => {
      signatures.push(r.headers['X-HMAC-Signature'][0]);
      return Promise.resolve(okResponse);
    };

    const interceptor = hmacSigningInterceptor({ keyMaterial });
    await interceptor({ ...baseReq, method: 'POST', body: { a: 1 } }, next);
    await interceptor({ ...baseReq, method: 'POST', body: { a: 2 } }, next);

    expect(signatures[0]).not.toEqual(signatures[1]);
  });

  it('same interceptor instance produces identical signatures for the same request (lazy init caches key)', async () => {
    const signatures: string[] = [];
    const next = (r: SerializableRequest) => {
      signatures.push(r.headers['X-HMAC-Signature'][0]);
      return Promise.resolve(okResponse);
    };

    const interceptor = hmacSigningInterceptor({ keyMaterial });
    await interceptor(baseReq, next);
    await interceptor(baseReq, next);
    await interceptor(baseReq, next);

    // All three calls with the same request produce the same signature
    expect(signatures[0]).toEqual(signatures[1]);
    expect(signatures[1]).toEqual(signatures[2]);
  });
});
