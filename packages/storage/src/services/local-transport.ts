import { Inject, Injectable, Optional } from '@angular/core';
import { injectPlatform } from '@angular-helpers/core';
import { StorageTransport } from './storage-transport';
import { SECURE_STORAGE_PASSPHRASE } from '../tokens/storage.tokens';
import { STORAGE_WORKER_FACTORY } from '../tokens/worker.tokens';
import { StorageSignalOptions } from '../interfaces/storage.types';
import { WebStorageTransport } from './transports/web-storage.transport';
import { IndexedDBTransport } from './transports/indexeddb.transport';
import { CacheApiTransport } from './transports/cache-api.transport';
import { WorkerStorageTransport } from './worker-transport';

/**
 * Composite transport that delegates to specific storage strategies (local, indexeddb, cacheapi).
 * Acts as the default provider for STORAGE_TRANSPORT.
 *
 * Performance optimization: if a STORAGE_WORKER_FACTORY is provided and running in the main thread,
 * it automatically delegates to WorkerStorageTransport to move serialization/encryption off-main-thread.
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageTransport implements StorageTransport {
  private readonly webStorage: WebStorageTransport;
  private readonly indexedDB: IndexedDBTransport;
  private readonly cacheApi: CacheApiTransport;
  private readonly workerTransport?: WorkerStorageTransport;
  private readonly broadcastChannel?: BroadcastChannel;

  public storageType: 'local' | 'session' | 'indexeddb' | 'cacheapi' = 'local';
  public encrypt = false;
  public dbName = 'ah_db';
  public storeName = 'kv';
  public cacheName = 'ah_cache';

  constructor(
    @Inject(SECURE_STORAGE_PASSPHRASE)
    private readonly secretPassphrase: string = 'fallback-passphrase-angular-helpers-default-key-sec',
    @Inject(STORAGE_WORKER_FACTORY) @Optional() private readonly workerFactory?: () => Worker,
  ) {
    const { isBrowser, window: globalWindow } = injectPlatform();

    this.webStorage = new WebStorageTransport(this.secretPassphrase);
    this.indexedDB = new IndexedDBTransport(this.secretPassphrase);
    this.cacheApi = new CacheApiTransport(this.secretPassphrase);

    if (isBrowser && this.workerFactory) {
      this.workerTransport = new WorkerStorageTransport(this.workerFactory);
    }

    // If running in worker context, default to indexeddb as L2
    if (!isBrowser) {
      this.storageType = 'indexeddb';
    }

    if (isBrowser && globalWindow && 'BroadcastChannel' in globalWindow) {
      this.broadcastChannel = new BroadcastChannel('ah_storage_sync');
    }
  }

  async read<T>(key: string, options?: StorageSignalOptions): Promise<T | undefined> {
    if (this.workerTransport) {
      return this.workerTransport.read<T>(key, options);
    }
    const mergedOptions = {
      storageType: this.storageType,
      dbName: this.dbName,
      storeName: this.storeName,
      cacheName: this.cacheName,
      encrypt: this.encrypt,
      ...options,
    } as StorageSignalOptions;
    const transport = this.resolveTransport(mergedOptions.storageType);
    return transport.read<T>(key, mergedOptions);
  }

  async write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void> {
    if (this.workerTransport) {
      await this.workerTransport.write<T>(key, data, options);
      this.broadcastChannel?.postMessage({ type: 'write', key });
      return;
    }
    const mergedOptions = {
      storageType: this.storageType,
      dbName: this.dbName,
      storeName: this.storeName,
      cacheName: this.cacheName,
      encrypt: this.encrypt,
      ...options,
    } as StorageSignalOptions;
    const transport = this.resolveTransport(mergedOptions.storageType);
    await transport.write<T>(key, data, mergedOptions);
    this.broadcastChannel?.postMessage({ type: 'write', key });
  }

  async delete(key: string, options?: StorageSignalOptions): Promise<void> {
    if (this.workerTransport) {
      await this.workerTransport.delete(key, options);
      this.broadcastChannel?.postMessage({ type: 'delete', key });
      return;
    }
    const mergedOptions = {
      storageType: this.storageType,
      dbName: this.dbName,
      storeName: this.storeName,
      cacheName: this.cacheName,
      ...options,
    } as StorageSignalOptions;
    const transport = this.resolveTransport(mergedOptions.storageType);
    await transport.delete(key, mergedOptions);
    this.broadcastChannel?.postMessage({ type: 'delete', key });
  }

  onChange<T>(key: string, callback: (value: T) => void): () => void {
    const unsubs: (() => void)[] = [];

    if (this.workerTransport) {
      unsubs.push(this.workerTransport.onChange(key, callback));
    } else {
      unsubs.push(this.webStorage.onChange(key, callback));
    }

    if (this.broadcastChannel) {
      const listener = (event: MessageEvent) => {
        if (event.data?.key === key) {
          if (event.data.type === 'write') {
            this.read<T>(key).then((val) => {
              if (val !== undefined) callback(val);
            });
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
        return this.indexedDB;
      case 'cacheapi':
        return this.cacheApi;
      case 'local':
      case 'session':
      default:
        return this.webStorage;
    }
  }
}
