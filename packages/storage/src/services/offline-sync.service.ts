import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { HttpBackend, HttpRequest } from '@angular/common/http';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { injectPlatform } from '@angular-helpers/core';
import { OFFLINE_SYNC_SERVICE_DEFAULTS } from './offline-sync.constants';

@Injectable({ providedIn: 'root' })
export class OfflineSyncService {
  private readonly platform = injectPlatform();
  private readonly destroyRef = inject(DestroyRef);
  private readonly httpBackend = inject(HttpBackend, { optional: true });

  readonly isOnline = signal<boolean>(
    this.platform.isBrowser && typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  readonly pendingSyncsCount = signal<number>(0);

  constructor() {
    if (!this.platform.isBrowser || !this.platform.window) return;

    // Listen to network status changes
    fromEvent(this.platform.window, OFFLINE_SYNC_SERVICE_DEFAULTS.EVENT_ONLINE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isOnline.set(true);
        this.triggerSync();
      });

    fromEvent(this.platform.window, OFFLINE_SYNC_SERVICE_DEFAULTS.EVENT_OFFLINE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isOnline.set(false);
      });

    // Initial check of the offline sync queue size
    this.checkPendingCount();
  }

  /**
   * Triggers the offline sync queue draining pipeline in the worker.
   */
  triggerSync(): void {
    if (this.platform.isBrowser && typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn('[OfflineSyncService] Cannot trigger sync while offline.');
      return;
    }

    console.log(
      '[OfflineSyncService] Conectividad recuperada o trigger manual. Iniciando drenado de cola...',
    );

    if (this.httpBackend) {
      const req = new HttpRequest(
        OFFLINE_SYNC_SERVICE_DEFAULTS.HTTP_METHOD_GET,
        OFFLINE_SYNC_SERVICE_DEFAULTS.URL_DRAIN,
      );
      this.httpBackend
        .handle(req)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res: any) => {
            // If the response is fully received, check the pending count
            if (res && res.body) {
              const body = res.body as { success: boolean; pendingCount?: number };
              if (body.pendingCount !== undefined) {
                this.pendingSyncsCount.set(body.pendingCount);
              } else {
                this.checkPendingCount();
              }
            }
          },
          error: (err) => {
            console.error('[OfflineSyncService] Error draining offline queue:', err);
            this.checkPendingCount();
          },
        });
    } else {
      console.warn(
        '[OfflineSyncService] HttpBackend not available. Unable to trigger sync automatically.',
      );
      this.checkPendingCount();
    }
  }

  /**
   * Manually checks the number of pending queued requests in IndexedDB.
   */
  checkPendingCount(): Promise<number> {
    return new Promise<number>((resolve) => {
      if (typeof indexedDB === 'undefined') {
        this.pendingSyncsCount.set(0);
        resolve(0);
        return;
      }

      try {
        const request = indexedDB.open(
          OFFLINE_SYNC_SERVICE_DEFAULTS.DB_NAME,
          OFFLINE_SYNC_SERVICE_DEFAULTS.DB_VERSION,
        );
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(OFFLINE_SYNC_SERVICE_DEFAULTS.STORE_NAME)) {
            db.close();
            this.pendingSyncsCount.set(0);
            resolve(0);
            return;
          }

          const transaction = db.transaction(
            OFFLINE_SYNC_SERVICE_DEFAULTS.STORE_NAME,
            OFFLINE_SYNC_SERVICE_DEFAULTS.TX_READONLY,
          );
          const store = transaction.objectStore(OFFLINE_SYNC_SERVICE_DEFAULTS.STORE_NAME);
          const countRequest = store.count();

          countRequest.onsuccess = () => {
            const count = countRequest.result;
            this.pendingSyncsCount.set(count);
            db.close();
            resolve(count);
          };

          countRequest.onerror = () => {
            db.close();
            this.pendingSyncsCount.set(0);
            resolve(0);
          };
        };

        request.onerror = () => {
          this.pendingSyncsCount.set(0);
          resolve(0);
        };
      } catch (err) {
        console.error('[OfflineSyncService] Error opening IndexedDB:', err);
        this.pendingSyncsCount.set(0);
        resolve(0);
      }
    });
  }
}
