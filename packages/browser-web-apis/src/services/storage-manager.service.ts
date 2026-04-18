import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';

export interface StorageQuotaEstimate {
  /** Bytes currently used by the origin (best-effort). */
  usage: number;
  /** Maximum bytes the origin may use (best-effort). */
  quota: number;
  /** Per-storage-type breakdown, when the browser provides it. */
  usageDetails?: Record<string, number>;
}

interface StorageManagerLike {
  estimate?: () => Promise<StorageEstimate>;
  persist?: () => Promise<boolean>;
  persisted?: () => Promise<boolean>;
}

interface NavigatorWithStorageManager {
  storage?: StorageManagerLike;
}

/**
 * Service wrapping `navigator.storage` (StorageManager API). Exposes:
 * - `estimate()`: how much origin storage is in use vs available
 * - `persist()`: ask the browser to make storage persistent (eviction-protected)
 * - `persisted()`: check whether storage is currently persistent
 */
@Injectable()
export class StorageManagerService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'storage-manager';
  }

  isSupported(): boolean {
    if (!this.isBrowserEnvironment()) return false;
    const sm = (navigator as unknown as NavigatorWithStorageManager).storage;
    return !!sm && typeof sm.estimate === 'function';
  }

  async estimate(): Promise<StorageQuotaEstimate> {
    this.ensureSupported();
    const sm = (navigator as unknown as NavigatorWithStorageManager).storage!;
    const result = await sm.estimate!();
    return {
      usage: result.usage ?? 0,
      quota: result.quota ?? 0,
      usageDetails: (result as StorageEstimate & { usageDetails?: Record<string, number> })
        .usageDetails,
    };
  }

  async persist(): Promise<boolean> {
    this.ensureSupported();
    const sm = (navigator as unknown as NavigatorWithStorageManager).storage!;
    if (typeof sm.persist !== 'function') return false;
    return sm.persist();
  }

  async persisted(): Promise<boolean> {
    this.ensureSupported();
    const sm = (navigator as unknown as NavigatorWithStorageManager).storage!;
    if (typeof sm.persisted !== 'function') return false;
    return sm.persisted();
  }

  protected override ensureSupported(): void {
    super.ensureSupported();
    if (!this.isSupported()) {
      throw new Error('StorageManager API not supported in this browser');
    }
  }
}
