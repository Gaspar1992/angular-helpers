import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

import { getOrientationSnapshot, screenOrientationStream } from '../utils/screen-orientation.utils';

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
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'screen' in window && 'orientation' in screen;
  }

  getSnapshot(): OrientationInfo {
    return isPlatformBrowser(this.platformId)
      ? getOrientationSnapshot()
      : { type: 'portrait-primary', angle: 0 };
  }

  get isPortrait(): boolean {
    return this.getSnapshot().type.startsWith('portrait');
  }

  get isLandscape(): boolean {
    return this.getSnapshot().type.startsWith('landscape');
  }

  watch(): Observable<OrientationInfo> {
    return screenOrientationStream();
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
