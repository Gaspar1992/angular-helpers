import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type Subscription } from 'rxjs';
import { DeviceOrientationService } from '../services/device-orientation.service';
import type { DeviceOrientationData, DeviceSensorConfig } from '../utils/device-orientation.utils';

export interface DeviceOrientationRef {
  readonly isSupported: Signal<boolean>;
  readonly data: Signal<DeviceOrientationData | null>;
  readonly error: Signal<Error | null>;
  readonly permissionState: Signal<'prompt' | 'granted' | 'denied'>;
  requestPermission(): Promise<'prompt' | 'granted' | 'denied'>;
  start(config?: DeviceSensorConfig): void;
  stop(): void;
}

export function injectDeviceOrientation(): DeviceOrientationRef {
  assertInInjectionContext(injectDeviceOrientation);
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const service = inject(DeviceOrientationService);

  const isSupported = signal<boolean>(false);
  const data = signal<DeviceOrientationData | null>(null);
  const error = signal<Error | null>(null);

  let sub: Subscription | null = null;
  let disposed = false;

  if (isBrowser) {
    let destroyed = false;
    queueMicrotask(() => {
      if (destroyed) return;
      isSupported.set(service.isSupported());
    });

    destroyRef.onDestroy(() => {
      destroyed = true;
      disposed = true;
      if (sub) {
        sub.unsubscribe();
        sub = null;
      }
    });
  } else {
    destroyRef.onDestroy(() => {
      disposed = true;
    });
  }

  const start = (config?: DeviceSensorConfig): void => {
    if (!service.isSupported() || disposed) {
      data.set(null);
      return;
    }
    stop();
    sub = service.watch(config).subscribe({
      next: (val) => data.set(val),
      error: (err) => {
        error.set(err instanceof Error ? err : new Error(String(err)));
      },
    });
  };

  const stop = (): void => {
    if (sub) {
      sub.unsubscribe();
      sub = null;
    }
  };

  const requestPermission = async (): Promise<'prompt' | 'granted' | 'denied'> => {
    if (!service.isSupported() || disposed) {
      return 'denied';
    }
    try {
      return await service.requestPermission();
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      error.set(errorObj);
      throw errorObj;
    }
  };

  return {
    isSupported: isSupported.asReadonly(),
    data: data.asReadonly(),
    error: error.asReadonly(),
    permissionState: service.permissionState,
    requestPermission,
    start,
    stop,
  };
}
