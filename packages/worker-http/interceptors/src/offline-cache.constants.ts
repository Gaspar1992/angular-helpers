export interface OfflineCacheConfig {
  readonly STRATEGY: 'network-first' | 'cache-first';
  readonly CACHE_NAME: string;
  readonly TTL: number;
  readonly BYPASS_HEADER: string;
  readonly VIRTUAL_BASE_URL: string;
  readonly HTTP_METHOD_GET: string;
  readonly HEADER_STORAGE_DATE: string;
  readonly HEADER_CONTENT_TYPE: string;
  readonly CONTENT_TYPE_JSON: string;
  readonly STRATEGY_CACHE_FIRST: string;
  readonly STRATEGY_NETWORK_FIRST: string;
}

export const OFFLINE_CACHE_DEFAULTS: OfflineCacheConfig = Object.freeze({
  STRATEGY: 'network-first',
  CACHE_NAME: 'ah-http-offline-cache',
  TTL: 86_400_000, // 24 hours in milliseconds
  BYPASS_HEADER: 'X-Bypass-Offline-Cache',
  VIRTUAL_BASE_URL: 'https://angular-helpers.local/http-cache/',
  HTTP_METHOD_GET: 'GET',
  HEADER_STORAGE_DATE: 'X-Storage-Date',
  HEADER_CONTENT_TYPE: 'Content-Type',
  CONTENT_TYPE_JSON: 'application/json',
  STRATEGY_CACHE_FIRST: 'cache-first',
  STRATEGY_NETWORK_FIRST: 'network-first',
});
