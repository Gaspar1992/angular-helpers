import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';

interface LockOptionsLike {
  mode?: 'exclusive' | 'shared';
  ifAvailable?: boolean;
  steal?: boolean;
  signal?: AbortSignal;
}

interface LockInfoLike {
  name: string;
  mode: 'exclusive' | 'shared';
  clientId: string;
}

interface LockManagerSnapshot {
  held: LockInfoLike[];
  pending: LockInfoLike[];
}

interface LockManagerLike {
  request<T>(name: string, callback: (lock: unknown) => Promise<T> | T): Promise<T>;
  request<T>(
    name: string,
    options: LockOptionsLike,
    callback: (lock: unknown) => Promise<T> | T,
  ): Promise<T>;
  query(): Promise<LockManagerSnapshot>;
}

interface NavigatorWithLocks {
  locks?: LockManagerLike;
}

/**
 * Service wrapping `navigator.locks` (Web Locks API). Coordinates exclusive or
 * shared access to a named resource across tabs and workers.
 *
 * ```ts
 * const locks = inject(WebLocksService);
 * await locks.acquire('user-cache', async () => {
 *   // critical section — no other tab is in this block at the same time
 * });
 * ```
 */
@Injectable()
export class WebLocksService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'web-locks';
  }

  isSupported(): boolean {
    if (!this.isBrowserEnvironment()) return false;
    return !!(navigator as unknown as NavigatorWithLocks).locks;
  }

  /**
   * Acquire a lock and run the callback while holding it. The lock is released
   * automatically when the callback resolves or rejects.
   */
  acquire<T>(
    name: string,
    callback: () => Promise<T> | T,
    options: LockOptionsLike = {},
  ): Promise<T> {
    this.ensureSupported();
    const nav = navigator as unknown as NavigatorWithLocks;
    if (Object.keys(options).length === 0) {
      return nav.locks!.request<T>(name, () => callback());
    }
    return nav.locks!.request<T>(name, options, () => callback());
  }

  /**
   * Query the current lock state. Useful for diagnostics and tests; do not gate
   * critical-section logic on this — it's a snapshot, not a reservation.
   */
  query(): Promise<LockManagerSnapshot> {
    this.ensureSupported();
    return (navigator as unknown as NavigatorWithLocks).locks!.query();
  }

  protected override ensureSupported(): void {
    super.ensureSupported();
    if (!this.isSupported()) {
      throw new Error('Web Locks API not supported in this browser');
    }
  }
}
