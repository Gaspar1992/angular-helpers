import { HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';

import type { SerializableRequest, SerializableResponse } from './worker-http-backend.types';

/**
 * Converts an Angular `HttpRequest` into a structured-clone-safe POJO
 * that can be sent to a web worker via `postMessage`.
 *
 * Notes:
 * - `urlWithParams` is used so query params embedded via `HttpParams` are included.
 * - The `context` field is intentionally left empty: `HttpContext` uses class references
 *   as keys which cannot cross the worker boundary.
 */
export function toSerializableRequest(req: HttpRequest<unknown>): SerializableRequest {
  const headers: Record<string, string[]> = {};
  for (const name of req.headers.keys()) {
    headers[name.toLowerCase()] = req.headers.getAll(name) ?? [];
  }

  const params: Record<string, string[]> = {};
  for (const name of req.params.keys()) {
    params[name] = req.params.getAll(name) ?? [];
  }

  return {
    method: req.method,
    url: req.urlWithParams,
    headers,
    params,
    body: req.body,
    responseType: req.responseType as SerializableRequest['responseType'],
    withCredentials: req.withCredentials,
    context: {},
  };
}

/**
 * Converts a worker `SerializableResponse` back into an Angular `HttpResponse`.
 */
export function toHttpResponse(
  res: SerializableResponse,
  req: HttpRequest<unknown>,
): HttpResponse<unknown> {
  let headers = new HttpHeaders();
  for (const [key, values] of Object.entries(res.headers)) {
    for (const value of values) {
      headers = headers.append(key, value);
    }
  }

  return new HttpResponse({
    body: res.body,
    headers,
    status: res.status,
    statusText: res.statusText,
    url: res.url || req.urlWithParams,
  });
}

/**
 * Matches a URL against a sorted list of `WorkerRoute` rules.
 * Rules with higher `priority` are evaluated first.
 * Returns the matched worker ID or `null` if no rule matches.
 */
export function matchWorkerRoute(
  url: string,
  routes: Array<{ pattern: RegExp | string; worker: string; priority?: number }>,
): string | null {
  const sorted = [...routes].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  for (const route of sorted) {
    const pattern = typeof route.pattern === 'string' ? new RegExp(route.pattern) : route.pattern;
    if (pattern.test(url)) {
      return route.worker;
    }
  }

  return null;
}
