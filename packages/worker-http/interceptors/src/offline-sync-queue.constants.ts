export interface OfflineSyncConfig {
  readonly DB_NAME: string;
  readonly BYPASS_HEADER: string;
  readonly STORE_NAME: string;
  readonly DB_VERSION: number;
  readonly MUTATION_METHODS: readonly string[];
  readonly URL_STATUS: string;
  readonly URL_DRAIN: string;
  readonly TX_READWRITE: string;
  readonly TX_READONLY: string;
  readonly STATUS_OK: number;
  readonly STATUS_ACCEPTED: number;
  readonly STATUS_ERROR: number;
  readonly STATUS_UNAVAILABLE: number;
  readonly HEADER_CONTENT_TYPE: string;
  readonly HEADER_QUEUED_ID: string;
  readonly CONTENT_TYPE_JSON: string;
}

export const OFFLINE_SYNC_DEFAULTS: OfflineSyncConfig = Object.freeze({
  DB_NAME: 'ah_offline_sync',
  BYPASS_HEADER: 'X-Bypass-Offline-Sync',
  STORE_NAME: 'requests',
  DB_VERSION: 1,
  MUTATION_METHODS: Object.freeze(['POST', 'PUT', 'PATCH', 'DELETE']),
  URL_STATUS: 'https://angular-helpers.local/offline-sync-status',
  URL_DRAIN: 'https://angular-helpers.local/offline-sync-drain',
  TX_READWRITE: 'readwrite',
  TX_READONLY: 'readonly',
  STATUS_OK: 200,
  STATUS_ACCEPTED: 202,
  STATUS_ERROR: 500,
  STATUS_UNAVAILABLE: 503,
  HEADER_CONTENT_TYPE: 'content-type',
  HEADER_QUEUED_ID: 'x-offline-queued-id',
  CONTENT_TYPE_JSON: 'application/json',
});
