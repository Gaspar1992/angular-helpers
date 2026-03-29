import { Injectable, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

export type OrientationType =
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary';

export type OrientationLockType =
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary';

interface ScreenOrientationWithLock extends ScreenOrientation {
  lock(orientation: OrientationLockType): Promise<void>;
}

export interface OrientationInfo {
  type: OrientationType;
  angle: number;
}

@Injectable()
export class ScreenOrientationService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'screen' in window && 'orientation' in screen;
  }

  getSnapshot(): OrientationInfo {
    if (!this.isSupported()) {
      return { type: 'portrait-primary', angle: 0 };
    }
    return {
      type: screen.orientation.type as OrientationType,
      angle: screen.orientation.angle,
    };
  }

  get isPortrait(): boolean {
    return this.getSnapshot().type.startsWith('portrait');
  }

  get isLandscape(): boolean {
    return this.getSnapshot().type.startsWith('landscape');
  }

  watch(): Observable<OrientationInfo> {
    return new Observable<OrientationInfo>((observer) => {
      if (!this.isSupported()) {
        observer.next({ type: 'portrait-primary', angle: 0 });
        observer.complete();
        return undefined;
      }

      const handler = () => observer.next(this.getSnapshot());
      screen.orientation.addEventListener('change', handler);
      observer.next(this.getSnapshot());

      const cleanup = () => screen.orientation.removeEventListener('change', handler);
      this.destroyRef.onDestroy(cleanup);

      return cleanup;
    });
  }

  async lock(orientation: OrientationLockType): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Screen Orientation API not supported');
    }
    try {
      await (screen.orientation as ScreenOrientationWithLock).lock(orientation);
    } catch (error) {
      console.error('[ScreenOrientationService] Failed to lock orientation:', error);
      throw error;
    }
  }

  unlock(): void {
    if (this.isSupported()) {
      screen.orientation.unlock();
    }
  }
}
