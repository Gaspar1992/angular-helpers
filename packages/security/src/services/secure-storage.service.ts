import { Injectable, InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type StorageTarget = 'local' | 'session';

export interface SecureStorageConfig {
  storage?: StorageTarget;
  pbkdf2Iterations?: number;
}

export const SECURE_STORAGE_CONFIG = new InjectionToken<SecureStorageConfig>(
  'SECURE_STORAGE_CONFIG',
);

interface StoredEntry {
  iv: string;
  ct: string;
}

const SALT_STORAGE_KEY = '__ss_salt__';
const DEFAULT_ITERATIONS = 600_000;

/**
 * Service for transparent AES-GCM encrypted storage on top of localStorage/sessionStorage.
 *
 * Two key modes are supported:
 * - **Ephemeral** (default): a CryptoKey is generated in memory per service instance.
 *   Data is unrecoverable after page reload or service re-creation.
 * - **Passphrase-derived**: call `initWithPassphrase(passphrase)` to derive a stable key
 *   via PBKDF2. Data survives page reloads as long as the same passphrase is used.
 *
 * @example
 * // Ephemeral mode
 * await storage.set('token', { value: 'abc' });
 * const token = await storage.get<{ value: string }>('token');
 *
 * @example
 * // Passphrase mode
 * await storage.initWithPassphrase('my-secret');
 * await storage.set('user', { id: 1 }, 'auth');
 * const user = await storage.get<{ id: number }>('user', 'auth');
 */
@Injectable()
export class SecureStorageService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly storageConfig: Required<SecureStorageConfig>;

  private activeKey: CryptoKey | null = null;

  constructor() {
    const config = inject(SECURE_STORAGE_CONFIG, { optional: true }) ?? {};
    this.storageConfig = {
      storage: config.storage ?? 'local',
      pbkdf2Iterations: config.pbkdf2Iterations ?? DEFAULT_ITERATIONS,
    };
  }

  isSupported(): boolean {
    return (
      isPlatformBrowser(this.platformId) &&
      'crypto' in window &&
      'subtle' in crypto &&
      'localStorage' in window
    );
  }

  /**
   * Initializes the service with a passphrase-derived key (PBKDF2 + AES-GCM).
   * The salt is automatically persisted in storage on first call and reused on subsequent calls.
   * Calling this again replaces the active key.
   *
   * @param passphrase Secret passphrase for key derivation.
   * @param explicitSalt Optional base64 salt. When provided, the stored salt is ignored.
   */
  async initWithPassphrase(passphrase: string, explicitSalt?: string): Promise<void> {
    this.assertSupported();

    let salt: Uint8Array<ArrayBuffer>;

    if (explicitSalt) {
      salt = this.base64ToBytes(explicitSalt);
    } else {
      const stored = this.nativeStorage.getItem(SALT_STORAGE_KEY);
      if (stored) {
        salt = this.base64ToBytes(stored);
      } else {
        salt = crypto.getRandomValues(
          new Uint8Array(new ArrayBuffer(16)),
        ) as Uint8Array<ArrayBuffer>;
        this.nativeStorage.setItem(SALT_STORAGE_KEY, this.bytesToBase64(salt));
      }
    }

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey'],
    );

    this.activeKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.storageConfig.pbkdf2Iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * Encrypts and stores a value.
   * A fresh random IV is generated for every write.
   *
   * @throws {TypeError} When `value` is `undefined`.
   * @throws {DOMException} When storage quota is exceeded.
   */
  async set<T>(key: string, value: T, namespace?: string): Promise<void> {
    this.assertSupported();

    if (value === undefined) {
      throw new TypeError('Cannot store undefined value in SecureStorageService');
    }

    const cryptoKey = await this.ensureKey();
    const iv = crypto.getRandomValues(
      new Uint8Array(new ArrayBuffer(12)),
    ) as Uint8Array<ArrayBuffer>;
    const plaintext = new TextEncoder().encode(JSON.stringify(value));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, plaintext);

    const entry: StoredEntry = {
      iv: this.bytesToBase64(iv),
      ct: this.bytesToBase64(ciphertext),
    };

    this.nativeStorage.setItem(this.buildStorageKey(key, namespace), JSON.stringify(entry));
  }

  /**
   * Decrypts and returns a stored value.
   * Returns `null` if the key does not exist, was written without encryption,
   * or the ciphertext is corrupted.
   */
  async get<T>(key: string, namespace?: string): Promise<T | null> {
    this.assertSupported();

    const raw = this.nativeStorage.getItem(this.buildStorageKey(key, namespace));
    if (!raw) return null;

    let entry: StoredEntry;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || !('iv' in parsed) || !('ct' in parsed)) {
        return null;
      }
      entry = parsed as StoredEntry;
    } catch {
      return null;
    }

    try {
      const cryptoKey = await this.ensureKey();
      const iv = this.base64ToBytes(entry.iv);
      const ciphertext = this.base64ToBytes(entry.ct);
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext);
      return JSON.parse(new TextDecoder().decode(decrypted)) as T;
    } catch {
      return null;
    }
  }

  /**
   * Removes a single entry from storage.
   */
  remove(key: string, namespace?: string): void {
    this.assertSupported();
    this.nativeStorage.removeItem(this.buildStorageKey(key, namespace));
  }

  /**
   * Clears all entries belonging to a namespace.
   * When called without arguments, clears the entire storage target.
   */
  clear(namespace?: string): void {
    this.assertSupported();

    if (!namespace) {
      this.nativeStorage.clear();
      return;
    }

    const prefix = `${namespace}:`;
    const keysToRemove: string[] = [];

    for (let i = 0; i < this.nativeStorage.length; i++) {
      const k = this.nativeStorage.key(i);
      if (k?.startsWith(prefix)) {
        keysToRemove.push(k);
      }
    }

    keysToRemove.forEach((k) => this.nativeStorage.removeItem(k));
  }

  private get nativeStorage(): Storage {
    return this.storageConfig.storage === 'session' ? sessionStorage : localStorage;
  }

  private buildStorageKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  private async ensureKey(): Promise<CryptoKey> {
    if (this.activeKey) return this.activeKey;

    this.activeKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
      'decrypt',
    ]);

    return this.activeKey;
  }

  private assertSupported(): void {
    if (!this.isSupported()) {
      throw new Error(
        'SecureStorageService is not supported in this environment (requires browser + Web Crypto API)',
      );
    }
  }

  private bytesToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>;
  }
}
