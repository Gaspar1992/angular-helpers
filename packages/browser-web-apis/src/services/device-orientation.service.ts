import { Injectable, inject, NgZone, signal, type Signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';
import {
  type DeviceOrientationData,
  type DeviceSensorConfig,
  requestDeviceOrientationPermission,
  createDeviceOrientationStream,
} from '../utils/device-orientation.utils';

@Injectable()
export class DeviceOrientationService extends BrowserApiBaseService {
  private readonly ngZone = inject(NgZone);
  private readonly permission = signal<'prompt' | 'granted' | 'denied'>(
    !this.isSupported()
      ? 'denied'
      : typeof DeviceOrientationEvent !== 'undefined' &&
          typeof (DeviceOrientationEvent as any).requestPermission === 'function'
        ? 'prompt'
        : 'granted',
  );
  readonly permissionState = this.permission.asReadonly();

  protected override getApiName(): string {
    return 'deviceOrientation';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'deviceOrientation';
  }

  async requestPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!this.isSupported()) {
      this.permission.set('denied');
      return 'denied';
    }
    const state = await requestDeviceOrientationPermission();
    this.permission.set(state as 'granted' | 'denied' | 'prompt');
    return state as 'granted' | 'denied' | 'prompt';
  }

  watch(config?: DeviceSensorConfig): Observable<DeviceOrientationData | null> {
    if (!this.isSupported()) {
      return of(null);
    }
    return createDeviceOrientationStream(config, this.ngZone);
  }
}
