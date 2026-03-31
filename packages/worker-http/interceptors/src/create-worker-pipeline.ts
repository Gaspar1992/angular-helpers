import type {
  SerializableRequest,
  SerializableResponse,
  WorkerInterceptorFn,
} from './worker-interceptor.types';

/**
 * Creates and registers a worker-side HTTP pipeline.
 *
 * Call this inside a worker file to set up the interceptor chain.
 * The pipeline listens for incoming requests via `postMessage`,
 * runs them through the interceptor chain, executes `fetch()`,
 * and sends the response back.
 *
 * @example
 * ```typescript
 * // workers/secure.worker.ts
 * import { createWorkerPipeline } from '@angular-helpers/worker-http/interceptors';
 * import { hmacSigningInterceptor } from './my-interceptors';
 *
 * createWorkerPipeline([hmacSigningInterceptor]);
 * ```
 */
export function createWorkerPipeline(interceptors: WorkerInterceptorFn[]): void {
  const controllers = new Map<string, AbortController>();

  async function executeFetch(req: SerializableRequest): Promise<SerializableResponse> {
    const controller = controllers.get(req.url) ?? new AbortController();

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
      signal: controller.signal,
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

  type RequestHandler = (req: SerializableRequest) => Promise<SerializableResponse>;

  function buildChain(fns: WorkerInterceptorFn[], finalHandler: RequestHandler): RequestHandler {
    return fns.reduceRight<RequestHandler>(
      (next, interceptor) => (req) => interceptor(req, next),
      finalHandler,
    );
  }

  const chain = buildChain(interceptors, executeFetch);

  self.onmessage = async (event: MessageEvent) => {
    const { type, requestId, payload } = event.data;

    if (type === 'cancel') {
      controllers.get(requestId)?.abort();
      controllers.delete(requestId);
      return;
    }

    if (type === 'request') {
      const controller = new AbortController();
      controllers.set(requestId, controller);

      try {
        const response = await chain(payload as SerializableRequest);
        self.postMessage({ type: 'response', requestId, result: response });
      } catch (error) {
        self.postMessage({
          type: 'error',
          requestId,
          error: {
            message: error instanceof Error ? error.message : String(error),
            name: error instanceof Error ? error.name : 'UnknownError',
            stack: error instanceof Error ? error.stack : undefined,
          },
        });
      } finally {
        controllers.delete(requestId);
      }
    }
  };
}
