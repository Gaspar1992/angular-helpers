/**
 * Thrown by `createWorkerTransport` when a request exceeds its configured
 * `requestTimeout`. Consumers can `instanceof`-check this error to distinguish
 * timeout rejections from transport/worker errors.
 *
 * @example
 * ```typescript
 * transport.execute(req).subscribe({
 *   error: (err) => {
 *     if (err instanceof WorkerHttpTimeoutError) {
 *       // dedicated timeout handling
 *     }
 *   },
 * });
 * ```
 */
export class WorkerHttpTimeoutError extends Error {
  override readonly name = 'WorkerHttpTimeoutError';
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Worker request timed out after ${timeoutMs} ms`);
    this.timeoutMs = timeoutMs;
    // Maintain a proper prototype chain across TS transpile targets.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
