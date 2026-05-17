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

export interface EntityStoreOptions<Id, Entity> {
  idKey: keyof Entity | ((entity: Entity) => Id);
  persistKey?: string;
  storageOptions?: Omit<StorageSignalOptions, 'serializer'> & { serializer?: 'json' | 'toon' };
}
