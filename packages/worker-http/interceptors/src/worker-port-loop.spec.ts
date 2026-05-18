import { describe, expect, it, vi } from 'vitest';

import { attachPortLoop } from './worker-port-loop';

describe('attachPortLoop', () => {
  it('detects and transfers response body transferables zero-copy', async () => {
    const postMessageSpy = vi.fn();
    const mockPort = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      postMessage: postMessageSpy,
    };

    const buffer = new ArrayBuffer(8);
    const mockChain = vi.fn(async () => {
      return { body: buffer, status: 200, headers: {} };
    });

    const cleanup = attachPortLoop(mockPort as any, mockChain);

    // Call the listener registered by attachPortLoop
    expect(mockPort.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    const messageHandler = mockPort.addEventListener.mock.calls[0][1];

    // Simulate sending a request
    messageHandler({
      data: {
        type: 'request',
        requestId: 'req-1',
        payload: { url: '/api/bin' },
      },
    } as MessageEvent);

    // Wait for the microtask to flush the buffer
    await new Promise((resolve) => queueMicrotask(resolve));

    expect(postMessageSpy).toHaveBeenCalledTimes(1);
    const postMessageArg1 = postMessageSpy.mock.calls[0][0];
    const postMessageArg2 = postMessageSpy.mock.calls[0][1];

    expect(postMessageArg1.type).toBe('batch-response');
    expect(postMessageArg1.responses[0].requestId).toBe('req-1');
    expect(postMessageArg1.responses[0].result.body).toBe(buffer);

    // Verify that the ArrayBuffer is included in the transferables list
    expect(postMessageArg2).toContain(buffer);

    cleanup();
  });
});
