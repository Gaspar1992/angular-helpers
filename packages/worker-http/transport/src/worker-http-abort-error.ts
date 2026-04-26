/**
 * Thrown by `createWorkerTransport` when a request is aborted via an external
 * `AbortSignal` passed to `execute(request, { signal })`.
 *
 * Distinct from `WorkerHttpTimeoutError` (which fires when the per-request
 * `timeout` elapses) and from a silent unsubscribe (which sends a `cancel`
 * message but does not surface an error to the subscriber, since RxJS already
 * tore down the stream).
 *
 * @example
 * ```typescript
 * const ac = new AbortController();
 * transport.execute(req, { signal: ac.signal }).subscribe({
 *   error: (err) => {
 *     if (err instanceof WorkerHttpAbortError) {
 *       // user-driven cancellation; usually safe to ignore in UI
 *     }
 *   },
 * });
 * ac.abort('user navigated away');
 * ```
 */
export class WorkerHttpAbortError extends Error {
  override readonly name = 'WorkerHttpAbortError';
  /** The reason passed to `AbortController.abort(reason)`, if any. */
  readonly reason: unknown;

  constructor(reason?: unknown) {
    super(
      reason === undefined
        ? 'Worker request aborted'
        : `Worker request aborted: ${reason instanceof Error ? reason.message : String(reason)}`,
    );
    this.reason = reason;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
