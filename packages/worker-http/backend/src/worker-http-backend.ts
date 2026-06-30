import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  FetchBackend,
  HttpBackend,
  HttpErrorResponse,
  HttpEvent,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { createWorkerTransport } from '@angular-helpers/worker-http/transport';
import type { WorkerTransport } from '@angular-helpers/worker-http/transport';

import {
  WORKER_HTTP_CONFIGS_TOKEN,
  WORKER_HTTP_FALLBACK_TOKEN,
  WORKER_HTTP_INTERCEPTORS_TOKEN,
  WORKER_HTTP_ROUTES_TOKEN,
  WORKER_HTTP_SERIALIZER_TOKEN,
  WORKER_HTTP_SIGNAL,
  WORKER_HTTP_STREAMS_POLYFILL_TOKEN,
  WORKER_HTTP_TELEMETRY_TOKEN,
  WORKER_HTTP_TIMEOUT,
  WORKER_TARGET,
  WORKER_HTTP_MIN_PAYLOAD_SIZE_TOKEN,
} from './worker-http-tokens';
import type { WorkerInterceptorSpec } from '@angular-helpers/worker-http/interceptors';
import type { WorkerSerializer } from '@angular-helpers/worker-http/serializer';
import type {
  SerializableRequest,
  SerializableResponse,
  WorkerConfig,
} from './worker-http-backend.types';
import type {
  WorkerHttpErrorEvent,
  WorkerHttpRequestEvent,
  WorkerHttpResponseEvent,
  WorkerHttpTelemetry,
  WorkerHttpTelemetryEventBase,
  WorkerHttpTransportKind,
} from './worker-http-telemetry';
import { matchWorkerRoute, toHttpResponse, toSerializableRequest } from './worker-request-adapter';

let telemetryRequestCounter = 0;
function nextTelemetryRequestId(): string {
  telemetryRequestCounter = (telemetryRequestCounter + 1) >>> 0;
  return `whttp-${telemetryRequestCounter.toString(36)}`;
}

function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

// Helper to estimate body size in bytes
export function getRequestBodySize(body: unknown, serializer?: WorkerSerializer | null): number {
  if (body === null || body === undefined) {
    return 0;
  }

  try {
    if (typeof body === 'string') {
      return typeof TextEncoder !== 'undefined'
        ? new TextEncoder().encode(body).byteLength
        : body.length; // fallback
    }
    if (body instanceof Blob) {
      return body.size;
    }
    if (body instanceof ArrayBuffer) {
      return body.byteLength;
    }
    if (ArrayBuffer.isView(body)) {
      return body.byteLength;
    }
    if (body instanceof URLSearchParams) {
      const str = body.toString();
      return typeof TextEncoder !== 'undefined'
        ? new TextEncoder().encode(str).byteLength
        : str.length;
    }
    if (body instanceof FormData) {
      let total = 0;
      body.forEach((value, key) => {
        total +=
          typeof TextEncoder !== 'undefined'
            ? new TextEncoder().encode(key).byteLength
            : key.length;
        if (value instanceof Blob) {
          total += value.size;
        } else if (typeof value === 'string') {
          total +=
            typeof TextEncoder !== 'undefined'
              ? new TextEncoder().encode(value).byteLength
              : value.length;
        }
      });
      return total;
    }
    if (typeof body === 'object') {
      if (serializer) {
        const serialized = serializer.serialize(body).data;
        if (typeof serialized === 'string') {
          return typeof TextEncoder !== 'undefined'
            ? new TextEncoder().encode(serialized).byteLength
            : serialized.length;
        }
        return getRequestBodySize(serialized, null);
      }
      const json = JSON.stringify(body);
      return typeof TextEncoder !== 'undefined'
        ? new TextEncoder().encode(json).byteLength
        : json.length;
    }
  } catch {
    // If anything fails (e.g., circular references in JSON.stringify),
    // return Infinity to guarantee it's routed to the worker.
    return Infinity;
  }

  return 0;
}

