import { Inject, Injectable } from '@angular/core';
import { StorageTransport } from './storage-transport';
import { SECURE_STORAGE_PASSPHRASE } from '../tokens/storage.tokens';
import { StorageSignalOptions } from '../interfaces/storage.types';

const ENCRYPTION_SALT = new Uint8Array([7, 21, 14, 9, 3, 18, 5, 12, 1, 20, 16, 2, 8, 15, 6, 11]);

function getCrypto(): Crypto | null {
  if (typeof crypto !== 'undefined') return crypto;
  if (typeof window !== 'undefined' && window.crypto) return window.crypto;
  return null;
}

function getCaches(): CacheStorage | null {
  if (typeof caches !== 'undefined') return caches;
  if (typeof window !== 'undefined' && window.caches) return window.caches;
  return null;
}

async function getCryptoKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const cryptoContext = getCrypto();
  if (!cryptoContext) {
    throw new Error('WebCrypto API is not supported in this environment');
  }

  const keyMaterial = await cryptoContext.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return cryptoContext.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: ENCRYPTION_SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encrypt(text: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await getCryptoKey(secret);
  const cryptoContext = getCrypto();
  if (!cryptoContext) {
    throw new Error('WebCrypto API is not supported in this environment');
  }

  const iv = cryptoContext.getRandomValues(new Uint8Array(12));
  const encrypted = await cryptoContext.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text),
  );

  const cipherBytes = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function decrypt(base64: string, secret: string): Promise<string> {
  const dec = new TextDecoder();
  const key = await getCryptoKey(secret);

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);

  const cryptoContext = getCrypto();
  if (!cryptoContext) {
    throw new Error('WebCrypto API is not supported in this environment');
  }

  const decrypted = await cryptoContext.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return dec.decode(decrypted);
}

let toonModule: any = null;
async function getToon() {
  if (!toonModule) {
    try {
      toonModule = await import('@toon-format/toon');
    } catch {
      // Silent JSON fallback
    }
  }
  return toonModule;
}

async function serializeData<T>(data: T, useToon = false): Promise<string> {
  if (useToon) {
    const toon = await getToon();
    if (toon) {
      return toon.encode(data);
    }
  }
  return JSON.stringify(data);
}

async function deserializeData<T>(text: string, useToon = false): Promise<T> {
  if (useToon) {
    const toon = await getToon();
    if (toon) {
      return toon.decode(text) as T;
    }
  }
  return JSON.parse(text) as T;
}

@Injectable({ providedIn: 'root' })
export class LocalStorageTransport implements StorageTransport {
  private readonly VIRTUAL_BASE_URL = 'https://angular-helpers.local/storage-cache/';

  public storageType: 'local' | 'session' | 'indexeddb' | 'cacheapi' = 'local';
  public encrypt = false;
  public dbName = 'ah_db';
  public storeName = 'kv';
  public cacheName = 'ah_cache';

  constructor(
    @Inject(SECURE_STORAGE_PASSPHRASE)
    private readonly secretPassphrase: string = 'fallback-passphrase-angular-helpers-default-key-sec',
  ) {
    // If running in worker context, fall back to indexeddb as default L2
    if (typeof window === 'undefined') {
      this.storageType = 'indexeddb';
    }
  }

  private async openDB(dbName: string, storeName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
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
    try {
      const storageType = options?.storageType ?? this.storageType;
      const encryptData = options?.encrypt ?? this.encrypt;
      const dbName = options?.dbName ?? this.dbName;
      const storeName = options?.storeName ?? this.storeName;
      const cacheName = options?.cacheName ?? this.cacheName;
      const useToon = options?.serializer === 'toon';

      if (storageType === 'cacheapi') {
        const cacheContext = getCaches();
        if (!cacheContext) {
          throw new Error('Cache API is not supported in this environment');
        }
        const cache = await cacheContext.open(cacheName);
        const url = `${this.VIRTUAL_BASE_URL}${key}`;
        const response = await cache.match(url);
        if (!response) return undefined;

        if (encryptData) {
          const cipherText = await response.text();
          const plainText = await decrypt(cipherText, this.secretPassphrase);
          return await deserializeData<T>(plainText, useToon);
        }

        if (useToon) {
          const text = await response.text();
          return await deserializeData<T>(text, useToon);
        } else {
          return (await response.json()) as T;
        }
      }

      if (storageType === 'indexeddb') {
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
      }

      // Local or Session Storage (Main Thread Only)
      if (typeof window === 'undefined') {
        throw new Error(`Storage type '${storageType}' is not supported in Worker context`);
      }
      const storage = storageType === 'session' ? window.sessionStorage : window.localStorage;
      const raw = storage.getItem(key);
      if (raw === null) return undefined;

      if (encryptData) {
        const plainText = await decrypt(raw, this.secretPassphrase);
        return await deserializeData<T>(plainText, useToon);
      }
      return await deserializeData<T>(raw, useToon);
    } catch (error) {
      console.error(`[LocalStorageTransport] Error al leer clave: ${key}`, error);
      return undefined;
    }
  }

  async write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void> {
    try {
      const storageType = options?.storageType ?? this.storageType;
      const encryptData = options?.encrypt ?? this.encrypt;
      const dbName = options?.dbName ?? this.dbName;
      const storeName = options?.storeName ?? this.storeName;
      const cacheName = options?.cacheName ?? this.cacheName;
      const useToon = options?.serializer === 'toon';

      let payload = await serializeData(data, useToon);

      if (encryptData) {
        payload = await encrypt(payload, this.secretPassphrase);
      }

      if (storageType === 'cacheapi') {
        const cacheContext = getCaches();
        if (!cacheContext) {
          throw new Error('Cache API is not supported in this environment');
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
        return;
      }

      if (storageType === 'indexeddb') {
        const db = await this.openDB(dbName, storeName);
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.put(payload, key);

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      // Local or Session Storage (Main Thread Only)
      if (typeof window === 'undefined') {
        throw new Error(`Storage type '${storageType}' is not supported in Worker context`);
      }
      const storage = storageType === 'session' ? window.sessionStorage : window.localStorage;
      storage.setItem(key, payload);
    } catch (error) {
      console.error(`[LocalStorageTransport] Error al escribir clave: ${key}`, error);
    }
  }

  async delete(key: string, options?: StorageSignalOptions): Promise<void> {
    try {
      const storageType = options?.storageType ?? this.storageType;
      const dbName = options?.dbName ?? this.dbName;
      const storeName = options?.storeName ?? this.storeName;
      const cacheName = options?.cacheName ?? this.cacheName;

      if (storageType === 'cacheapi') {
        const cacheContext = getCaches();
        if (!cacheContext) {
          throw new Error('Cache API is not supported in this environment');
        }
        const cache = await cacheContext.open(cacheName);
        const url = `${this.VIRTUAL_BASE_URL}${key}`;
        await cache.delete(url);
        return;
      }

      if (storageType === 'indexeddb') {
        const db = await this.openDB(dbName, storeName);
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.delete(key);

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      // Local or Session Storage (Main Thread Only)
      if (typeof window === 'undefined') {
        throw new Error(`Storage type '${storageType}' is not supported in Worker context`);
      }
      const storage = storageType === 'session' ? window.sessionStorage : window.localStorage;
      storage.removeItem(key);
    } catch (error) {
      console.error(`[LocalStorageTransport] Error al eliminar clave: ${key}`, error);
    }
  }

  onChange<T>(key: string, callback: (value: T) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }
    const listener = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          deserializeData<T>(event.newValue).then((val) => callback(val));
        } catch {
          // Ignore failed parsing
        }
      }
    };

    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }
}
