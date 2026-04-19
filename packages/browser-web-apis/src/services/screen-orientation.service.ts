import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';

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
export class ScreenOrientationService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'screen-orientation';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'screenOrientation';
  }

  getSnapshot(): OrientationInfo {
    return this.isBrowserEnvironment()
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
      this.logError('Failed to lock orientation:', error);
      throw error;
    }
  }

  unlock(): void {
    if (this.isSupported()) {
      screen.orientation.unlock();
    }
  }
}
