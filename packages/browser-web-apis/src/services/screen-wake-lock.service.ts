import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';

export type WakeLockType = 'screen';

export interface WakeLockStatus {
  active: boolean;
  type?: WakeLockType;
  released?: boolean;
}

@Injectable()
export class ScreenWakeLockService extends BrowserApiBaseService {
  private sentinel: WakeLockSentinel | null = null;

  protected override getApiName(): string {
    return 'screen-wake-lock';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'screenWakeLock';
  }

  get isActive(): boolean {
    return this.sentinel !== null && !this.sentinel.released;
  }

  async request(type: WakeLockType = 'screen'): Promise<WakeLockStatus> {
    if (!this.isSupported()) {
      throw new Error('Screen Wake Lock API not supported in this browser');
    }

    if (!window.isSecureContext) {
      throw new Error('Screen Wake Lock API requires a secure context (HTTPS)');
    }

    try {
      this.sentinel = await navigator.wakeLock.request(type);

      this.sentinel.addEventListener('release', () => {
        this.sentinel = null;
      });

      this.destroyRef.onDestroy(() => this.release());

      return { active: true, type, released: false };
    } catch (error) {
      this.logError('Failed to acquire wake lock:', error);
      throw this.createError('Failed to acquire wake lock', error);
    }
  }

  async release(): Promise<void> {
    if (this.sentinel && !this.sentinel.released) {
      try {
        await this.sentinel.release();
      } catch {
        // Sentinel may already be released
      } finally {
        this.sentinel = null;
      }
    }
  }

  watchStatus(): Observable<WakeLockStatus> {
    return new Observable<WakeLockStatus>((observer) => {
      const emit = () => observer.next({ active: this.isActive, released: !this.isActive });

      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible' && !this.isActive) {
          try {
            await this.request();
          } catch {
            // Could not re-acquire
          }
        }
        emit();
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      emit();

      const cleanup = () =>
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      this.destroyRef.onDestroy(cleanup);

      return cleanup;
    });
  }
}
