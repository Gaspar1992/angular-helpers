import type {
  SerializableRequest,
  SerializableResponse,
  WorkerInterceptorFn,
} from './worker-interceptor.types';

/**
 * Composes multiple worker interceptors into a single `WorkerInterceptorFn`.
 *
 * Interceptors are executed left-to-right, matching Angular's interceptor chain convention.
 * Each interceptor calls `next()` to pass control to the next one.
 *
 * @example
 * ```typescript
 * const pipeline = composeInterceptors(
 *   loggingInterceptor(),
 *   retryInterceptor({ maxRetries: 2 }),
 *   hmacSigningInterceptor({ keyMaterial: key }),
 * );
 *
 * createWorkerPipeline([pipeline]);
 * ```
 */
export function composeInterceptors(...fns: WorkerInterceptorFn[]): WorkerInterceptorFn {
  if (fns.length === 0) {
    return (_req: SerializableRequest, next) => next(_req);
  }

  if (fns.length === 1) {
    return fns[0];
  }

  return (req: SerializableRequest, finalNext) => {
    type Handler = (r: SerializableRequest) => Promise<SerializableResponse>;

    const chain = fns.reduceRight<Handler>(
      (next, interceptor) => (r) => interceptor(r, next),
      (r) => finalNext(r),
    );

    return chain(req);
  };
}