/**
 * Angular `HttpBackend` replacement that routes HTTP requests to web workers.
 *
 * Registered via `provideWorkerHttpClient()`. Not meant to be used directly.
 *
 * Flow per request:
 * 1. Check SSR: if `Worker` is undefined → fallback strategy
 * 2. Resolve target worker ID from `WORKER_TARGET` context or URL-pattern routing
 * 3. Serialize `HttpRequest` → `SerializableRequest` (structured-clone safe)
 * 4. Dispatch to the worker's `WorkerTransport`
 * 5. Deserialize `SerializableResponse` → `HttpResponse`
 */
@Injectable()
export class WorkerHttpBackend extends HttpBackend implements OnDestroy {
  private readonly configs = inject(WORKER_HTTP_CONFIGS_TOKEN);
  private readonly routes = inject(WORKER_HTTP_ROUTES_TOKEN);
  private readonly fallback = inject(WORKER_HTTP_FALLBACK_TOKEN);
  private readonly serializer = inject(WORKER_HTTP_SERIALIZER_TOKEN);
  private readonly interceptorSpecs = inject(WORKER_HTTP_INTERCEPTORS_TOKEN);
  private readonly fetchBackend = inject(FetchBackend, { optional: true });
  private readonly telemetry = inject(WORKER_HTTP_TELEMETRY_TOKEN);
  private readonly streamsPolyfill = inject(WORKER_HTTP_STREAMS_POLYFILL_TOKEN);
  private readonly minPayloadSize = inject(WORKER_HTTP_MIN_PAYLOAD_SIZE_TOKEN, { optional: true });

  private readonly transports = new Map<
    string,
    WorkerTransport<SerializableRequest, SerializableResponse>
  >();

