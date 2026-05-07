import type { RequestHandler } from './worker-fetch-executor';

/**
 * Common loop logic for handling requests/cancellation on a port.
 */
export function attachPortLoop(port: MessagePort | any, chain: RequestHandler): () => void {
  const controllers = new Map<string, AbortController>();

  const messageHandler = async (event: MessageEvent) => {
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
      const response = await chain(payload, controller.signal);
      port.postMessage({ type: 'response', requestId, result: response });
    } catch (error: any) {
      port.postMessage({
        type: 'error',
        requestId,
        error: {
          message: error?.message ?? String(error),
          name: error?.name ?? 'UnknownError',
          stack: error?.stack,
        },
      });
    } finally {
      controllers.delete(requestId);
    }
  };

  port.addEventListener('message', messageHandler as any);

  return () => {
    port.removeEventListener('message', messageHandler as any);
    for (const controller of controllers.values()) {
      controller.abort();
    }
    controllers.clear();
  };
}
