/**
 * Telemetry hooks for `WorkerHttpBackend`.
 *
 * Extension point for APM integrations (Sentry, Datadog, OpenTelemetry,
 * ad-hoc metrics). Fires on the main thread, synchronously, at three
 * lifecycle points of every HTTP request that reaches
 * `WorkerHttpBackend`:
 *
 * - `onRequest` — after worker resolution / fallback decision, BEFORE
 *   dispatch.
 * - `onResponse` — when a successful response is returned from the worker
 *   (or the fallback `FetchBackend`).
 * - `onError` — when the request fails in transport or surfaces as a
 *   non-2xx `HttpErrorResponse`.
 *
 * Subscribers are invoked inside a try/catch — a throwing or misbehaving
 * subscriber is isolated from the HTTP request and from every other
 * subscriber. Telemetry errors are logged via `console.error` and
 * swallowed.
 *
 * Multiple subscribers are supported via a multi-provider DI token.
 * Register with `withTelemetry(...)`; every call appends one subscriber.
 */

/**
 * How a request was dispatched.
 *
 * - `'worker'` — dispatched to a worker from the pool.
 * - `'fallback-fetch'` — dispatched to the main-thread `FetchBackend`
 *   (SSR context, no matching route, unknown worker with `'main-thread'`
 *   fallback strategy).
 */
export type WorkerHttpTransportKind = 'worker' | 'fallback-fetch';

/**
 * Base shape shared by every telemetry event.
 */
export interface WorkerHttpTelemetryEventBase {
  /** Stable id unique to this request within the process. Correlates all three events. */
  readonly requestId: string;
  /** HTTP method (`'GET'`, `'POST'`, ...). */
  readonly method: string;
  /** URL without query params, as Angular sees it. */
  readonly url: string;
  /** URL with query params baked in. */
  readonly urlWithParams: string;
  /** Worker id that served the request. `null` when routed to fallback fetch. */
  readonly workerId: string | null;
  /** How the request was actually dispatched. */
  readonly transport: WorkerHttpTransportKind;
  /** `performance.now()` value at emission time. */
  readonly timestamp: number;
}

/** Fires before the request is dispatched. */
export interface WorkerHttpRequestEvent extends WorkerHttpTelemetryEventBase {
  readonly kind: 'request';
}

/** Fires when a successful response is returned. */
export interface WorkerHttpResponseEvent extends WorkerHttpTelemetryEventBase {
  readonly kind: 'response';
  readonly status: number;
  readonly durationMs: number;
}

/** Fires when the request fails. */
export interface WorkerHttpErrorEvent extends WorkerHttpTelemetryEventBase {
  readonly kind: 'error';
  readonly error: unknown;
  readonly durationMs: number;
}

/**
 * Telemetry subscriber — all callbacks are optional.
 */
export interface WorkerHttpTelemetry {
  onRequest?(event: WorkerHttpRequestEvent): void;
  onResponse?(event: WorkerHttpResponseEvent): void;
  onError?(event: WorkerHttpErrorEvent): void;
}
