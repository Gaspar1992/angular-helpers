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

  it('decodes large request bodies from ArrayBuffer back to string', async () => {
    const postMessageSpy = vi.fn();
    const mockPort = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      postMessage: postMessageSpy,
    };

    const mockChain = vi.fn(async (req) => {
      return { body: `Echo: ${req.body}`, status: 200, headers: {} };
    });

    const cleanup = attachPortLoop(mockPort as any, mockChain);

    const messageHandler = mockPort.addEventListener.mock.calls[0][1];

    const originalString = 'large-string-content-'.repeat(5000);
    const encoded = new TextEncoder().encode(originalString);

    messageHandler({
      data: {
        type: 'request',
        requestId: 'req-2',
        payload: {
          url: '/api/echo',
          body: encoded.buffer,
          _bodyWasString: true,
        },
      },
    } as MessageEvent);

    await new Promise((resolve) => queueMicrotask(resolve));

    expect(mockChain).toHaveBeenCalledTimes(1);
    const chainArgReq = mockChain.mock.calls[0][0];
    expect(chainArgReq.body).toBe(originalString);
    expect(chainArgReq._bodyWasString).toBeUndefined();

    cleanup();
  });

  it('encodes large string response bodies to ArrayBuffer zero-copy', async () => {
    const postMessageSpy = vi.fn();
    const mockPort = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      postMessage: postMessageSpy,
    };

    const largeResponseString = 'a'.repeat(102400 + 1024);
    const mockChain = vi.fn(async () => {
      return { body: largeResponseString, status: 200, headers: {} };
    });

    const cleanup = attachPortLoop(mockPort as any, mockChain);

    const messageHandler = mockPort.addEventListener.mock.calls[0][1];

    messageHandler({
      data: {
        type: 'request',
        requestId: 'req-3',
        payload: { url: '/api/large' },
      },
    } as MessageEvent);

    await new Promise((resolve) => queueMicrotask(resolve));

    expect(postMessageSpy).toHaveBeenCalledTimes(1);
    const postMessageArg1 = postMessageSpy.mock.calls[0][0];
    const postMessageArg2 = postMessageSpy.mock.calls[0][1];

    expect(postMessageArg1.responses[0].result.body).toBeInstanceOf(ArrayBuffer);
    expect(postMessageArg1.responses[0].result._bodyWasString).toBe(true);
    expect(postMessageArg2).toContain(postMessageArg1.responses[0].result.body);

    cleanup();
  });
});
