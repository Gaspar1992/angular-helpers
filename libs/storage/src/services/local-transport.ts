import { DestroyRef, Injectable, inject } from '@angular/core';
import { injectPlatform } from '@angular-helpers/core';
import type { StorageTransport } from './storage-transport';
import { SECURE_STORAGE_PASSPHRASE } from '../tokens/storage.tokens';
import { STORAGE_WORKER_FACTORY } from '../tokens/worker.tokens';
import type { StorageSignalOptions } from '../interfaces/storage.types';
import { WebStorageTransport } from './transports/web-storage.transport';
import { IndexedDBTransport } from './transports/indexeddb.transport';
import { CacheApiTransport } from './transports/cache-api.transport';
import { WorkerStorageTransport } from './worker-transport';
import { InMemoryStorageTransport } from './transports/in-memory.transport';

/**
 * Composite transport that delegates to specific storage strategies (local, indexeddb, cacheapi).
 * Acts as the default provider for STORAGE_TRANSPORT.
 *
 * Performance optimization: if a STORAGE_WORKER_FACTORY is provided and running in the main thread,
 * it automatically delegates to WorkerStorageTransport to move serialization/encryption off-main-thread.
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageTransport implements StorageTransport {
  private readonly secretPassphrase?: string;
  private readonly workerFactory?: () => Worker;

  private readonly webStorage: WebStorageTransport;
  private readonly indexedDB: IndexedDBTransport;
  private readonly cacheApi: CacheApiTransport;
  private readonly inMemory: InMemoryStorageTransport;
  private readonly workerTransport?: WorkerStorageTransport;
  private readonly broadcastChannel?: BroadcastChannel;
  private readonly isBrowser: boolean;

  public storageType: 'local' | 'session' | 'indexeddb' | 'cacheapi' | 'memory' = 'local';
  public encrypt = false;
  public dbName = 'ah_db';
  public storeName = 'kv';
  public cacheName = 'ah_cache';

  constructor() {
    let secret: string | undefined;
    let factory: (() => Worker) | undefined = undefined;
    let injectedWorkerTransport: WorkerStorageTransport | undefined;

    try {
      secret = inject(SECURE_STORAGE_PASSPHRASE, { optional: true }) ?? undefined;
      factory = inject(STORAGE_WORKER_FACTORY, { optional: true }) ?? undefined;
      injectedWorkerTransport = inject(WorkerStorageTransport, { optional: true }) ?? undefined;
      const destroyRef = inject(DestroyRef, { optional: true });
      destroyRef?.onDestroy(() => this.broadcastChannel?.close());
    } catch {
      // Graceful fallback when executed outside Angular injection context (e.g. unit tests doing new LocalStorageTransport())
    }

    this.secretPassphrase = secret;
    this.workerFactory = factory;

    const { isBrowser, window: globalWindow } = injectPlatform();
    this.isBrowser = isBrowser;

    this.webStorage = new WebStorageTransport(this.secretPassphrase);
    this.indexedDB = new IndexedDBTransport(this.secretPassphrase);
    this.cacheApi = new CacheApiTransport(this.secretPassphrase);
    this.inMemory = new InMemoryStorageTransport(this.secretPassphrase);

    if (isBrowser && this.workerFactory) {
      this.workerTransport = injectedWorkerTransport ?? new WorkerStorageTransport();
    }

    // Default to in-memory in SSR/Server environments to avoid failures when browser APIs are missing
    if (!isBrowser) {
      this.storageType = 'memory';
    }

    if (isBrowser && globalWindow && 'BroadcastChannel' in globalWindow) {
      this.broadcastChannel = new BroadcastChannel('ah_storage_sync');
    }
  }

  private assertPassphraseIfEncrypted(options: StorageSignalOptions): void {
    if (!options.encrypt) return;
    const passphrase = options.passphrase ?? this.secretPassphrase;
    if (
      !passphrase ||
      passphrase === 'angular-helpers-secure-storage-passphrase' ||
      passphrase === 'fallback-passphrase-angular-helpers-default-key-sec'
    ) {
      throw new Error(
        '[LocalStorageTransport] Encryption is enabled, but no custom passphrase was provided. ' +
          'Configure SECURE_STORAGE_PASSPHRASE or pass options.passphrase.',
      );
    }
  }

  private mergeOptions(options?: StorageSignalOptions): StorageSignalOptions {
    return {
      storageType: this.storageType,
      dbName: this.dbName,
      storeName: this.storeName,
      cacheName: this.cacheName,
      encrypt: this.encrypt,
      ...options,
    } as StorageSignalOptions;
  }

  async read<T>(key: string, options?: StorageSignalOptions): Promise<T | undefined> {
    const mergedOptions = this.mergeOptions(options);
    this.assertPassphraseIfEncrypted(mergedOptions);

    if (this.workerTransport) {
      return this.workerTransport.read<T>(key, mergedOptions);
    }
    const transport = this.resolveTransport(mergedOptions.storageType);
    return transport.read<T>(key, mergedOptions);
  }

  async write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void> {
    const mergedOptions = this.mergeOptions(options);
    this.assertPassphraseIfEncrypted(mergedOptions);

    if (this.workerTransport) {
      await this.workerTransport.write<T>(key, data, mergedOptions);
      this.broadcastChannel?.postMessage({ type: 'write', key });
      return;
    }
    const transport = this.resolveTransport(mergedOptions.storageType);
    await transport.write<T>(key, data, mergedOptions);
    this.broadcastChannel?.postMessage({ type: 'write', key });
  }

  async delete(key: string, options?: StorageSignalOptions): Promise<void> {
    const mergedOptions = this.mergeOptions(options);

    if (this.workerTransport) {
      await this.workerTransport.delete(key, mergedOptions);
      this.broadcastChannel?.postMessage({ type: 'delete', key });
      return;
    }
    const transport = this.resolveTransport(mergedOptions.storageType);
    await transport.delete(key, mergedOptions);
    this.broadcastChannel?.postMessage({ type: 'delete', key });
  }

  onChange<T>(
    key: string,
    callback: (value: T) => void,
    options?: StorageSignalOptions,
  ): () => void {
    const unsubs: (() => void)[] = [];

    if (this.workerTransport) {
      unsubs.push(this.workerTransport.onChange(key, callback));
    } else {
      const transport = this.resolveTransport(options?.storageType ?? this.storageType);
      if (transport.onChange) {
        unsubs.push(transport.onChange(key, callback));
      }
    }

    if (this.broadcastChannel) {
      const listener = (event: MessageEvent) => {
        if (event.data?.key === key) {
          if (event.data.type === 'write') {
            this.read<T>(key, options)
              .then((val) => {
                if (val !== undefined) callback(val);
              })
              .catch(() => {});
          } else if (event.data.type === 'delete') {
            callback(undefined as unknown as T);
          }
        }
      };
      this.broadcastChannel.addEventListener('message', listener);
      unsubs.push(() => this.broadcastChannel?.removeEventListener('message', listener));
    }

    return () => unsubs.forEach((u) => u());
  }

  private resolveTransport(type?: string): StorageTransport {
    const targetType = type ?? this.storageType;
    switch (targetType) {
      case 'indexeddb':
        return this.isBrowser ? this.indexedDB : this.inMemory;
      case 'cacheapi':
        return this.isBrowser ? this.cacheApi : this.inMemory;
      case 'memory':
        return this.inMemory;
      case 'local':
      case 'session':
      default:
        return this.isBrowser ? this.webStorage : this.inMemory;
    }
  }
}
