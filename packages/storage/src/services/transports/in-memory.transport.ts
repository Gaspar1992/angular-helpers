import { StorageTransport } from '../storage-transport';
import { StorageSignalOptions } from '../../interfaces/storage-options.types';
import { encrypt, decrypt } from '../../utils/crypto.utils';
import { serializeData, deserializeData } from '../../utils/serialization.utils';

export class InMemoryStorageTransport implements StorageTransport {
  private readonly store = new Map<string, string>();
  private readonly listeners = new Map<string, Set<(value: any) => void>>();

  constructor(private readonly secretPassphrase?: string) {}

  async read<T>(key: string, options?: StorageSignalOptions): Promise<T | undefined> {
    const encryptData = options?.encrypt ?? false;
    const useToon = options?.serializer === 'toon';

    const raw = this.store.get(key);
    if (raw === undefined) {
      return undefined;
    }

    try {
      let plainText: string;
      if (encryptData) {
        if (!this.secretPassphrase) {
          throw new Error('Encryption passphrase not provided');
        }
        plainText = await decrypt(raw, this.secretPassphrase);
      } else {
        plainText = raw;
      }

      return await deserializeData<T>(plainText, useToon);
    } catch (err) {
      console.error(`[InMemoryStorageTransport] Error reading key:`, key, err);
      return undefined;
    }
  }

  async write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void> {
    const encryptData = options?.encrypt ?? false;
    const useToon = options?.serializer === 'toon';

    try {
      let payload = await serializeData(data, useToon);
      if (encryptData) {
        if (!this.secretPassphrase) {
          throw new Error('Encryption passphrase not provided');
        }
        payload = await encrypt(payload, this.secretPassphrase);
      }

      this.store.set(key, payload);

      // Notify listeners
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        for (const callback of keyListeners) {
          try {
            // Retrieve deep isolated clone to avoid listener side effects modifying internal state
            this.read<T>(key, options).then((value) => {
              if (value !== undefined) {
                callback(value);
              }
            });
          } catch {
            // Ignore callback failures
          }
        }
      }
    } catch (err) {
      console.error(`[InMemoryStorageTransport] Error writing key:`, key, err);
    }
  }

  async delete(key: string, _options?: StorageSignalOptions): Promise<void> {
    this.store.delete(key);
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      for (const callback of keyListeners) {
        try {
          Promise.resolve().then(() => callback(undefined));
        } catch {
          // Ignore callback failures
        }
      }
    }
  }

  onChange<T>(key: string, callback: (value: T) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    const set = this.listeners.get(key)!;
    set.add(callback);

    return () => {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  // Exposed helper for testing / debugging in-memory store directly
  getInternalMap(): Map<string, string> {
    return this.store;
  }
}
