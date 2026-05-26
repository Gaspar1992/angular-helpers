import { StorageTransport } from '../storage-transport';
import { StorageSignalOptions } from '../../interfaces/storage-options.types';
import { encrypt, decrypt } from '../../utils/crypto.utils';
import { serializeData, deserializeData } from '../../utils/serialization.utils';
import { injectPlatform } from '@angular-helpers/core';

export class WebStorageTransport implements StorageTransport {
  private readonly platform = injectPlatform();

  constructor(private readonly secretPassphrase?: string) {}

  async read<T>(key: string, options?: StorageSignalOptions): Promise<T | undefined> {
    if (!this.platform.isBrowser || !this.platform.window) {
      return undefined;
    }

    const globalWindow = this.platform.window;
    const storageType = options?.storageType ?? 'local';
    const encryptData = options?.encrypt ?? false;
    const useToon = options?.serializer === 'toon';
    const storage =
      storageType === 'session' ? globalWindow.sessionStorage : globalWindow.localStorage;

    const raw = storage.getItem(key);
    if (raw === null) return undefined;

    try {
      if (encryptData) {
        if (!this.secretPassphrase) throw new Error('Encryption passphrase not provided');
        const plainText = await decrypt(raw, this.secretPassphrase);
        return await deserializeData<T>(plainText, useToon);
      }
      return await deserializeData<T>(raw, useToon);
    } catch (err) {
      console.error(`[WebStorageTransport] Error reading key:`, key, err);
      return undefined;
    }
  }

  async write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void> {
    if (!this.platform.isBrowser || !this.platform.window) {
      return;
    }

    const globalWindow = this.platform.window;
    const storageType = options?.storageType ?? 'local';
    const encryptData = options?.encrypt ?? false;
    const useToon = options?.serializer === 'toon';
    const storage =
      storageType === 'session' ? globalWindow.sessionStorage : globalWindow.localStorage;

    try {
      let payload = await serializeData(data, useToon);

      if (encryptData) {
        if (!this.secretPassphrase) throw new Error('Encryption passphrase not provided');
        payload = await encrypt(payload, this.secretPassphrase);
      }

      storage.setItem(key, payload);
    } catch (err) {
      console.error(`[WebStorageTransport] Error writing key:`, key, err);
    }
  }

  async delete(key: string, options?: StorageSignalOptions): Promise<void> {
    if (!this.platform.isBrowser || !this.platform.window) return;

    const globalWindow = this.platform.window;
    const storageType = options?.storageType ?? 'local';
    const storage =
      storageType === 'session' ? globalWindow.sessionStorage : globalWindow.localStorage;
    storage.removeItem(key);
  }

  onChange<T>(key: string, callback: (value: T) => void): () => void {
    if (!this.platform.isBrowser || !this.platform.window) return () => {};

    const globalWindow = this.platform.window;
    const listener = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          // Note: cross-tab sync usually doesn't know if toon was used for the remote update
          // without additional metadata. For now we assume default JSON or toon if configured.
          deserializeData<T>(event.newValue).then((val) => callback(val));
        } catch {
          // Ignore failed parsing
        }
      }
    };

    globalWindow.addEventListener('storage', listener);
    return () => globalWindow.removeEventListener('storage', listener);
  }
}
