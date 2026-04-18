import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  FetchBackend,
  HttpBackend,
  HttpErrorResponse,
  HttpEvent,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { createWorkerTransport } from '@angular-helpers/worker-http/transport';
import type { WorkerTransport } from '@angular-helpers/worker-http/transport';

import {
  WORKER_HTTP_CONFIGS_TOKEN,
  WORKER_HTTP_FALLBACK_TOKEN,
  WORKER_HTTP_INTERCEPTORS_TOKEN,
  WORKER_HTTP_ROUTES_TOKEN,
  WORKER_HTTP_SERIALIZER_TOKEN,
  WORKER_TARGET,
} from './worker-http-tokens';
import type { WorkerInterceptorSpec } from '@angular-helpers/worker-http/interceptors';
import type {
  SerializableRequest,
  SerializableResponse,
  WorkerConfig,
} from './worker-http-backend.types';
import { matchWorkerRoute, toHttpResponse, toSerializableRequest } from './worker-request-adapter';

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

  private readonly transports = new Map<
    string,
    WorkerTransport<SerializableRequest, SerializableResponse>
  >();

  override handle(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    if (typeof Worker === 'undefined') {
      return this.handleFallback(req, 'Web Workers are not available in this environment (SSR)');
    }

    const workerId = req.context.get(WORKER_TARGET) ?? matchWorkerRoute(req.url, this.routes);

    if (!workerId) {
      return this.handleFallback(req, `No worker route matched for URL: ${req.url}`);
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

    return transport.execute(payload).pipe(
      map((res) => toHttpResponse(res as SerializableResponse, req)),
      catchError((err: unknown) =>
        throwError(
          () =>
            new HttpErrorResponse({
              error: err,
              status: 0,
              statusText: 'Worker Error',
              url: req.urlWithParams,
            }),
        ),
      ),
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
      workerFactory: () => new Worker(config.workerUrl, { type: 'module' }),
      maxInstances: config.maxInstances ?? 1,
      initMessage: specs.length > 0 ? { type: 'init-interceptors', specs } : undefined,
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
    reason: string,
  ): Observable<HttpEvent<unknown>> {
    if (this.fallback === 'error' || !this.fetchBackend) {
      return throwError(() => new Error(`[WorkerHttpBackend] ${reason}`));
    }
    return this.fetchBackend.handle(req);
  }
}
