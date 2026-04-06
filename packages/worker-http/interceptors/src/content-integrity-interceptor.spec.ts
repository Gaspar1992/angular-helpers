import { describe, it, expect } from 'vitest';
import { contentIntegrityInterceptor } from './content-integrity-interceptor';
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

async function sha256Hex(str: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function makeResponse(body: unknown, hashHeader?: string): SerializableResponse {
  return {
    status: 200,
    statusText: 'OK',
    headers: hashHeader ? { 'x-content-hash': [hashHeader] } : {},
    body,
    url: req.url,
  };
}

describe('contentIntegrityInterceptor', () => {
  it('passes through when no hash header is present and requireHash is false (default)', async () => {
    const interceptor = contentIntegrityInterceptor();
    const response = makeResponse({ id: 1 });
    const next = () => Promise.resolve(response);

    const result = await interceptor(req, next);

    expect(result.status).toBe(200);
  });

  it('throws when hash header is absent and requireHash is true', async () => {
    const interceptor = contentIntegrityInterceptor({ requireHash: true });
    const next = () => Promise.resolve(makeResponse({ id: 1 }));

    await expect(interceptor(req, next)).rejects.toMatchObject({ status: 0 });
  });

  it('passes through when hash matches', async () => {
    const body = { id: 1 };
    const expectedHash = await sha256Hex(JSON.stringify(body));
    const interceptor = contentIntegrityInterceptor();
    const next = () => Promise.resolve(makeResponse(body, expectedHash));

    const result = await interceptor(req, next);

    expect(result.status).toBe(200);
  });

  it('throws integrity error when hash does not match', async () => {
    const interceptor = contentIntegrityInterceptor();
    const next = () => Promise.resolve(makeResponse({ id: 1 }, 'deadbeef00000000'));

    await expect(interceptor(req, next)).rejects.toMatchObject({ status: 0 });
  });

  it('uses custom header name from config', async () => {
    const body = { id: 1 };
    const expectedHash = await sha256Hex(JSON.stringify(body));
    const response: SerializableResponse = {
      status: 200,
      statusText: 'OK',
      headers: { 'x-integrity': [expectedHash] },
      body,
      url: req.url,
    };
    const interceptor = contentIntegrityInterceptor({ headerName: 'x-integrity' });
    const next = () => Promise.resolve(response);

    const result = await interceptor(req, next);

    expect(result.status).toBe(200);
  });

  it('passes when response body is empty string and hash matches', async () => {
    const body = '';
    const expectedHash = await sha256Hex('');
    const interceptor = contentIntegrityInterceptor();
    const next = () => Promise.resolve(makeResponse(body, expectedHash));

    const result = await interceptor(req, next);

    expect(result.status).toBe(200);
  });
});
