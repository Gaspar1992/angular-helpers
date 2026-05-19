import type { SerializableRequest, WorkerInterceptorFn } from './worker-interceptor.types';
import { OFFLINE_SYNC_DEFAULTS } from './offline-sync-queue.constants';
import type { OfflineSyncConfig, QueuedRequest } from './offline-sync-queue.types';

/**
 * Creates an offline synchronization queue interceptor that persists mutating requests
 * (POST, PUT, PATCH, DELETE) to IndexedDB while offline, and replays them in FIFO order
 * when online.
 *
 * @param config Optional configuration for the offline sync queue.
 */
export function offlineSyncQueueInterceptor(config?: OfflineSyncConfig): WorkerInterceptorFn {
  const dbName = config?.dbName ?? OFFLINE_SYNC_DEFAULTS.DB_NAME;
  const bypassHeader = (config?.bypassHeader ?? OFFLINE_SYNC_DEFAULTS.BYPASS_HEADER).toLowerCase();
  const storeName = OFFLINE_SYNC_DEFAULTS.STORE_NAME;

  let dbPromise: Promise<IDBDatabase> | null = null;

  const getDB = (): Promise<IDBDatabase> => {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
          reject(new Error('IndexedDB is not supported in this environment'));
          return;
        }
        const request = indexedDB.open(dbName, OFFLINE_SYNC_DEFAULTS.DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return dbPromise;
  };

  const enqueue = async (req: SerializableRequest): Promise<string> => {
    const db = await getDB();
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);

    const queued: QueuedRequest = {
      id,
      timestamp: Date.now(),
      request: req,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, OFFLINE_SYNC_DEFAULTS.TX_READWRITE);
      const store = transaction.objectStore(storeName);
      const request = store.add(queued);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  };

  const getQueuedRequests = async (): Promise<QueuedRequest[]> => {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, OFFLINE_SYNC_DEFAULTS.TX_READONLY);
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => {
          const results = request.result as QueuedRequest[];
          // Sort chronologically
          results.sort((a, b) => a.timestamp - b.timestamp);
          resolve(results);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  };

  const dequeue = async (id: string): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, OFFLINE_SYNC_DEFAULTS.TX_READWRITE);
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  // Check if we are online. Web Workers support self.navigator.onLine
  const isOnline = (): boolean => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Fallback
  };

  const drainQueue = async (next: any, throwOnError = false): Promise<void> => {
    try {
      const pending = await getQueuedRequests();
      if (pending.length > 0) {
        console.log(
          `[offlineSyncQueueInterceptor] Online. Draining ${pending.length} queued requests...`,
        );
        for (const queued of pending) {
          try {
            // Add bypass header to prevent infinite recursion
            const requestToRetry = {
              ...queued.request,
              headers: {
                ...queued.request.headers,
                [bypassHeader]: ['true'],
              },
            };
            await next(requestToRetry);
            await dequeue(queued.id);
          } catch (err) {
            console.error(
              `[offlineSyncQueueInterceptor] Sync failed for queued request ${queued.id}:`,
              err,
            );
            // Stop draining on failure to maintain FIFO ordering
            if (throwOnError) {
              throw err;
            }
            break;
          }
        }
      }
    } catch (err) {
      console.error('[offlineSyncQueueInterceptor] Error draining queue:', err);
      if (throwOnError) {
        throw err;
      }
    }
  };

  return async (req, next) => {
    const isMutation = OFFLINE_SYNC_DEFAULTS.MUTATION_METHODS.includes(req.method.toUpperCase());
    const bypass = Object.keys(req.headers).some((h) => h.toLowerCase() === bypassHeader);

    if (bypass) {
      return next(req);
    }

    // Handle the synthetic status request
    if (req.url === OFFLINE_SYNC_DEFAULTS.URL_STATUS) {
      const remaining = await getQueuedRequests();
      return {
        status: OFFLINE_SYNC_DEFAULTS.STATUS_OK,
        statusText: 'OK',
        headers: {
          [OFFLINE_SYNC_DEFAULTS.HEADER_CONTENT_TYPE]: [OFFLINE_SYNC_DEFAULTS.CONTENT_TYPE_JSON],
        },
        body: {
          online: isOnline(),
          pendingCount: remaining.length,
        },
        url: req.url,
      };
    }

    // Handle the synthetic drain request
    if (req.url === OFFLINE_SYNC_DEFAULTS.URL_DRAIN) {
      if (isOnline()) {
        try {
          await drainQueue(next, true);
          const remaining = await getQueuedRequests();
          return {
            status: OFFLINE_SYNC_DEFAULTS.STATUS_OK,
            statusText: 'OK',
            headers: {
              [OFFLINE_SYNC_DEFAULTS.HEADER_CONTENT_TYPE]: [
                OFFLINE_SYNC_DEFAULTS.CONTENT_TYPE_JSON,
              ],
            },
            body: {
              success: true,
              message: 'Queue drained successfully',
              pendingCount: remaining.length,
            },
            url: req.url,
          };
        } catch (err: any) {
          const remaining = await getQueuedRequests();
          return {
            status: OFFLINE_SYNC_DEFAULTS.STATUS_ERROR,
            statusText: 'Sync Error',
            headers: {
              [OFFLINE_SYNC_DEFAULTS.HEADER_CONTENT_TYPE]: [
                OFFLINE_SYNC_DEFAULTS.CONTENT_TYPE_JSON,
              ],
            },
            body: {
              success: false,
              message: err?.message ?? String(err),
              pendingCount: remaining.length,
            },
            url: req.url,
          };
        }
      } else {
        const remaining = await getQueuedRequests();
        return {
          status: OFFLINE_SYNC_DEFAULTS.STATUS_UNAVAILABLE,
          statusText: 'Service Unavailable',
          headers: {
            [OFFLINE_SYNC_DEFAULTS.HEADER_CONTENT_TYPE]: [OFFLINE_SYNC_DEFAULTS.CONTENT_TYPE_JSON],
          },
          body: {
            success: false,
            message: 'Cannot drain queue while offline',
            pendingCount: remaining.length,
          },
          url: req.url,
        };
      }
    }

    // 1. If we are online, drain any pending queued requests first (FIFO)
    if (isOnline()) {
      await drainQueue(next, false);
    }

    // 2. If we are offline and this is a mutation, enqueue it
    if (!isOnline() && isMutation) {
      try {
        const queueId = await enqueue(req);
        console.warn(`[offlineSyncQueueInterceptor] Offline. Mutation queued with ID: ${queueId}`);

        return {
          status: OFFLINE_SYNC_DEFAULTS.STATUS_ACCEPTED,
          statusText: 'Accepted (Enqueued Offline)',
          headers: {
            [OFFLINE_SYNC_DEFAULTS.HEADER_QUEUED_ID]: [queueId],
            [OFFLINE_SYNC_DEFAULTS.HEADER_CONTENT_TYPE]: [OFFLINE_SYNC_DEFAULTS.CONTENT_TYPE_JSON],
          },
          body: {
            queued: true,
            queueId,
            message:
              'La solicitud se ha encolado localmente y se procesará cuando vuelva la conexión.',
          },
          url: req.url,
        };
      } catch (err) {
        console.error('[offlineSyncQueueInterceptor] Failed to queue request:', err);
        throw new Error('No hay conexión a internet y no se pudo encolar la solicitud.');
      }
    }

    return next(req);
  };
}
