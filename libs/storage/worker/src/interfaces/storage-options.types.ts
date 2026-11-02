export interface StorageSignalOptions<T = any> {
  storageType?: 'local' | 'session' | 'indexeddb' | 'cacheapi' | 'memory';
  serializer?: 'json' | 'toon';
  encrypt?: boolean;
  passphrase?: string;
  dbName?: string; // Only for indexeddb
  storeName?: string; // Only for indexeddb
  cacheName?: string; // Only for cacheapi
  crossTabSync?: boolean;
  validator?: (data: unknown) => data is T;
}
