// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { ReadableStream, MessageChannel } from 'web-streams-polyfill';

if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = ReadableStream as any;
}
if (typeof globalThis.MessageChannel === 'undefined') {
  globalThis.MessageChannel = MessageChannel as any;
}

import { serializeStreamToPort, deserializePortToStream } from './channel';

describe('MessagePort Stream Channel', () => {
  it('should transfer stream chunks successfully over MessagePort', async () => {
    // 1. Create a readable stream with some test chunks
    const testChunks = [new Uint8Array([1, 2]), new Uint8Array([3, 4])];
    let chunkIndex = 0;

    const sourceStream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (chunkIndex < testChunks.length) {
          controller.enqueue(testChunks[chunkIndex++]);
        } else {
          controller.close();
        }
      },
    });

    // 2. Serialize to port
    const port = serializeStreamToPort(sourceStream);

    // 3. Deserialize back to stream
    const targetStream = deserializePortToStream(port);

    // 4. Read from target stream and assert chunks
    const reader = targetStream.getReader();
    const resultChunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) resultChunks.push(value);
    }

    expect(resultChunks).toHaveLength(2);
    expect(Array.from(resultChunks[0])).toEqual([1, 2]);
    expect(Array.from(resultChunks[1])).toEqual([3, 4]);
  });

  it('should propagate stream errors over MessagePort', async () => {
    const errorMsg = 'Simulated stream error';

    const sourceStream = new ReadableStream({
      start(controller) {
        controller.error(new Error(errorMsg));
      },
    });

    const port = serializeStreamToPort(sourceStream);
    const targetStream = deserializePortToStream(port);
    const reader = targetStream.getReader();

    await expect(reader.read()).rejects.toThrow(errorMsg);
  });

  it('should close the port when the stream is cancelled by reader', async () => {
    const cancelReason = 'Reader cancelled';
    const closeSpy = vi.fn();

    const sourceStream = new ReadableStream({
      start(controller) {
        controller.enqueue('chunk');
      },
    });

    const port = serializeStreamToPort(sourceStream);

    // Intercept port.close
    const originalClose = port.close;
    port.close = function (this: any) {
      closeSpy();
      return originalClose.apply(this);
    };

    const targetStream = deserializePortToStream(port);
    const reader = targetStream.getReader();

    await reader.cancel(cancelReason);

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should enforce backpressure by waiting for reader to pull', async () => {
    let pullCount = 0;
    const testChunks = ['chunk1', 'chunk2', 'chunk3'];

    const sourceStream = new ReadableStream({
      pull(controller) {
        if (pullCount < testChunks.length) {
          controller.enqueue(testChunks[pullCount++]);
        } else {
          controller.close();
        }
      },
    });

    const port = serializeStreamToPort(sourceStream);

    // Create target stream
    const targetStream = deserializePortToStream(port);
    const reader = targetStream.getReader();

    // Give time for initial ready + first chunk to be pumped
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Pumping should be blocked waiting for reader to pull 'chunk1'.
    // Therefore, sourceStream pullCount should not have completed all chunks (should be <= 2)
    expect(pullCount).toBeLessThanOrEqual(2);

    // Now we read the first chunk. This should free the queue and trigger pull(), resuming the pump.
    const first = await reader.read();
    expect(first.value).toBe('chunk1');

    // Give time for pump to resume
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Next chunk should be available
    const second = await reader.read();
    expect(second.value).toBe('chunk2');

    // Complete the rest
    const third = await reader.read();
    expect(third.value).toBe('chunk3');

    const final = await reader.read();
    expect(final.done).toBe(true);
  });
});
