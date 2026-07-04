import { Injectable, inject, NgZone, signal, Signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';
import {
  DeviceMotionData,
  DeviceSensorConfig,
  requestDeviceMotionPermission,
  createDeviceMotionStream,
} from '../utils/device-orientation.utils';

@Injectable()
export class DeviceMotionService extends BrowserApiBaseService {
  private readonly ngZone = inject(NgZone);
  private readonly permission = signal<'prompt' | 'granted' | 'denied'>(
    !this.isSupported()
      ? 'denied'
      : typeof DeviceMotionEvent !== 'undefined' &&
          typeof (DeviceMotionEvent as any).requestPermission === 'function'
        ? 'prompt'
        : 'granted',
  );
  readonly permissionState = this.permission.asReadonly();

  protected override getApiName(): string {
    return 'deviceMotion';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'deviceMotion';
  }

  async requestPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!this.isSupported()) {
      this.permission.set('denied');
      return 'denied';
    }
    const state = await requestDeviceMotionPermission();
    this.permission.set(state as 'granted' | 'denied' | 'prompt');
    return state as 'granted' | 'denied' | 'prompt';
  }

  watch(config?: DeviceSensorConfig): Observable<DeviceMotionData | null> {
    if (!this.isSupported()) {
      return of(null);
    }
    return createDeviceMotionStream(config, this.ngZone);
  }
}
