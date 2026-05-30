export interface StorageSignalOptions<T = any> {
  storageType: 'local' | 'session' | 'indexeddb' | 'cacheapi' | 'memory';
  serializer: 'json' | 'toon';
  encrypt?: boolean;
  dbName?: string; // Solo para indexeddb
  storeName?: string; // Solo para indexeddb
  cacheName?: string; // Solo para cacheapi
  crossTabSync?: boolean;
  validator?: (data: unknown) => data is T;
}
