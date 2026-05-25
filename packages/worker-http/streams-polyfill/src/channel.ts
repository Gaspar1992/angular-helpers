/**
 * MessagePort-based canalization utility for ReadableStreams.
 * Allows transparently transferring streams over `postMessage` in environments
 * that lack native transferable streams support (like Safari < 18).
 *
 * Implements a bidirectional Acknowledgment (Ack) protocol to strictly respect
 * Web Streams backpressure across the thread boundary, avoiding RAM bloating
 * and Event Loop starvation.
 */

/**
 * Serializes a native or ponyfilled `ReadableStream` into a `MessagePort`.
 * Spawns a message channel, reads chunks progressively, and pauses after each
 * chunk until the receiver acknowledges it is ready for more.
 *
 * @param stream - The ReadableStream to pipe.
 * @returns The remote MessagePort (port2) to be transferred.
 */
export function serializeStreamToPort(stream: ReadableStream): MessagePort {
  const channel = new MessageChannel();
  const port1 = channel.port1;
  const port2 = channel.port2;

  const reader = stream.getReader();
  let ackResolve: (() => void) | null = null;
  let cancelled = false;

  // Set up synchronization channel
  port1.onmessage = (event) => {
    const data = event.data ?? {};
    const { type } = data;
    if (type === 'ack') {
      ackResolve?.();
    } else if (type === 'cancel') {
      cancelled = true;
      reader.cancel(data.reason).catch(() => {});
      port1.close();
    }
  };

  const pump = async () => {
    try {
      // Wait for the initial ready acknowledgment from the receiver's start() callback
      await new Promise<void>((resolve) => {
        ackResolve = resolve;
      });

      while (true) {
        if (cancelled) break;

        const { done, value } = await reader.read();

        if (done) {
          port1.postMessage({ type: 'close' });
          port1.close();
          break;
        }

        // Optimization: if chunk carries a transferable ArrayBuffer, transfer it.
        const transferables: Transferable[] = [];
        if (
          value &&
          typeof value === 'object' &&
          'buffer' in (value as any) &&
          (value as any).buffer instanceof ArrayBuffer
        ) {
          transferables.push((value as any).buffer);
        } else if (value instanceof ArrayBuffer) {
          transferables.push(value);
        }

        // Setup the ack promise before posting the message to avoid race conditions
        const ackPromise = new Promise<void>((resolve) => {
          ackResolve = resolve;
        });

        port1.postMessage({ type: 'chunk', value }, transferables);

        // Block pump execution until the client pulls and acknowledges receipt (backpressure)
        await ackPromise;
      }
    } catch (err: any) {
      port1.postMessage({
        type: 'error',
        error: {
          message: err?.message ?? String(err),
          name: err?.name ?? 'StreamError',
        },
      });
      port1.close();
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // Safe to ignore if already released/errored
      }
    }
  };

  // Run the pump asynchronously in the background.
  pump().catch((err) => {
    // oxlint-disable-next-line no-console
    console.error('[worker-http] Stream pump background error:', err);
  });

  return port2;
}

/**
 * Deserializes a `MessagePort` back into a `ReadableStream`.
 *
 * Enforces backpressure by delaying the `{ type: 'ack' }` handshake signal
 * if the internal stream controller queue becomes full, resuming only when the
 * consumer pulls more data.
 *
 * @param port - The transferred MessagePort (port2).
 * @returns A ReadableStream yielding chunks from the port.
 */
export function deserializePortToStream(port: MessagePort): ReadableStream {
  port.start();

  let ackDeferred = false;

  return new ReadableStream({
    start(controller) {
      port.onmessage = (event) => {
        const data = event.data ?? {};
        const { type, value, error } = data;

        if (type === 'chunk') {
          try {
            controller.enqueue(value);

            // Backpressure: if stream queue has space, acknowledge immediately.
            // Otherwise, defer the acknowledgment until the reader calls pull().
            const desiredSize = controller.desiredSize ?? 0;
            if (desiredSize > 0) {
              port.postMessage({ type: 'ack' });
            } else {
              ackDeferred = true;
            }
          } catch {
            port.close();
          }
        } else if (type === 'close') {
          try {
            controller.close();
          } catch {
            // Ignore
          }
          port.close();
        } else if (type === 'error') {
          try {
            controller.error(new Error(error?.message ?? 'Transferred stream error'));
          } catch {
            // Ignore
          }
          port.close();
        }
      };

      port.onmessageerror = () => {
        try {
          controller.error(new Error('Stream MessagePort message deserialization error'));
        } catch {
          // Ignore
        }
        port.close();
      };

      // Send initial acknowledgment to start the sender pump loop
      port.postMessage({ type: 'ack' });
    },
    pull(controller) {
      // The browser's stream engine calls pull() when the consumer reads a chunk
      // and the queue drops below its highWaterMark.
      // If we deferred the acknowledgment due to a full queue, send it now to resume the pump!
      if (ackDeferred) {
        ackDeferred = false;
        port.postMessage({ type: 'ack' });
      }
    },
    cancel(reason) {
      port.postMessage({ type: 'cancel', reason: String(reason) });
      port.close();
    },
  });
}
