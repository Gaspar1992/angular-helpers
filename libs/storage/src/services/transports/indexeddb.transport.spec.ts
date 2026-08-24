import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { IndexedDBTransport } from '@angular-helpers/storage/worker';

describe('IndexedDBTransport', () => {
  let transport: IndexedDBTransport;
  let openCount = 0;
  let mockRequest: any;
  let mockDb: any;
  let objectStoreData: Map<string, any>;
  let mockStore: any;
  let mockTx: any;
  const passphrase = 'test-idb-secret-passphrase';

  beforeEach(() => {
    openCount = 0;
    objectStoreData = new Map();

    mockStore = {
      get: vi.fn((key: string) => {
        const req: any = {
          result: objectStoreData.get(key),
          onsuccess: null,
          onerror: null,
        };
        setTimeout(() => req.onsuccess?.(), 0);
        return req;
      }),
      put: vi.fn((val: any, key: string) => {
        objectStoreData.set(key, val);
        const req: any = {
          onsuccess: null,
          onerror: null,
        };
        setTimeout(() => req.onsuccess?.(), 0);
        return req;
      }),
      delete: vi.fn((key: string) => {
        objectStoreData.delete(key);
        const req: any = {
          onsuccess: null,
          onerror: null,
        };
        setTimeout(() => req.onsuccess?.(), 0);
        return req;
      }),
    };

    mockTx = {
      objectStore: vi.fn().mockReturnValue(mockStore),
    };

    mockDb = {
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(true),
      },
      createObjectStore: vi.fn(),
      transaction: vi.fn().mockReturnValue(mockTx),
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
          if (mockRequest.onupgradeneeded) {
            mockRequest.onupgradeneeded();
          }
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
    transport = new IndexedDBTransport(passphrase);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Connection & Caching', () => {
    it('should cache connection promise and not call indexedDB.open again', async () => {
      const db1Promise = (transport as any).openDB('test-db', 'store-name');
      const db2Promise = (transport as any).openDB('test-db', 'store-name');

      const db1 = await db1Promise;
      const db2 = await db2Promise;

      expect(db1).toBe(mockDb);
      expect(db2).toBe(mockDb);
      expect(openCount).toBe(1);
    });

    it('should create object store on upgrade if it does not exist', async () => {
      mockDb.objectStoreNames.contains.mockReturnValue(false);

      await (transport as any).openDB('new-db', 'new-store');

      expect(mockDb.createObjectStore).toHaveBeenCalledWith('new-store');
    });

    it('should evict from cache on connection error', async () => {
      mockRequest.error = new Error('Connection failed');

      await expect((transport as any).openDB('test-db', 'store-name')).rejects.toThrow(
        'Connection failed',
      );
      expect(openCount).toBe(1);

      mockRequest.error = null;
      const db = await (transport as any).openDB('test-db', 'store-name');
      expect(db).toBe(mockDb);
      expect(openCount).toBe(2);
    });

    it('should evict from cache and close db when onversionchange is triggered', async () => {
      const db = await (transport as any).openDB('test-db', 'store-name');
      expect(openCount).toBe(1);

      if (mockDb.onversionchange) {
        mockDb.onversionchange();
      }

      expect(mockDb.close).toHaveBeenCalled();

      const db2 = await (transport as any).openDB('test-db', 'store-name');
      expect(db2).toBe(mockDb);
      expect(openCount).toBe(2);
    });

    it('should evict from cache when onclose is triggered', async () => {
      const db = await (transport as any).openDB('test-db', 'store-name');
      expect(openCount).toBe(1);

      if (mockDb.onclose) {
        mockDb.onclose();
      }

      const db2 = await (transport as any).openDB('test-db', 'store-name');
      expect(db2).toBe(mockDb);
      expect(openCount).toBe(2);
    });

    it('should evict from cache and close db when onerror is triggered', async () => {
      const db = await (transport as any).openDB('test-db', 'store-name');
      expect(openCount).toBe(1);

      if (mockDb.onerror) {
        mockDb.onerror();
      }

      expect(mockDb.close).toHaveBeenCalled();

      const db2 = await (transport as any).openDB('test-db', 'store-name');
      expect(db2).toBe(mockDb);
      expect(openCount).toBe(2);
    });
  });

  describe('Read, Write, Delete Operations', () => {
    it('should write and read data back', async () => {
      const data = { id: 101, name: 'Product A' };
      await transport.write('prod_101', data);

      expect(mockTx.objectStore).toHaveBeenCalledWith('kv');
      const retrieved = await transport.read<typeof data>('prod_101');
      expect(retrieved).toEqual(data);
    });

    it('should return undefined when reading non-existing key', async () => {
      const retrieved = await transport.read('non_existing');
      expect(retrieved).toBeUndefined();
    });

    it('should delete existing key', async () => {
      await transport.write('temp_key', 'temp_val');
      await transport.delete('temp_key');

      const retrieved = await transport.read('temp_key');
      expect(retrieved).toBeUndefined();
    });

    it('should support encryption and decryption', async () => {
      const secret = { ssn: '000-11-2222' };
      await transport.write('sensitive', secret, { encrypt: true });

      // Raw value in store should be encrypted string
      const rawStored = objectStoreData.get('sensitive');
      expect(typeof rawStored).toBe('string');
      expect(rawStored).not.toContain('000-11-2222');

      const decrypted = await transport.read<typeof secret>('sensitive', { encrypt: true });
      expect(decrypted).toEqual(secret);
    });

    it('should handle missing passphrase when encryption is requested on read or write', async () => {
      const noSecretTransport = new IndexedDBTransport(); // No passphrase
      await noSecretTransport.write('enc_key', { a: 1 }, { encrypt: true });

      objectStoreData.set('enc_key', 'encrypted-text');
      const result = await noSecretTransport.read('enc_key', { encrypt: true });
      expect(result).toBeUndefined();
    });

    it('should handle read request error gracefully', async () => {
      mockStore.get = vi.fn(() => {
        const req: any = {
          error: new Error('Read failed'),
          onsuccess: null,
          onerror: null,
        };
        setTimeout(() => req.onerror?.(), 0);
        return req;
      });

      const result = await transport.read('err_key');
      expect(result).toBeUndefined();
    });

    it('should handle write request error gracefully without throwing', async () => {
      mockStore.put = vi.fn(() => {
        const req: any = {
          error: new Error('Quota exceeded'),
          onsuccess: null,
          onerror: null,
        };
        setTimeout(() => req.onerror?.(), 0);
        return req;
      });

      await expect(transport.write('quota_key', 'data')).resolves.toBeUndefined();
    });

    it('should handle delete request error gracefully without throwing', async () => {
      mockStore.delete = vi.fn(() => {
        const req: any = {
          error: new Error('Delete failed'),
          onsuccess: null,
          onerror: null,
        };
        setTimeout(() => req.onerror?.(), 0);
        return req;
      });

      await expect(transport.delete('del_key')).resolves.toBeUndefined();
    });

    it('should return undefined or do nothing when indexedDB is undefined (SSR fallback)', async () => {
      vi.stubGlobal('indexedDB', undefined);
      const ssrTransport = new IndexedDBTransport();

      expect(await ssrTransport.read('key')).toBeUndefined();
      await expect(ssrTransport.write('key', 'val')).resolves.toBeUndefined();
      await expect(ssrTransport.delete('key')).resolves.toBeUndefined();
    });
  });
});
