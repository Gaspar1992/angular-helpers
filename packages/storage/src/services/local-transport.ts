import { Inject, Injectable, Optional } from '@angular/core';
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
    this.webStorage = new WebStorageTransport(this.secretPassphrase);
    this.indexedDB = new IndexedDBTransport(this.secretPassphrase);
    this.cacheApi = new CacheApiTransport(this.secretPassphrase);

    const isMainThread = typeof window !== 'undefined';

    if (isMainThread && this.workerFactory) {
      this.workerTransport = new WorkerStorageTransport(this.workerFactory);
    }

    // If running in worker context, default to indexeddb as L2
    if (!isMainThread) {
      this.storageType = 'indexeddb';
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
    };
    const transport = this.resolveTransport(mergedOptions.storageType);
    return transport.read<T>(key, mergedOptions);
  }

  async write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void> {
    if (this.workerTransport) {
      return this.workerTransport.write<T>(key, data, options);
    }
    const mergedOptions = {
      storageType: this.storageType,
      dbName: this.dbName,
      storeName: this.storeName,
      cacheName: this.cacheName,
      encrypt: this.encrypt,
      ...options,
    };
    const transport = this.resolveTransport(mergedOptions.storageType);
    return transport.write<T>(key, data, mergedOptions);
  }

  async delete(key: string, options?: StorageSignalOptions): Promise<void> {
    if (this.workerTransport) {
      return this.workerTransport.delete(key, options);
    }
    const mergedOptions = {
      storageType: this.storageType,
      dbName: this.dbName,
      storeName: this.storeName,
      cacheName: this.cacheName,
      ...options,
    };
    const transport = this.resolveTransport(mergedOptions.storageType);
    return transport.delete(key, mergedOptions);
  }

  onChange<T>(key: string, callback: (value: T) => void): () => void {
    if (this.workerTransport) {
      return this.workerTransport.onChange(key, callback);
    }
    // Only WebStorage (local/session) supports native cross-tab sync via 'storage' event
    return this.webStorage.onChange(key, callback);
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
