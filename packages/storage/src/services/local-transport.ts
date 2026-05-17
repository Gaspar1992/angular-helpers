import { Injectable } from '@angular/core';
import { StorageTransport } from './storage-transport';

const ENCRYPTION_SALT = new Uint8Array([7, 21, 14, 9, 3, 18, 5, 12, 1, 20, 16, 2, 8, 15, 6, 11]);

async function getCryptoKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return window.crypto.subtle.deriveKey(
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
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
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

  const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return dec.decode(decrypted);
}

let toonModule: any = null;
async function getToon() {
  if (!toonModule) {
    try {
      toonModule = await import('@toon-format/toon');
    } catch {
      // Silencioso fallback a JSON
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
  private readonly SECRET_PASSPHRASE = 'angular-helpers-secure-storage-passphrase';

  // Configuración dinámica por instancia
  public storageType: 'local' | 'session' | 'indexeddb' | 'cacheapi' = 'local';
  public encrypt = false;
  public dbName = 'ah_db';
  public storeName = 'kv';
  public cacheName = 'ah_cache';

  // IndexedDB Helper
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async read<T>(key: string, useToon?: boolean): Promise<T | undefined> {
    try {
      if (this.storageType === 'cacheapi') {
        const cache = await window.caches.open(this.cacheName);
        const url = `${this.VIRTUAL_BASE_URL}${key}`;
        const response = await cache.match(url);
        if (!response) return undefined;

        if (this.encrypt) {
          const cipherText = await response.text();
          const plainText = await decrypt(cipherText, this.SECRET_PASSPHRASE);
          return await deserializeData<T>(plainText, useToon);
        }

        if (useToon) {
          const text = await response.text();
          return await deserializeData<T>(text, useToon);
        } else {
          return (await response.json()) as T;
        }
      }

      if (this.storageType === 'indexeddb') {
        const db = await this.openDB();
        return new Promise<T | undefined>((resolve, reject) => {
          const transaction = db.transaction(this.storeName, 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.get(key);

          request.onsuccess = async () => {
            const rawVal = request.result;
            if (rawVal === undefined) {
              resolve(undefined);
              return;
            }

            try {
              if (this.encrypt) {
                const plainText = await decrypt(rawVal, this.SECRET_PASSPHRASE);
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

      // Local o Session
      const storage = this.storageType === 'session' ? window.sessionStorage : window.localStorage;
      const raw = storage.getItem(key);
      if (raw === null) return undefined;

      if (this.encrypt) {
        const plainText = await decrypt(raw, this.SECRET_PASSPHRASE);
        return await deserializeData<T>(plainText, useToon);
      }
      return await deserializeData<T>(raw, useToon);
    } catch (error) {
      console.error(`[LocalStorageTransport] Error al leer clave: ${key}`, error);
      return undefined;
    }
  }

  async write<T>(key: string, data: T, useToon?: boolean): Promise<void> {
    try {
      let payload = await serializeData(data, useToon);

      if (this.encrypt) {
        payload = await encrypt(payload, this.SECRET_PASSPHRASE);
      }

      if (this.storageType === 'cacheapi') {
        const cache = await window.caches.open(this.cacheName);
        const url = `${this.VIRTUAL_BASE_URL}${key}`;
        const response = new Response(payload, {
          headers: {
            'Content-Type': useToon && !this.encrypt ? 'application/toon' : 'application/json',
            'X-Storage-Date': new Date().toISOString(),
          },
        });
        await cache.put(url, response);
        return;
      }

      if (this.storageType === 'indexeddb') {
        const db = await this.openDB();
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(this.storeName, 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.put(payload, key);

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      // Local o Session
      const storage = this.storageType === 'session' ? window.sessionStorage : window.localStorage;
      storage.setItem(key, payload);
    } catch (error) {
      console.error(`[LocalStorageTransport] Error al escribir clave: ${key}`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (this.storageType === 'cacheapi') {
        const cache = await window.caches.open(this.cacheName);
        const url = `${this.VIRTUAL_BASE_URL}${key}`;
        await cache.delete(url);
        return;
      }

      if (this.storageType === 'indexeddb') {
        const db = await this.openDB();
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(this.storeName, 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.delete(key);

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      const storage = this.storageType === 'session' ? window.sessionStorage : window.localStorage;
      storage.removeItem(key);
    } catch (error) {
      console.error(`[LocalStorageTransport] Error al eliminar clave: ${key}`, error);
    }
  }

  onChange<T>(key: string, callback: (value: T) => void): () => void {
    const listener = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          deserializeData<T>(event.newValue).then((val) => callback(val));
        } catch {
          // Ignorar payloads fallidos
        }
      }
    };

    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }
}
