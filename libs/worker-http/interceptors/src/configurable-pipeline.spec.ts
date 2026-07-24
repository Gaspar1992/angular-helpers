import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __clearCustomRegistry,
  createConfigurableWorkerPipeline,
  registerInterceptor,
  resolveSpec,
} from './configurable-pipeline';
import type { WorkerInterceptorSpec } from './interceptor-spec.types';
import type { WorkerInterceptorFn } from './worker-interceptor.types';

describe('resolveSpec', () => {
  afterEach(() => {
    __clearCustomRegistry();
  });

  it('resolves built-in specs to functions', () => {
    const builtins: WorkerInterceptorSpec[] = [
      { kind: 'logging' },
      { kind: 'retry' },
      { kind: 'cache' },
      { kind: 'rate-limit' },
      { kind: 'content-integrity' },
      { kind: 'hmac-signing', config: { keyMaterial: new Uint8Array([1, 2, 3]) } },
    ];

    for (const spec of builtins) {
      const fn = resolveSpec(spec);
      expect(typeof fn).toBe('function');
      expect(fn.length).toBe(2); // (req, next)
    }
  });

  it('resolves custom specs through the registry', async () => {
    const passthrough: WorkerInterceptorFn = async (req, next) => next(req);
    const factory = vi.fn((_config?: unknown) => passthrough);
    registerInterceptor('my-custom', factory);

    const fn = resolveSpec({ kind: 'custom', name: 'my-custom', config: { foo: 1 } });
    expect(typeof fn).toBe('function');
    expect(factory).toHaveBeenCalledWith({ foo: 1 });
  });

  it('throws a clear error when a custom spec name is not registered', () => {
    expect(() => resolveSpec({ kind: 'custom', name: 'unknown', config: undefined })).toThrowError(
      /Custom interceptor "unknown" was not registered/,
    );
  });

  it('throws when the spec kind is unknown', () => {
    expect(() => resolveSpec({ kind: 'bogus' } as unknown as WorkerInterceptorSpec)).toThrowError(
      /Unknown interceptor spec kind/,
    );
  });
});

describe('createConfigurableWorkerPipeline', () => {
  let originalOnMessage: any;
  let originalAddEventListener: any;
  let originalDispatchEvent: any;
  let originalRemoveEventListener: any;
  let originalPostMessage: any;

  let mockListeners: Set<Function>;

  beforeEach(() => {
    mockListeners = new Set();
    originalOnMessage = self.onmessage;
    originalAddEventListener = self.addEventListener;
    originalDispatchEvent = self.dispatchEvent;
    originalRemoveEventListener = self.removeEventListener;
    originalPostMessage = self.postMessage;

    self.onmessage = null;
    self.postMessage = vi.fn();
    self.addEventListener = vi.fn((type: string, listener: any) => {
      if (type === 'message') {
        mockListeners.add(listener);
      }
    }) as any;
    self.removeEventListener = vi.fn((type: string, listener: any) => {
      if (type === 'message') {
        mockListeners.delete(listener);
      }
    }) as any;
    self.dispatchEvent = vi.fn((event: any) => {
      for (const listener of mockListeners) {
        listener(event);
      }
      return true;
    }) as any;
  });

  afterEach(() => {
    self.onmessage = originalOnMessage;
    self.addEventListener = originalAddEventListener;
    self.dispatchEvent = originalDispatchEvent;
    self.removeEventListener = originalRemoveEventListener;
    self.postMessage = originalPostMessage;
  });

  it('buffers messages before init and replays them upon init', async () => {
    createConfigurableWorkerPipeline();

    expect(self.onmessage).toBeTypeOf('function');
    const initialHandler = self.onmessage!;

    // Send a regular request message - it should be buffered
    const reqEvent = new MessageEvent('message', {
      data: { type: 'request', requestId: '1', payload: { url: '/api/test' } },
    });
    initialHandler(reqEvent);

    // Verify it wasn't processed yet (no event listeners called)
    expect(self.dispatchEvent).not.toHaveBeenCalled();

    // Send the initialization handshake
    const initEvent = new MessageEvent('message', {
      data: {
        type: 'init-interceptors',
        specs: [],
      },
    });
    initialHandler(initEvent);

    // self.onmessage must be cleared
    expect(self.onmessage).toBeNull();

    // self.dispatchEvent must have been called with the buffered request
    expect(self.dispatchEvent).toHaveBeenCalledWith(reqEvent);
  });
});
