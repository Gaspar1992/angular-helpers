import type { StorageTransport } from '../storage-transport';
import type { StorageSignalOptions } from '../../interfaces/storage-options.types';
import { encrypt, decrypt } from '../../utils/crypto.utils';
import { serializeData, deserializeData } from '../../utils/serialization.utils';
import { injectPlatform } from '@angular-helpers/core';

export class CacheApiTransport implements StorageTransport {
  private readonly platform = injectPlatform();
  private readonly VIRTUAL_BASE_URL = 'https://angular-helpers.local/storage-cache/';

  constructor(private readonly secretPassphrase?: string) {}

  private getCaches(): CacheStorage | null {
    if (typeof caches !== 'undefined') return caches;
    const globalWindow = this.platform.window;
    if (globalWindow && globalWindow.caches) return globalWindow.caches;
    return null;
  }

  async read<T>(key: string, options?: StorageSignalOptions): Promise<T | undefined> {
    const cacheName = options?.cacheName ?? 'ah_cache';
    const encryptData = options?.encrypt ?? false;
    const useToon = options?.serializer === 'toon';

    try {
      const cacheContext = this.getCaches();
      if (!cacheContext) throw new Error('Cache API is not supported in this environment');

      const cache = await cacheContext.open(cacheName);
      const url = `${this.VIRTUAL_BASE_URL}${key}`;
      const response = await cache.match(url);
      if (!response) return undefined;

      let plainText: string;
      if (encryptData) {
        if (!this.secretPassphrase) throw new Error('Encryption passphrase not provided');
        const cipherText = await response.text();
        plainText = await decrypt(cipherText, this.secretPassphrase);
      } else {
        plainText = await response.text();
      }

      return await deserializeData<T>(plainText, useToon);
    } catch (err) {
      console.error(`[CacheApiTransport] Error reading key:`, key, err);
      return undefined;
    }
  }

  async write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void> {
    const cacheName = options?.cacheName ?? 'ah_cache';
    const encryptData = options?.encrypt ?? false;
    const useToon = options?.serializer === 'toon';

    try {
      const cacheContext = this.getCaches();
      if (!cacheContext) throw new Error('Cache API is not supported in this environment');

      let payload = await serializeData(data, useToon);
      if (encryptData) {
        if (!this.secretPassphrase) throw new Error('Encryption passphrase not provided');
        payload = await encrypt(payload, this.secretPassphrase);
      }

      const cache = await cacheContext.open(cacheName);
      const url = `${this.VIRTUAL_BASE_URL}${key}`;
      const response = new Response(payload, {
        headers: {
          'Content-Type': useToon && !encryptData ? 'application/toon' : 'application/json',
          'X-Storage-Date': new Date().toISOString(),
        },
      });
      await cache.put(url, response);
    } catch (err) {
      console.error(`[CacheApiTransport] Error writing key:`, key, err);
    }
  }

  async delete(key: string, options?: StorageSignalOptions): Promise<void> {
    const cacheName = options?.cacheName ?? 'ah_cache';
    try {
      const cacheContext = this.getCaches();
      if (!cacheContext) return;

      const cache = await cacheContext.open(cacheName);
      const url = `${this.VIRTUAL_BASE_URL}${key}`;
      await cache.delete(url);
    } catch (err) {
      console.error(`[CacheApiTransport] Error deleting key:`, key, err);
    }
  }
}
