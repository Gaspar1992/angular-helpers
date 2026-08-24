import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CacheApiTransport } from './cache-api.transport';

describe('CacheApiTransport', () => {
  let mockCache: any;
  let mockCacheStorage: any;
  let cacheStore: Map<string, Response>;
  const passphrase = 'test-cache-secret-passphrase';

  beforeEach(() => {
    cacheStore = new Map();

    mockCache = {
      match: vi.fn().mockImplementation(async (url: string) => {
        const res = cacheStore.get(url);
        if (!res) return undefined;
        // Return cloned response so body can be read multiple times
        return res.clone();
      }),
      put: vi.fn().mockImplementation(async (url: string, response: Response) => {
        cacheStore.set(url, response.clone());
      }),
      delete: vi.fn().mockImplementation(async (url: string) => {
        return cacheStore.delete(url);
      }),
    };

    mockCacheStorage = {
      open: vi.fn().mockResolvedValue(mockCache),
    };

    vi.stubGlobal('caches', mockCacheStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should write and read data back using default cache name', async () => {
    await TestBed.runInInjectionContext(async () => {
      const transport = new CacheApiTransport();
      const payload = { theme: 'dark', fontSize: 14 };

      await transport.write('settings', payload);

      expect(mockCacheStorage.open).toHaveBeenCalledWith('ah_cache');
      const expectedUrl = 'https://angular-helpers.local/storage-cache/settings';
      expect(mockCache.put).toHaveBeenCalled();

      const result = await transport.read<typeof payload>('settings');
      expect(result).toEqual(payload);
    });
  });

  it('should write and read data with custom cacheName and toon serializer option', async () => {
    await TestBed.runInInjectionContext(async () => {
      const transport = new CacheApiTransport();
      const payload = { items: [1, 2, 3] };
      const options = { cacheName: 'custom_cache', serializer: 'toon' as const };

      await transport.write('custom-key', payload, options);
      expect(mockCacheStorage.open).toHaveBeenCalledWith('custom_cache');

      const result = await transport.read<typeof payload>('custom-key', options);
      expect(result).toEqual(payload);
    });
  });

  it('should support encryption when writing and reading with a passphrase', async () => {
    await TestBed.runInInjectionContext(async () => {
      const transport = new CacheApiTransport(passphrase);
      const secretData = { token: 'secret-token-123' };
      const options = { encrypt: true };

      await transport.write('auth', secretData, options);

      // Verify the stored response in cache is encrypted (not plain JSON)
      const storedResponse = cacheStore.get('https://angular-helpers.local/storage-cache/auth');
      expect(storedResponse).toBeDefined();
      const rawText = await storedResponse!.clone().text();
      expect(rawText).not.toContain('secret-token-123');

      // Read back with decryption
      const decrypted = await transport.read<typeof secretData>('auth', options);
      expect(decrypted).toEqual(secretData);
    });
  });

  it('should handle error when encryption is requested but passphrase is missing', async () => {
    await TestBed.runInInjectionContext(async () => {
      const transport = new CacheApiTransport(); // No passphrase
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await transport.write('key-no-pass', { a: 1 }, { encrypt: true });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CacheApiTransport] Error writing key:'),
        'key-no-pass',
        expect.any(Error),
      );

      // Now set raw data in cache to test read branch
      cacheStore.set(
        'https://angular-helpers.local/storage-cache/read-no-pass',
        new Response('encrypted-data'),
      );
      const readResult = await transport.read('read-no-pass', { encrypt: true });
      expect(readResult).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CacheApiTransport] Error reading key:'),
        'read-no-pass',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  it('should return undefined when key is not found in cache', async () => {
    await TestBed.runInInjectionContext(async () => {
      const transport = new CacheApiTransport();
      const result = await transport.read('non-existent');
      expect(result).toBeUndefined();
    });
  });

  it('should delete a cached item', async () => {
    await TestBed.runInInjectionContext(async () => {
      const transport = new CacheApiTransport();
      await transport.write('item-to-delete', { val: 42 });

      await transport.delete('item-to-delete');
      expect(mockCache.delete).toHaveBeenCalledWith(
        'https://angular-helpers.local/storage-cache/item-to-delete',
      );

      const result = await transport.read('item-to-delete');
      expect(result).toBeUndefined();
    });
  });

  it('should handle environment where Cache API is not supported', async () => {
    vi.stubGlobal('caches', undefined);

    await TestBed.runInInjectionContext(async () => {
      const transport = new CacheApiTransport();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const readRes = await transport.read('test');
      expect(readRes).toBeUndefined();

      await transport.write('test', 'value');
      await transport.delete('test');

      consoleSpy.mockRestore();
    });
  });

  it('should handle cache API errors gracefully and log them', async () => {
    mockCache.match.mockRejectedValueOnce(new Error('Match failed'));
    mockCache.put.mockRejectedValueOnce(new Error('Put failed'));
    mockCache.delete.mockRejectedValueOnce(new Error('Delete failed'));

    await TestBed.runInInjectionContext(async () => {
      const transport = new CacheApiTransport();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const readRes = await transport.read('error-key');
      expect(readRes).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CacheApiTransport] Error reading key:'),
        'error-key',
        expect.any(Error),
      );

      await transport.write('error-key', 'data');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CacheApiTransport] Error writing key:'),
        'error-key',
        expect.any(Error),
      );

      await transport.delete('error-key');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CacheApiTransport] Error deleting key:'),
        'error-key',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});
