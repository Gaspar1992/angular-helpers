/// <reference lib="webworker" />

import { LocalStorageTransport } from '@angular-helpers/storage';
import { WorkerStorageRequest } from '@angular-helpers/storage';

// Instantiate our environment-agnostic local transport driver inside the Worker context
const storageEngine = new LocalStorageTransport();

// Configure the worker's storage targets (using high-performance IndexedDB natively)
storageEngine.storageType = 'indexeddb';
storageEngine.dbName = 'ah_db';
storageEngine.storeName = 'kv';

// BroadcastChannel for cross-tab realtime data synchronization
const syncChannel = new BroadcastChannel('ah-storage-sync-channel');

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

// Router for RPC requests from the StorageDemoComponent
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
        broadcastChange(key!, payload);
        break;
      }
      case 'delete': {
        await storageEngine.delete(key!);
        self.postMessage({ type: 'response', requestId });
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
