import { HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { matchWorkerRoute, toHttpResponse, toSerializableRequest } from './worker-request-adapter';
import type { SerializableResponse } from './worker-http-backend.types';

const baseUrl = 'https://api.example.com/users';

function makeSerializableResponse(
  partial: Partial<SerializableResponse> = {},
): SerializableResponse {
  return {
    status: 200,
    statusText: 'OK',
    headers: {},
    body: null,
    url: baseUrl,
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// toSerializableRequest
// ---------------------------------------------------------------------------

describe('toSerializableRequest', () => {
  it('converts method and url', () => {
    const req = new HttpRequest('GET', baseUrl);
    const result = toSerializableRequest(req);

    expect(result.method).toBe('GET');
    expect(result.url).toBe(baseUrl);
  });

  it('includes url with params when HttpParams are set', () => {
    const params = new HttpParams({ fromObject: { page: '1', limit: '20' } });
    const req = new HttpRequest('GET', baseUrl, { params });
    const result = toSerializableRequest(req);

    expect(result.url).toContain('page=1');
    expect(result.url).toContain('limit=20');
  });

  it('converts headers to Record<string, string[]>', () => {
    const headers = new HttpHeaders({
      Authorization: 'Bearer token123',
      'X-Custom': 'value',
    });
    const req = new HttpRequest('GET', baseUrl, { headers });
    const result = toSerializableRequest(req);

    expect(result.headers['authorization']).toEqual(['Bearer token123']);
    expect(result.headers['x-custom']).toEqual(['value']);
  });

  it('converts params to Record<string, string[]>', () => {
    const params = new HttpParams({ fromObject: { ids: ['1', '2', '3'] } });
    const req = new HttpRequest('GET', baseUrl, { params });
    const result = toSerializableRequest(req);

    expect(result.params['ids']).toEqual(['1', '2', '3']);
  });

  it('preserves body for POST requests', () => {
    const body = { name: 'Alice', age: 30 };
    const req = new HttpRequest('POST', baseUrl, body);
    const result = toSerializableRequest(req);

    expect(result.body).toEqual(body);
    expect(result.method).toBe('POST');
  });

  it('sets body to null for GET requests', () => {
    const req = new HttpRequest('GET', baseUrl);
    const result = toSerializableRequest(req);

    expect(result.body).toBeNull();
  });

  it('preserves responseType', () => {
    const req = new HttpRequest('GET', baseUrl, { responseType: 'text' });
    const result = toSerializableRequest(req);

    expect(result.responseType).toBe('text');
  });

  it('defaults responseType to json', () => {
    const req = new HttpRequest('GET', baseUrl);
    const result = toSerializableRequest(req);

    expect(result.responseType).toBe('json');
  });

  it('preserves withCredentials flag', () => {
    const req = new HttpRequest('GET', baseUrl, { withCredentials: true });
    const result = toSerializableRequest(req);

    expect(result.withCredentials).toBe(true);
  });

  it('always sets context to empty object (not transferable via postMessage)', () => {
    const req = new HttpRequest('GET', baseUrl);
    const result = toSerializableRequest(req);

    expect(result.context).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// toHttpResponse
// ---------------------------------------------------------------------------

describe('toHttpResponse', () => {
  it('maps status and statusText correctly', () => {
    const req = new HttpRequest('GET', baseUrl);
    const res = makeSerializableResponse({ status: 201, statusText: 'Created' });
    const result = toHttpResponse(res, req);

    expect(result.status).toBe(201);
    expect(result.statusText).toBe('Created');
  });

  it('maps response body', () => {
    const req = new HttpRequest('GET', baseUrl);
    const body = [{ id: 1, name: 'Alice' }];
    const res = makeSerializableResponse({ body });
    const result = toHttpResponse(res, req);

    expect(result.body).toEqual(body);
  });

  it('maps response url', () => {
    const req = new HttpRequest('GET', baseUrl);
    const res = makeSerializableResponse({ url: 'https://api.example.com/users?redirected=true' });
    const result = toHttpResponse(res, req);

    expect(result.url).toBe('https://api.example.com/users?redirected=true');
  });

  it('falls back to request url when response url is empty', () => {
    const req = new HttpRequest('GET', baseUrl);
    const res = makeSerializableResponse({ url: '' });
    const result = toHttpResponse(res, req);

    expect(result.url).toBe(baseUrl);
  });

  it('converts multi-value headers', () => {
    const req = new HttpRequest('GET', baseUrl);
    const res = makeSerializableResponse({
      headers: {
        'content-type': ['application/json'],
        'set-cookie': ['a=1; Path=/', 'b=2; Path=/'],
      },
    });
    const result = toHttpResponse(res, req);

    expect(result.headers.get('content-type')).toBe('application/json');
    expect(result.headers.getAll('set-cookie')).toEqual(['a=1; Path=/', 'b=2; Path=/']);
  });

  it('returns an HttpResponse with an empty body for 204 No Content', () => {
    const req = new HttpRequest('DELETE', baseUrl);
    const res = makeSerializableResponse({ status: 204, statusText: 'No Content', body: null });
    const result = toHttpResponse(res, req);

    expect(result.status).toBe(204);
    expect(result.body).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// matchWorkerRoute
// ---------------------------------------------------------------------------

describe('matchWorkerRoute', () => {
  const routes = [
    { pattern: /\/api\/secure\//, worker: 'secure', priority: 10 },
    { pattern: /\/api\//, worker: 'public', priority: 1 },
  ];

  it('returns null when no routes are provided', () => {
    expect(matchWorkerRoute('https://api.example.com/data', [])).toBeNull();
  });

  it('returns null when no route matches', () => {
    expect(matchWorkerRoute('https://cdn.example.com/image.png', routes)).toBeNull();
  });

  it('matches the highest-priority route first', () => {
    const url = 'https://api.example.com/api/secure/reports';
    expect(matchWorkerRoute(url, routes)).toBe('secure');
  });

  it('falls through to lower-priority route when high-priority does not match', () => {
    const url = 'https://api.example.com/api/public/users';
    expect(matchWorkerRoute(url, routes)).toBe('public');
  });

  it('accepts string patterns (converted to RegExp)', () => {
    const stringRoutes = [{ pattern: '/api/', worker: 'public', priority: 0 }];
    expect(matchWorkerRoute('https://api.example.com/api/data', stringRoutes)).toBe('public');
  });

  it('handles routes without explicit priority (default 0)', () => {
    const noPriorityRoutes = [
      { pattern: /\/api\//, worker: 'public' },
      { pattern: /\/secure\//, worker: 'secure' },
    ];
    expect(matchWorkerRoute('https://api.example.com/api/data', noPriorityRoutes)).toBe('public');
  });

  it('returns the first match when priorities are equal', () => {
    const samePriorityRoutes = [
      { pattern: /\/first\//, worker: 'first', priority: 5 },
      { pattern: /\/second\//, worker: 'second', priority: 5 },
    ];
    expect(matchWorkerRoute('https://api.example.com/first/data', samePriorityRoutes)).toBe(
      'first',
    );
  });

  it('does not mutate the original routes array', () => {
    const original = [
      { pattern: /\/b\//, worker: 'b', priority: 1 },
      { pattern: /\/a\//, worker: 'a', priority: 2 },
    ];
    const copy = [...original];
    matchWorkerRoute('https://api.example.com/a/data', original);

    expect(original).toEqual(copy);
  });
});
