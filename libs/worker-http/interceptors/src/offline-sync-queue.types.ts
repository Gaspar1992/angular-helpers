import type { SerializableRequest } from './worker-interceptor.types';

export interface OfflineSyncConfig {
  /** Database name for IndexedDB (default: 'ah_offline_sync') */
  dbName?: string;
  /** Custom header to completely bypass the offline sync queue */
  bypassHeader?: string;
}

export interface QueuedRequest {
  id: string;
  timestamp: number;
  request: SerializableRequest;
}
