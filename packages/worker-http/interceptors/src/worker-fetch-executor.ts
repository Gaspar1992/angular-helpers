import type {
  SerializableRequest,
  SerializableResponse,
  WorkerInterceptorFn,
} from './worker-interceptor.types';

export type RequestHandler = (req: SerializableRequest) => Promise<SerializableResponse>;

/**
 * Composes interceptor functions around a final handler, producing a single
 * `(req) => Promise<resp>` chain. Pure — no side effects.
 */
export function buildChain(
  fns: readonly WorkerInterceptorFn[],
  finalHandler: RequestHandler,
): RequestHandler {
  return fns.reduceRight<RequestHandler>(
    (next, interceptor) => (req) => interceptor(req, next),
    finalHandler,
  );
}

/**
 * Performs the actual `fetch()` call inside the worker, translating the
 * structured-clone-safe `SerializableRequest` into a `Request` and the
 * `Response` back into a `SerializableResponse`.
 *
 * The optional `signal` allows the caller to wire up cancellation via an
 * `AbortController` owned outside of this function.
 */
export async function executeFetch(
  req: SerializableRequest,
  signal?: AbortSignal,
): Promise<SerializableResponse> {
  const headers = new Headers();
  for (const [key, values] of Object.entries(req.headers)) {
    for (const value of values) {
      headers.append(key, value);
    }
  }

  let url = req.url;
  const paramEntries = Object.entries(req.params);
  if (paramEntries.length > 0) {
    const searchParams = new URLSearchParams();
    for (const [key, values] of paramEntries) {
      for (const value of values) {
        searchParams.append(key, value);
      }
    }
    url += (url.includes('?') ? '&' : '?') + searchParams.toString();
  }

  const fetchInit: RequestInit = {
    method: req.method,
    headers,
    credentials: req.withCredentials ? 'include' : 'same-origin',
    signal,
  };

  if (
    req.body !== null &&
    req.body !== undefined &&
    req.method !== 'GET' &&
    req.method !== 'HEAD'
  ) {
    fetchInit.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  const response = await fetch(url, fetchInit);

  const responseHeaders: Record<string, string[]> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = responseHeaders[key] ?? [];
    responseHeaders[key].push(value);
  });

  let body: unknown;
  switch (req.responseType) {
    case 'text':
      body = await response.text();
      break;
    case 'arraybuffer':
      body = await response.arrayBuffer();
      break;
    case 'blob':
      body = await response.blob();
      break;
    default:
      body = await response.json();
  }

  return {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    body,
    url: response.url,
  };
}
