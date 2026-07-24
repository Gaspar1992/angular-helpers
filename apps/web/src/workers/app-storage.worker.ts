/// <reference lib="webworker" />
import { IndexedDBTransport } from '@angular-helpers/storage/worker';
import { detectTransferables } from '@angular-helpers/storage/worker';
import type { WorkerStorageRequest } from '@angular-helpers/storage/worker';

// Instantiate our environment-agnostic local transport driver inside the Worker context
const storageEngine = new IndexedDBTransport('fallback-passphrase-angular-helpers-default-key-sec');

// BroadcastChannel for cross-tab realtime data synchronization
const syncChannel = new BroadcastChannel('ah-storage-sync-channel');

syncChannel.onmessage = (event: MessageEvent<{ key: string; payload: any }>) => {
  const transferables = detectTransferables(event.data.payload);
  self.postMessage(
    {
      type: 'change',
      key: event.data.key,
      payload: event.data.payload,
    },
    transferables,
  );
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
        const result = await storageEngine.read(key!, {
          storageType: 'indexeddb',
          serializer: options?.useToon ? 'toon' : 'json',
        });
        const transferables = detectTransferables(result);
        self.postMessage({ type: 'response', requestId, payload: result }, transferables);
        break;
      }
      case 'write': {
        await storageEngine.write(key!, payload, {
          storageType: 'indexeddb',
          serializer: options?.useToon ? 'toon' : 'json',
        });
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
