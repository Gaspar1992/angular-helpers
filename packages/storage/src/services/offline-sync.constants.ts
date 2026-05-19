export const OFFLINE_SYNC_SERVICE_DEFAULTS = Object.freeze({
  DB_NAME: 'ah_offline_sync',
  DB_VERSION: 1,
  STORE_NAME: 'requests',
  TX_READONLY: 'readonly',
  URL_DRAIN: 'https://angular-helpers.local/offline-sync-drain',
  HTTP_METHOD_GET: 'GET',
  EVENT_ONLINE: 'online',
  EVENT_OFFLINE: 'offline',
});
