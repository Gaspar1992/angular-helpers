import { StorageTransport } from '../storage-transport';
import { StorageSignalOptions } from '../../interfaces/storage.types';
import { encrypt, decrypt } from '../../utils/crypto.utils';
import { serializeData, deserializeData } from '../../utils/serialization.utils';

export class IndexedDBTransport implements StorageTransport {
  constructor(private readonly secretPassphrase?: string) {}

  private async openDB(dbName: string, storeName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async read<T>(key: string, options?: StorageSignalOptions): Promise<T | undefined> {
    const dbName = options?.dbName ?? 'ah_db';
    const storeName = options?.storeName ?? 'kv';
    const encryptData = options?.encrypt ?? false;
    const useToon = options?.serializer === 'toon';

    try {
      const db = await this.openDB(dbName, storeName);
      return new Promise<T | undefined>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = async () => {
          const rawVal = request.result;
          if (rawVal === undefined) {
            resolve(undefined);
            return;
          }

          try {
            if (encryptData) {
              if (!this.secretPassphrase) throw new Error('Encryption passphrase not provided');
              const plainText = await decrypt(rawVal, this.secretPassphrase);
              resolve(await deserializeData<T>(plainText, useToon));
            } else {
              resolve(await deserializeData<T>(rawVal, useToon));
            }
          } catch (err) {
            reject(err);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error(`[IndexedDBTransport] Error reading key:`, key, err);
      return undefined;
    }
  }

  async write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void> {
    const dbName = options?.dbName ?? 'ah_db';
    const storeName = options?.storeName ?? 'kv';
    const encryptData = options?.encrypt ?? false;
    const useToon = options?.serializer === 'toon';

    try {
      let payload = await serializeData(data, useToon);

      if (encryptData) {
        if (!this.secretPassphrase) throw new Error('Encryption passphrase not provided');
        payload = await encrypt(payload, this.secretPassphrase);
      }

      const db = await this.openDB(dbName, storeName);
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(payload, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error(`[IndexedDBTransport] Error writing key:`, key, err);
    }
  }

  async delete(key: string, options?: StorageSignalOptions): Promise<void> {
    const dbName = options?.dbName ?? 'ah_db';
    const storeName = options?.storeName ?? 'kv';

    try {
      const db = await this.openDB(dbName, storeName);
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error(`[IndexedDBTransport] Error deleting key:`, key, err);
    }
  }
}
