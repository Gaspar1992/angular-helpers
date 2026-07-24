export interface OfflineCacheConfig {
  /** Cache strategy: 'network-first' (default) or 'cache-first' (stale-while-revalidate) */
  strategy?: 'network-first' | 'cache-first';
  /** Partition name in Cache API (default: 'ah-http-offline-cache') */
  cacheName?: string;
  /** Cache Time to Live (TTL) in milliseconds (default: 24 hours) */
  ttl?: number;
  /** Custom header to completely bypass this offline cache */
  bypassHeader?: string;
}
