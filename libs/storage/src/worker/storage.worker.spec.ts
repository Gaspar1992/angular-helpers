import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('StorageWorker', () => {
  let postedMessages: any[] = [];
  let broadcastMessages: any[] = [];
  let syncChannelInstance: any;

  beforeEach(async () => {
    postedMessages = [];
    broadcastMessages = [];

    (globalThis as any).postMessage = vi.fn((msg) => {
      postedMessages.push(msg);
    });

    class MockBroadcastChannel {
      name: string;
      onmessage: any = null;
      constructor(name: string) {
        this.name = name;
        syncChannelInstance = this;
      }
      postMessage(data: any) {
        broadcastMessages.push(data);
      }
      close() {}
    }

    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);

    const mockDB = {
      objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          get: vi.fn(() => {
            const req: any = {
              result: JSON.stringify({ workerData: 123 }),
              onsuccess: null,
              onerror: null,
            };
            setTimeout(() => req.onsuccess?.(), 0);
            return req;
          }),
          put: vi.fn(() => {
            const req: any = { onsuccess: null, onerror: null };
            setTimeout(() => req.onsuccess?.(), 0);
            return req;
          }),
          delete: vi.fn(() => {
            const req: any = { onsuccess: null, onerror: null };
            setTimeout(() => req.onsuccess?.(), 0);
            return req;
          }),
        }),
      }),
      close: vi.fn(),
    };

    vi.stubGlobal('indexedDB', {
      open: vi.fn().mockImplementation(() => {
        const req: any = {
          result: mockDB,
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
        };
        setTimeout(() => req.onsuccess?.(), 0);
        return req;
      }),
    });

    vi.resetModules();
    await import('./storage.worker');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should handle read action and post response message', async () => {
    const onmessage = (globalThis as any).onmessage;
    expect(typeof onmessage).toBe('function');

    await onmessage({
      data: {
        type: 'read',
        requestId: 'req-1',
        key: 'test-key',
      },
    } as MessageEvent);

    expect(postedMessages).toContainEqual(
      expect.objectContaining({
        type: 'response',
        requestId: 'req-1',
      }),
    );
  });

  it('should handle write action, post response, and broadcast change', async () => {
    const onmessage = (globalThis as any).onmessage;

    await onmessage({
      data: {
        type: 'write',
        requestId: 'req-2',
        key: 'write-key',
        payload: { saved: true },
      },
    } as MessageEvent);

    expect(postedMessages).toContainEqual({
      type: 'response',
      requestId: 'req-2',
    });

    expect(broadcastMessages).toContainEqual({
      key: 'write-key',
      payload: { saved: true },
    });
  });

  it('should handle delete action, post response, and broadcast null change', async () => {
    const onmessage = (globalThis as any).onmessage;

    await onmessage({
      data: {
        type: 'delete',
        requestId: 'req-3',
        key: 'delete-key',
      },
    } as MessageEvent);

    expect(postedMessages).toContainEqual({
      type: 'response',
      requestId: 'req-3',
    });

    expect(broadcastMessages).toContainEqual({
      key: 'delete-key',
      payload: null,
    });
  });

  it('should handle unknown worker action and post error message', async () => {
    const onmessage = (globalThis as any).onmessage;

    await onmessage({
      data: {
        type: 'unknown-action' as any,
        requestId: 'req-err',
      },
    } as MessageEvent);

    expect(postedMessages).toContainEqual({
      type: 'error',
      requestId: 'req-err',
      error: expect.stringContaining('Unknown worker action'),
    });
  });

  it('should forward broadcast channel sync events to main thread as change messages', () => {
    expect(syncChannelInstance).toBeDefined();
    expect(typeof syncChannelInstance.onmessage).toBe('function');

    syncChannelInstance.onmessage({
      data: {
        key: 'external-tab-key',
        payload: 'synced-val',
      },
    } as MessageEvent);

    expect(postedMessages).toContainEqual({
      type: 'change',
      key: 'external-tab-key',
      payload: 'synced-val',
    });
  });
});