  override handle(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    if (typeof Worker === 'undefined') {
      return this.handleFallback(
        req,
        null,
        'Web Workers are not available in this environment (SSR)',
      );
    }

    const workerId = req.context.get(WORKER_TARGET) ?? matchWorkerRoute(req.url, this.routes);

    if (!workerId) {
      return this.handleFallback(req, null, `No worker route matched for URL: ${req.url}`);
    }

    // Check if we should bypass the worker based on the payload size threshold
    let bypassWorker = false;
    if (this.minPayloadSize !== null && this.fallback === 'main-thread') {
      const hasExplicitTarget = req.context.get(WORKER_TARGET) !== null;
      if (!hasExplicitTarget) {
        const isGetOrHead = req.method === 'GET' || req.method === 'HEAD';
        if (isGetOrHead) {
          const matchesRoute = matchWorkerRoute(req.url, this.routes) !== null;
          if (!matchesRoute) {
            bypassWorker = true;
          }
        } else {
          const bodySize = getRequestBodySize(req.body, this.serializer);
          if (bodySize < this.minPayloadSize) {
            bypassWorker = true;
          }
        }
      }
    }

    if (bypassWorker) {
      return this.handleFallback(
        req,
        workerId,
        `Request payload size is below the threshold of ${this.minPayloadSize} bytes. Bypassing worker.`,
      );
    }

    const config = this.configs.find((c) => c.id === workerId);

    if (!config) {
      return throwError(
        () =>
          new Error(
            `[WorkerHttpBackend] Unknown worker id: "${workerId}". ` +
              `Register it via withWorkerConfigs([{ id: "${workerId}", workerUrl: ... }]).`,
          ),
      );
    }

    const transport = this.getOrCreateTransport(config);
    const serializable = toSerializableRequest(req);

    const body =
      this.serializer !== null && serializable.body !== null && serializable.body !== undefined
        ? this.serializer.serialize(serializable.body).data
        : serializable.body;
    const payload = body !== serializable.body ? { ...serializable, body } : serializable;

    const base = this.buildEventBase(req, workerId, 'worker');
    this.emitRequest(base);

    const signal = req.context.get(WORKER_HTTP_SIGNAL) ?? undefined;
    const timeout = req.context.get(WORKER_HTTP_TIMEOUT);
    const executeOptions =
      signal !== undefined || timeout !== null
        ? { signal, timeout: timeout ?? undefined }
        : undefined;

    return transport.execute(payload, executeOptions).pipe(
      map((res) => toHttpResponse(res as SerializableResponse, req)),
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.emitResponse(base, event.status);
        }
      }),
      catchError((err: unknown) => {
        const httpError = new HttpErrorResponse({
          error: err,
          status: 0,
          statusText: 'Worker Error',
          url: req.urlWithParams,
        });
        this.emitError(base, httpError);
        return throwError(() => httpError);
      }),
    );
  }

  ngOnDestroy(): void {
    for (const transport of this.transports.values()) {
      transport.terminate();
    }
    this.transports.clear();
  }

  private getOrCreateTransport(
    config: WorkerConfig,
  ): WorkerTransport<SerializableRequest, SerializableResponse> {
    const existing = this.transports.get(config.id);
    if (existing) return existing;

    const specs = this.resolveSpecsFor(config.id);

    const transport = createWorkerTransport<SerializableRequest, SerializableResponse>({
      workerFactory: () => {
        if (config.mode === 'shared') {
          return new SharedWorker(config.workerUrl, {
            type: 'module',
            name: config.name ?? config.id,
          });
        }
        return new Worker(config.workerUrl, { type: 'module' });
      },
      mode: config.mode,
      sharedWorkerName: config.name ?? config.id,
      maxInstances: config.maxInstances ?? 1,
      initMessage: specs.length > 0 ? { type: 'init-interceptors', specs } : undefined,
      streamsPolyfill: this.streamsPolyfill,
    });

    this.transports.set(config.id, transport);
    return transport;
  }

  private resolveSpecsFor(workerId: string): readonly WorkerInterceptorSpec[] {
    const wildcard = this.interceptorSpecs['*'] ?? [];
    const specific = this.interceptorSpecs[workerId] ?? [];
    if (wildcard.length === 0) return specific;
    if (specific.length === 0) return wildcard;
    return [...wildcard, ...specific];
  }

  private handleFallback(
    req: HttpRequest<unknown>,
    workerId: string | null,
    reason: string,
  ): Observable<HttpEvent<unknown>> {
    if (this.fallback === 'error' || !this.fetchBackend) {
      return throwError(() => new Error(`[WorkerHttpBackend] ${reason}`));
    }

    const base = this.buildEventBase(req, workerId, 'fallback-fetch');
    this.emitRequest(base);

    return this.fetchBackend.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.emitResponse(base, event.status);
        }
      }),
      catchError((err: unknown) => {
        this.emitError(base, err);
        return throwError(() => err);
      }),
    );
  }

  // --- Telemetry ---------------------------------------------------------

  private buildEventBase(
    req: HttpRequest<unknown>,
    workerId: string | null,
    transport: WorkerHttpTransportKind,
  ): WorkerHttpTelemetryEventBase {
    return {
      requestId: nextTelemetryRequestId(),
      method: req.method,
      url: req.url,
      urlWithParams: req.urlWithParams,
      workerId,
      transport,
      timestamp: now(),
    };
  }

  private emitRequest(base: WorkerHttpTelemetryEventBase): void {
    if (this.telemetry.length === 0) return;
    const event: WorkerHttpRequestEvent = { ...base, kind: 'request' };
    this.dispatch((sub) => sub.onRequest?.(event));
  }

  private emitResponse(base: WorkerHttpTelemetryEventBase, status: number): void {
    if (this.telemetry.length === 0) return;
    const event: WorkerHttpResponseEvent = {
      ...base,
      kind: 'response',
      status,
      durationMs: now() - base.timestamp,
      timestamp: now(),
    };
    this.dispatch((sub) => sub.onResponse?.(event));
  }

  private emitError(base: WorkerHttpTelemetryEventBase, error: unknown): void {
    if (this.telemetry.length === 0) return;
    const event: WorkerHttpErrorEvent = {
      ...base,
      kind: 'error',
      error,
      durationMs: now() - base.timestamp,
      timestamp: now(),
    };
    this.dispatch((sub) => sub.onError?.(event));
  }

  private dispatch(invoke: (subscriber: WorkerHttpTelemetry) => void): void {
    for (const subscriber of this.telemetry) {
      try {
        invoke(subscriber);
      } catch (telemetryError) {
        // A throwing telemetry subscriber must never affect the HTTP request.
        // oxlint-disable-next-line no-console -- defensive log when user-provided telemetry throws
        console.error('[WorkerHttpBackend] telemetry subscriber threw:', telemetryError);
      }
    }
  }
}
