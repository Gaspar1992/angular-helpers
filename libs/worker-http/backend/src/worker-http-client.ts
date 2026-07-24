import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';

import { WORKER_HTTP_SIGNAL, WORKER_HTTP_TIMEOUT, WORKER_TARGET } from './worker-http-tokens';

/**
 * Options accepted by `WorkerHttpClient` methods.
 * Identical to `HttpClient` options with an optional `worker` field added.
 */
export interface WorkerRequestOptions {
  /** Target worker ID. Overrides URL-pattern routing for this specific request. */
  worker?: string | null;
  /**
   * External `AbortSignal`. When it fires, the backend posts a `cancel` to
   * the worker and the request errors with `WorkerHttpAbortError` (wrapped in
   * `HttpErrorResponse`). Useful with `AbortController` or
   * `takeUntilDestroyed()`.
   */
  signal?: AbortSignal;
  /**
   * Per-request timeout in milliseconds. Overrides the transport-level
   * `requestTimeout` for this single call. On expiry the request errors with
   * `WorkerHttpTimeoutError`. `0` or non-finite disables the timeout for this
   * request only.
   */
  timeout?: number;
  context?: HttpContext;
  headers?: Record<string, string | string[]>;
  params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>;
  responseType?: 'json';
  withCredentials?: boolean;
  observe?: 'body';
  reportProgress?: boolean;
  transferCache?:
    | {
        includeHeaders?: string[];
      }
    | boolean;
}

/**
 * Convenience wrapper over `HttpClient` that adds an optional `{ worker }` field
 * to every method. Under the hood it sets `WORKER_TARGET` on the `HttpContext` —
 * the caller never has to touch the context manually.
 *
 * Usage is identical to `HttpClient` — just inject `WorkerHttpClient` instead.
 *
 * @example
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class DataService {
 *   private readonly http = inject(WorkerHttpClient);
 *
 *   getUsers(): Observable<User[]> {
 *     return this.http.get<User[]>('/api/users'); // auto-routed by URL pattern
 *   }
 *
 *   getSensitiveReport(): Observable<Report> {
 *     return this.http.get<Report>('/api/secure/reports', { worker: 'secure' });
 *   }
 * }
 * ```
 */
@Injectable()
export class WorkerHttpClient {
  private readonly http = inject(HttpClient);

  get<T>(url: string, options?: WorkerRequestOptions): Observable<T> {
    return this.http.get<T>(url, this.withWorker(options));
  }

  post<T>(url: string, body: unknown, options?: WorkerRequestOptions): Observable<T> {
    return this.http.post<T>(url, body, this.withWorker(options));
  }

  put<T>(url: string, body: unknown, options?: WorkerRequestOptions): Observable<T> {
    return this.http.put<T>(url, body, this.withWorker(options));
  }

  patch<T>(url: string, body: unknown, options?: WorkerRequestOptions): Observable<T> {
    return this.http.patch<T>(url, body, this.withWorker(options));
  }

  delete<T>(url: string, options?: WorkerRequestOptions): Observable<T> {
    return this.http.delete<T>(url, this.withWorker(options));
  }

  head<T>(url: string, options?: WorkerRequestOptions): Observable<T> {
    return this.http.head<T>(url, this.withWorker(options));
  }

  private withWorker(
    options?: WorkerRequestOptions,
  ): Omit<WorkerRequestOptions, 'worker' | 'signal' | 'timeout'> & { context: HttpContext } {
    const { worker = null, signal, timeout, context, ...rest } = options ?? {};
    let ctx = (context ?? new HttpContext()).set(WORKER_TARGET, worker);
    if (signal !== undefined) {
      ctx = ctx.set(WORKER_HTTP_SIGNAL, signal);
    }
    if (timeout !== undefined) {
      ctx = ctx.set(WORKER_HTTP_TIMEOUT, timeout);
    }
    return { ...rest, context: ctx };
  }
}
