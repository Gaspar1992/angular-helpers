import { detectTransferables } from '@angular-helpers/worker-http/transport';
import {
  needsPolyfill,
  serializeStreamToPort,
} from '@angular-helpers/worker-http/streams-polyfill';

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

      const activePolyfill = needsPolyfill();

      const responseTransferables: Transferable[] = [];

      for (const res of responses) {
        if (res.type === 'response' && res.result) {
          if (typeof res.result.body === 'string') {
            const bodyStr = res.result.body;
            if (typeof TextEncoder !== 'undefined') {
              const encoded = new TextEncoder().encode(bodyStr);
              if (encoded.byteLength > 102400) {
                res.result.body = encoded.buffer;
                res.result._bodyWasString = true;
                responseTransferables.push(encoded.buffer);
              }
            }
          }

          if (
            activePolyfill &&
            res.result.body &&
            typeof ReadableStream !== 'undefined' &&
            res.result.body instanceof ReadableStream
          ) {
            const streamPort = serializeStreamToPort(res.result.body);
            res.result.body = { __isStreamPolyfillPort: true, port: streamPort };
          }
        }
      }

      const transferables = [
        ...new Set([
          ...responseTransferables,
          ...responses.flatMap((res) => {
            if (res.type === 'response' && res.result) {
              const body = res.result.body;
              if (body && typeof body === 'object' && '__isStreamPolyfillPort' in body) {
                return [body.port];
              }
              return detectTransferables(body);
            }
            return [];
          }),
        ]),
      ];

      port.postMessage({ type: 'batch-response', responses }, transferables);
    });
  }

  const processMessage = async (msg: any) => {
    const { type, requestId, payload } = msg;

    if (type === 'ping') {
      port.postMessage({ type: 'pong', requestId });
      return;
    }

    if (type === 'cancel') {
      controllers.get(requestId)?.abort();
      controllers.delete(requestId);
      return;
    }

    if (type !== 'request') {
      return;
    }

    const finalPayload = payload;
    if (finalPayload && typeof finalPayload === 'object') {
      if (finalPayload._bodyWasString && finalPayload.body instanceof ArrayBuffer) {
        if (typeof TextDecoder !== 'undefined') {
          finalPayload.body = new TextDecoder().decode(finalPayload.body);
        }
        delete finalPayload._bodyWasString;
      }
    }

    const controller = new AbortController();
    controllers.set(requestId, controller);

    try {
      const response = await chain(finalPayload, controller.signal);
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
        // oxlint-disable-next-line no-console
        processMessage(msg).catch(console.error);
      }
    } else {
      // oxlint-disable-next-line no-console
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
