/// <reference lib="webworker" />
/* oxlint-disable no-console */
import { IndexedDBTransport } from '../services/transports/indexeddb.transport';
import type { WorkerStorageRequest } from '../interfaces/worker-storage.types';

const DEFAULT_WORKER_PASSPHRASE = 'fallback-passphrase-angular-helpers-default-key-sec';

// Instantiate our environment-agnostic L2 storage transport
const storageEngine = new IndexedDBTransport(DEFAULT_WORKER_PASSPHRASE);

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
    if (options?.passphrase) {
      storageEngine.setPassphrase(options.passphrase);
    }

    switch (type) {
      case 'init': {
        const nextPassphrase =
          typeof payload?.passphrase === 'string' ? payload.passphrase : options?.passphrase;
        if (nextPassphrase) {
          storageEngine.setPassphrase(nextPassphrase);
        }
        self.postMessage({ type: 'response', requestId });
        break;
      }
      case 'read': {
        const result = await storageEngine.read(key!, options);
        self.postMessage({ type: 'response', requestId, payload: result });
        break;
      }
      case 'write': {
        await storageEngine.write(key!, payload, options);
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
