import { Signal, WritableSignal } from '@angular/core';

export interface StorageSignalOptions {
  storageType: 'local' | 'session' | 'indexeddb' | 'cacheapi';
  serializer: 'json' | 'toon';
  encrypt?: boolean;
  dbName?: string; // Solo para indexeddb
  storeName?: string; // Solo para indexeddb
  cacheName?: string; // Solo para cacheapi
  crossTabSync?: boolean;
}

export interface StorageSignalState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

/**
 * Reactive Signal that synchronizes its value with a storage medium (L2).
 * Exposes the data directly when reading the signal, but allows querying
 * loading and error states via sub-signals.
 */
export interface StorageSignal<T> extends WritableSignal<T> {
  readonly loading: Signal<boolean>;
  readonly error: Signal<Error | null>;
}

export interface EntityStoreOptions<Id, Entity> {
  idKey: keyof Entity | ((entity: Entity) => Id);
  persistKey?: string;
  storageOptions?: Omit<StorageSignalOptions, 'serializer'> & { serializer?: 'json' | 'toon' };
}
