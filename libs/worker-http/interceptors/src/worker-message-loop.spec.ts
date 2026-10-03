import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { attachRequestLoop } from './worker-message-loop';

vi.mock('./worker-port-loop', () => ({
  attachPortLoop: vi.fn().mockReturnValue(vi.fn()),
}));

import { attachPortLoop } from './worker-port-loop';

describe('worker-message-loop', () => {
  const originalSelf = globalThis.self;

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('attaches to Dedicated Worker self when onconnect is not present', () => {
    const mockSelf = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      postMessage: vi.fn(),
    };
    (globalThis as any).self = mockSelf;

    const mockChain = vi.fn() as any;
    const dispose = attachRequestLoop(mockChain);

    expect(attachPortLoop).toHaveBeenCalledWith(mockSelf, mockChain);
    expect(typeof dispose).toBe('function');
    dispose();
  });

  it('attaches connect listener in Shared Worker when onconnect is in self', () => {
    let connectHandler: ((event: any) => void) | null = null;
    const mockPort = {
      start: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const mockSelf = {
      onconnect: null,
      addEventListener: vi.fn((event: string, handler: any) => {
        if (event === 'connect') connectHandler = handler;
      }),
      removeEventListener: vi.fn(),
    };
    (globalThis as any).self = mockSelf;

    const mockChain = vi.fn() as any;
    const dispose = attachRequestLoop(mockChain);

    expect(mockSelf.addEventListener).toHaveBeenCalledWith('connect', expect.any(Function));

    // Simulate connection event
    connectHandler?.({ ports: [mockPort] });

    expect(attachPortLoop).toHaveBeenCalledWith(mockPort, mockChain);
    expect(mockPort.start).toHaveBeenCalled();

    dispose();
    expect(mockSelf.removeEventListener).toHaveBeenCalledWith('connect', expect.any(Function));
  });
});
