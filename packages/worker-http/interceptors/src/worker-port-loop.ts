import type { RequestHandler } from './worker-fetch-executor';

/**
 * Common loop logic for handling requests/cancellation on a port.
 */
export function attachPortLoop(port: MessagePort | any, chain: RequestHandler): () => void {
  const controllers = new Map<string, AbortController>();

  let responseBuffer: any[] = [];
  let flushScheduled = false;

  function scheduleFlush() {
    if (flushScheduled) return;
    flushScheduled = true;
    queueMicrotask(() => {
      flushScheduled = false;
      if (!responseBuffer.length) return;
      const responses = responseBuffer;
      responseBuffer = [];
      port.postMessage({ type: 'batch-response', responses });
    });
  }

  const processMessage = async (msg: any) => {
    const { type, requestId, payload } = msg;

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
      responseBuffer.push({ type: 'response', requestId, result: response });
      scheduleFlush();
    } catch (error: any) {
      responseBuffer.push({
        type: 'error',
        requestId,
        error: {
          message: error?.message ?? String(error),
          name: error?.name ?? 'UnknownError',
          stack: error?.stack,
        },
      });
      scheduleFlush();
    } finally {
      controllers.delete(requestId);
    }
  };

  const messageHandler = (event: MessageEvent) => {
    const data = event.data ?? {};
    if (data.type === 'batch') {
      for (const msg of data.messages || []) {
        processMessage(msg).catch(console.error);
      }
    } else {
      processMessage(data).catch(console.error);
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
