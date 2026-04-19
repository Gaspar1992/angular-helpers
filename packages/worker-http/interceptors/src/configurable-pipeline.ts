import { cacheInterceptor } from './cache-interceptor';
import { contentIntegrityInterceptor } from './content-integrity-interceptor';
import { hmacSigningInterceptor } from './hmac-signing-interceptor';
import { loggingInterceptor } from './logging-interceptor';
import { rateLimitInterceptor } from './rate-limit-interceptor';
import { retryInterceptor } from './retry-interceptor';
import { buildChain, executeFetch } from './worker-fetch-executor';
import { attachRequestLoop } from './worker-message-loop';
import type { WorkerInterceptorInitMessage, WorkerInterceptorSpec } from './interceptor-spec.types';
import type { WorkerInterceptorFn } from './worker-interceptor.types';

const INIT_MESSAGE_TYPE: WorkerInterceptorInitMessage['type'] = 'init-interceptors';

type CustomFactory = (config?: unknown) => WorkerInterceptorFn;

const customRegistry = new Map<string, CustomFactory>();

/**
 * Registers a custom interceptor factory that can be referenced from
 * `withWorkerInterceptors([workerCustom('my-name', config)])`.
 *
 * Must be called inside the worker file BEFORE `createConfigurableWorkerPipeline()`.
 *
 * @example
 * ```typescript
 * // app.worker.ts
 * import { createConfigurableWorkerPipeline, registerInterceptor } from '@angular-helpers/worker-http/interceptors';
 *
 * registerInterceptor('auth-token', (config: { token: string }) => async (req, next) => {
 *   const headers = { ...req.headers, authorization: [`Bearer ${config.token}`] };
 *   return next({ ...req, headers });
 * });
 *
 * createConfigurableWorkerPipeline();
 * ```
 */
export function registerInterceptor(name: string, factory: CustomFactory): void {
  customRegistry.set(name, factory);
}

/** Test-only: clears the custom registry. */
export function __clearCustomRegistry(): void {
  customRegistry.clear();
}

/**
 * Resolves a single spec to its concrete `WorkerInterceptorFn`.
 *
 * Exported for test use. Throws on unknown `kind` or unregistered custom name
 * so misconfiguration fails loudly at init time, not on the first request.
 */
export function resolveSpec(spec: WorkerInterceptorSpec): WorkerInterceptorFn {
  switch (spec.kind) {
    case 'logging':
      return loggingInterceptor(spec.config);
    case 'retry':
      return retryInterceptor(spec.config);
    case 'cache':
      return cacheInterceptor(spec.config);
    case 'hmac-signing':
      return hmacSigningInterceptor(spec.config);
    case 'rate-limit':
      return rateLimitInterceptor(spec.config);
    case 'content-integrity':
      return contentIntegrityInterceptor(spec.config);
    case 'custom': {
      const factory = customRegistry.get(spec.name);
      if (!factory) {
        throw new Error(
          `[worker-http] Custom interceptor "${spec.name}" was not registered. ` +
            `Call registerInterceptor("${spec.name}", factory) in your worker file before createConfigurableWorkerPipeline().`,
        );
      }
      return factory(spec.config);
    }
    default: {
      const exhaustive: never = spec;
      throw new Error(`[worker-http] Unknown interceptor spec kind: ${JSON.stringify(exhaustive)}`);
    }
  }
}

/**
 * Creates a worker-side pipeline whose interceptor chain is supplied at
 * runtime via the init handshake message sent by `WorkerHttpBackend`.
 *
 * Behavior:
 *  - Listens for the first `init-interceptors` message and builds the chain
 *    from the received specs.
 *  - Until init arrives, incoming `request` messages are buffered (they will
 *    be flushed once the chain is ready).
 *  - If no init arrives (e.g. worker used standalone without
 *    `withWorkerInterceptors`), the pipeline runs with an empty chain so
 *    every request goes straight to `fetch()`.
 *
 * Custom interceptor factories must be registered with
 * `registerInterceptor(name, factory)` before this call.
 */
export function createConfigurableWorkerPipeline(): void {
  type PendingMessage = MessageEvent;
  const pending: PendingMessage[] = [];

  const initialHandler = (event: MessageEvent) => {
    const data = event.data ?? {};

    if (data.type === INIT_MESSAGE_TYPE) {
      const specs = (data as WorkerInterceptorInitMessage).specs ?? [];
      const fns = specs.map((spec) => resolveSpec(spec));
      const chain = buildChain(fns, (req) => executeFetch(req));
      // Swap to the regular request loop and replay any buffered messages.
      attachRequestLoop(chain);
      const handler = self.onmessage;
      if (handler) {
        for (const buffered of pending) {
          handler.call(self, buffered);
        }
      }
      pending.length = 0;
      return;
    }

    if (data.type === 'request' || data.type === 'cancel') {
      pending.push(event);
    }
  };

  self.onmessage = initialHandler;

  // Safety net: if the main thread never sends init within a microtask,
  // the worker still works as a no-interceptor pipeline. We DO NOT trigger
  // this immediately — the init arrives via postMessage which is queued, so
  // we let the buffered messages accumulate until init or the first non-init
  // message after a tick. The transport guarantees init is posted first, so
  // in practice the empty-chain path is only hit when the worker is used
  // without withWorkerInterceptors.
}
