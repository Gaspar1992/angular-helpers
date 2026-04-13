import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';

import { WORKER_TARGET } from './worker-http-tokens';

/**
 * Options accepted by `WorkerHttpClient` methods.
 * Identical to `HttpClient` options with an optional `worker` field added.
 */
export interface WorkerRequestOptions {
  /** Target worker ID. Overrides URL-pattern routing for this specific request. */
  worker?: string | null;
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
  ): Omit<WorkerRequestOptions, 'worker'> & { context: HttpContext } {
    const { worker = null, context, ...rest } = options ?? {};
    return {
      ...rest,
      context: (context ?? new HttpContext()).set(WORKER_TARGET, worker),
    };
  }
}
