import { LocalStorageTransport } from '../services/local-transport';
import { WorkerStorageRequest } from '../interfaces/worker-storage.types';

// Instantiate our environment-agnostic L2 storage transport
const storageEngine = new LocalStorageTransport();

// Default storage configurations for Web Worker context
storageEngine.storageType = 'indexeddb';
storageEngine.dbName = 'ah_db';
storageEngine.storeName = 'kv';

// BroadcastChannel for ultra-fast, native multi-tab sync
const syncChannel = new BroadcastChannel('ah-storage-sync-channel');

// Listen to sync notifications from other tabs' workers
syncChannel.onmessage = (event: MessageEvent<{ key: string; payload: any }>) => {
  self.postMessage({
    type: 'change',
    key: event.data.key,
    payload: event.data.payload,
  });
};

function broadcastChange(key: string, payload: any) {
  try {
    syncChannel.postMessage({ key, payload });
  } catch (err) {
    console.warn('[StorageWorker] Multi-tab BroadcastChannel failed to send message:', err);
  }
}

// Handle incoming RPC storage requests from the Main Thread
self.onmessage = async (event: MessageEvent<WorkerStorageRequest>) => {
  const { type, requestId, key, payload, options } = event.data;

  try {
    switch (type) {
      case 'read': {
        const result = await storageEngine.read(key!, options?.useToon);
        self.postMessage({ type: 'response', requestId, payload: result });
        break;
      }
      case 'write': {
        await storageEngine.write(key!, payload, options?.useToon);
        self.postMessage({ type: 'response', requestId });
        // Synchronize all other open tabs/windows
        broadcastChange(key!, payload);
        break;
      }
      case 'delete': {
        await storageEngine.delete(key!);
        self.postMessage({ type: 'response', requestId });
        // Synchronize deletion across tabs
        broadcastChange(key!, null);
        break;
      }
      default:
        throw new Error(`[StorageWorker] Unknown worker action: ${type}`);
    }
  } catch (error: any) {
    self.postMessage({
      type: 'error',
      requestId,
      error: error.message || 'Unknown Web Worker runtime error',
    });
  }
};
