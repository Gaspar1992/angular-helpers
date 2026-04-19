import { buildChain, executeFetch } from './worker-fetch-executor';
import { attachRequestLoop } from './worker-message-loop';
import type { WorkerInterceptorFn } from './worker-interceptor.types';

/**
 * Creates and registers a worker-side HTTP pipeline.
 *
 * Call this inside a worker file to set up the interceptor chain.
 * The pipeline listens for incoming requests via `postMessage`,
 * runs them through the interceptor chain, executes `fetch()`,
 * and sends the response back.
 *
 * For a runtime-configurable variant whose chain is built from specs sent
 * from the main thread, use `createConfigurableWorkerPipeline()` instead.
 *
 * @example
 * ```typescript
 * // workers/secure.worker.ts
 * import { createWorkerPipeline, hmacSigningInterceptor } from '@angular-helpers/worker-http/interceptors';
 *
 * createWorkerPipeline([hmacSigningInterceptor({ keyMaterial })]);
 * ```
 */
export function createWorkerPipeline(interceptors: WorkerInterceptorFn[]): void {
  const chain = buildChain(interceptors, (req) => executeFetch(req));
  attachRequestLoop(chain);
}
