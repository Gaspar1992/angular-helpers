export const OFFLINE_CACHE_DEFAULTS = Object.freeze({
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
