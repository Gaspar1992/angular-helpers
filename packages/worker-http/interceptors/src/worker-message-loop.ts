import type { RequestHandler } from './worker-fetch-executor';
import type { SerializableRequest } from './worker-interceptor.types';

/**
 * Wires up the worker's `self.onmessage` handler around a built request chain.
 *
 * Owns the per-request `AbortController` map for cancellation support. Posts
 * `response` / `error` messages back to the main thread.
 *
 * Returns a disposer that restores `self.onmessage` to whatever it was before
 * (mainly useful for the configurable pipeline, which swaps the handler when
 * receiving the init message).
 */
export function attachRequestLoop(chain: RequestHandler): () => void {
  const controllers = new Map<string, AbortController>();
  const previous = self.onmessage;

  self.onmessage = async (event: MessageEvent) => {
    const { type, requestId, payload } = event.data ?? {};

    if (type === 'cancel') {
      controllers.get(requestId)?.abort();
      controllers.delete(requestId);
      return;
    }

    if (type !== 'request') {
      return;
    }

    const controller = new AbortController();
    controllers.set(requestId, controller);

    try {
      const response = await chain(payload as SerializableRequest, controller.signal);
      self.postMessage({ type: 'response', requestId, result: response });
    } catch (error) {
      self.postMessage({
        type: 'error',
        requestId,
        error: {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : 'UnknownError',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
    } finally {
      controllers.delete(requestId);
    }
  };

  return () => {
    self.onmessage = previous;
    for (const controller of controllers.values()) {
      controller.abort();
    }
    controllers.clear();
  };
}
