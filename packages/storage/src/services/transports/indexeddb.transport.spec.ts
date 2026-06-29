import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { IndexedDBTransport } from '@angular-helpers/storage/worker';

describe('IndexedDBTransport Caching', () => {
  let transport: IndexedDBTransport;
  let openCount = 0;
  let mockRequest: any;
  let mockDb: any;

  beforeEach(() => {
    openCount = 0;
    mockDb = {
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(true),
      },
      close: vi.fn(),
      onversionchange: null,
      onclose: null,
      onerror: null,
    };
    mockRequest = {
      result: mockDb,
      error: null,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    };

    const mockIndexedDB = {
      open: vi.fn().mockImplementation(() => {
        openCount++;
        setTimeout(() => {
          if (mockRequest.error) {
            if (mockRequest.onerror) {
              mockRequest.onerror();
            }
          } else {
            if (mockRequest.onsuccess) {
              mockRequest.onsuccess();
            }
          }
        }, 0);
        return mockRequest;
      }),
    };

    vi.stubGlobal('indexedDB', mockIndexedDB);
    transport = new IndexedDBTransport();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should cache connection promise and not call indexedDB.open again', async () => {
    const db1Promise = (transport as any).openDB('test-db', 'store-name');
    const db2Promise = (transport as any).openDB('test-db', 'store-name');

    const db1 = await db1Promise;
    const db2 = await db2Promise;

    expect(db1).toBe(mockDb);
    expect(db2).toBe(mockDb);
    expect(openCount).toBe(1);
  });

  it('should evict from cache on connection error', async () => {
    mockRequest.error = new Error('Connection failed');

    await expect((transport as any).openDB('test-db', 'store-name')).rejects.toThrow(
      'Connection failed',
    );
    expect(openCount).toBe(1);

    // Reset error so second attempt succeeds
    mockRequest.error = null;
    const db = await (transport as any).openDB('test-db', 'store-name');
    expect(db).toBe(mockDb);
    expect(openCount).toBe(2);
  });

  it('should evict from cache and close db when onversionchange is triggered', async () => {
    const db = await (transport as any).openDB('test-db', 'store-name');
    expect(openCount).toBe(1);

    // Trigger versionchange
    if (mockDb.onversionchange) {
      mockDb.onversionchange();
    }

    expect(mockDb.close).toHaveBeenCalled();

    // Opening again should call indexedDB.open
    const db2 = await (transport as any).openDB('test-db', 'store-name');
    expect(db2).toBe(mockDb);
    expect(openCount).toBe(2);
  });

  it('should evict from cache when onclose is triggered', async () => {
    const db = await (transport as any).openDB('test-db', 'store-name');
    expect(openCount).toBe(1);

    // Trigger close
    if (mockDb.onclose) {
      mockDb.onclose();
    }

    // Opening again should call indexedDB.open
    const db2 = await (transport as any).openDB('test-db', 'store-name');
    expect(db2).toBe(mockDb);
    expect(openCount).toBe(2);
  });

  it('should evict from cache and close db when onerror is triggered', async () => {
    const db = await (transport as any).openDB('test-db', 'store-name');
    expect(openCount).toBe(1);

    // Trigger error
    if (mockDb.onerror) {
      mockDb.onerror();
    }

    expect(mockDb.close).toHaveBeenCalled();

    // Opening again should call indexedDB.open
    const db2 = await (transport as any).openDB('test-db', 'store-name');
    expect(db2).toBe(mockDb);
    expect(openCount).toBe(2);
  });
});
