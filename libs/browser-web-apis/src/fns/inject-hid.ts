import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subscription, tap } from 'rxjs';
import {
  WebHidService,
  type HIDDevice,
  type HIDDeviceRequestOptions,
  type HIDInputReportEvent,
} from '../services/web-hid.service';

export interface HidRef {
  readonly isSupported: Signal<boolean>;
  readonly devices: Signal<HIDDevice[]>;
  readonly selectedDevice: Signal<HIDDevice | null>;
  readonly isOpen: Signal<boolean>;
  readonly lastInputReport: Signal<HIDInputReportEvent | null>;
  readonly error: Signal<Error | null>;
  requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[] | null>;
  selectDevice(device: HIDDevice | null): void;
  open(device?: HIDDevice): Promise<boolean>;
  close(device?: HIDDevice): Promise<void>;
  sendReport(reportId: number, data: BufferSource, device?: HIDDevice): Promise<boolean>;
  sendFeatureReport(reportId: number, data: BufferSource, device?: HIDDevice): Promise<boolean>;
  receiveFeatureReport(reportId: number, device?: HIDDevice): Promise<DataView | null>;
  watchInputReports(device?: HIDDevice): Observable<HIDInputReportEvent>;
}

export function injectHid(): HidRef {
  assertInInjectionContext(injectHid);

  const platformId = inject(PLATFORM_ID);
  const destroyRef = inject(DestroyRef);
  const service = inject(WebHidService);
  const isBrowser = isPlatformBrowser(platformId);

  const supported = signal<boolean>(false);
  const deviceList = signal<HIDDevice[]>([]);
  const currentDevice = signal<HIDDevice | null>(null);
  const isDeviceOpen = signal<boolean>(false);
  const latestInputReport = signal<HIDInputReportEvent | null>(null);
  const errorSignal = signal<Error | null>(null);

  let activeReportSubscription: Subscription | null = null;
  let activeDevice: HIDDevice | null = null;
  let disposed = false;

  if (isBrowser) {
    let destroyed = false;
    queueMicrotask(() => {
      if (destroyed) return;
      const isApiSupported = service.isSupported();
      supported.set(isApiSupported);
      if (isApiSupported) {
        service
          .getDevices()
          .then((devs) => {
            if (!destroyed && devs.length > 0) {
              deviceList.set(devs);
              if (!currentDevice()) {
                currentDevice.set(devs[0]);
                activeDevice = devs[0];
                isDeviceOpen.set(devs[0].opened);
              }
            }
          })
          .catch(() => {
            // Ignore error loading initial devices
          });
      }
    });

    destroyRef.onDestroy(() => {
      destroyed = true;
      disposed = true;
      if (activeReportSubscription) {
        activeReportSubscription.unsubscribe();
        activeReportSubscription = null;
      }
      if (activeDevice && isDeviceOpen()) {
        try {
          void service.closeDevice(activeDevice);
        } catch {
          // Ignore close error on teardown
        }
        activeDevice = null;
      }
    });
  } else {
    destroyRef.onDestroy(() => {
      disposed = true;
    });
  }

  const requestDevice = async (options: HIDDeviceRequestOptions): Promise<HIDDevice[] | null> => {
    if (!supported() || disposed) {
      errorSignal.set(new Error('WebHID API is not supported in this environment'));
      return null;
    }

    errorSignal.set(null);
    try {
      const devs = await service.requestDevice(options);
      deviceList.set(devs);
      if (devs.length > 0) {
        currentDevice.set(devs[0]);
        activeDevice = devs[0];
        isDeviceOpen.set(devs[0].opened);
      }
      return devs;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorSignal.set(error);
      return null;
    }
  };

  const selectDevice = (device: HIDDevice | null): void => {
    currentDevice.set(device);
    activeDevice = device;
    isDeviceOpen.set(device?.opened ?? false);
  };

  const open = async (device?: HIDDevice): Promise<boolean> => {
    const dev = device ?? currentDevice();
    if (!dev) {
      const err = new Error('No HID device available to open');
      errorSignal.set(err);
      return false;
    }

    if (!supported() || disposed) {
      errorSignal.set(new Error('WebHID API is not supported in this environment'));
      return false;
    }

    errorSignal.set(null);
    try {
      if (dev !== activeDevice) {
        currentDevice.set(dev);
        activeDevice = dev;
      }
      await service.openDevice(dev);
      isDeviceOpen.set(true);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorSignal.set(error);
      return false;
    }
  };

  const close = async (device?: HIDDevice): Promise<void> => {
    if (activeReportSubscription) {
      activeReportSubscription.unsubscribe();
      activeReportSubscription = null;
    }

    const dev = device ?? currentDevice();
    if (dev) {
      try {
        await service.closeDevice(dev);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        errorSignal.set(error);
      }
    }
    isDeviceOpen.set(false);
  };

  const sendReport = async (
    reportId: number,
    data: BufferSource,
    device?: HIDDevice,
  ): Promise<boolean> => {
    const dev = device ?? currentDevice();
    if (!dev) {
      const err = new Error('No HID device available to send report');
      errorSignal.set(err);
      return false;
    }

    if (!supported() || disposed) {
      errorSignal.set(new Error('WebHID API is not supported in this environment'));
      return false;
    }

    errorSignal.set(null);
    try {
      await service.sendReport(dev, reportId, data);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorSignal.set(error);
      return false;
    }
  };

  const sendFeatureReport = async (
    reportId: number,
    data: BufferSource,
    device?: HIDDevice,
  ): Promise<boolean> => {
    const dev = device ?? currentDevice();
    if (!dev) {
      const err = new Error('No HID device available to send feature report');
      errorSignal.set(err);
      return false;
    }

    if (!supported() || disposed) {
      errorSignal.set(new Error('WebHID API is not supported in this environment'));
      return false;
    }

    errorSignal.set(null);
    try {
      await service.sendFeatureReport(dev, reportId, data);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorSignal.set(error);
      return false;
    }
  };

  const receiveFeatureReport = async (
    reportId: number,
    device?: HIDDevice,
  ): Promise<DataView | null> => {
    const dev = device ?? currentDevice();
    if (!dev) {
      const err = new Error('No HID device available to receive feature report');
      errorSignal.set(err);
      return null;
    }

    if (!supported() || disposed) {
      errorSignal.set(new Error('WebHID API is not supported in this environment'));
      return null;
    }

    errorSignal.set(null);
    try {
      return await service.receiveFeatureReport(dev, reportId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorSignal.set(error);
      return null;
    }
  };

  const watchInputReports = (device?: HIDDevice): Observable<HIDInputReportEvent> => {
    const dev = device ?? currentDevice();
    if (!dev) {
      return service.watchInputReports(null as unknown as HIDDevice);
    }

    const stream$ = service.watchInputReports(dev).pipe(
      tap({
        next: (report) => {
          if (!disposed) {
            latestInputReport.set(report);
          }
        },
        error: (err) => {
          if (!disposed) {
            const error = err instanceof Error ? err : new Error(String(err));
            errorSignal.set(error);
          }
        },
      }),
    );

    return stream$;
  };

  return {
    isSupported: supported.asReadonly(),
    devices: deviceList.asReadonly(),
    selectedDevice: currentDevice.asReadonly(),
    isOpen: isDeviceOpen.asReadonly(),
    lastInputReport: latestInputReport.asReadonly(),
    error: errorSignal.asReadonly(),
    requestDevice,
    selectDevice,
    open,
    close,
    sendReport,
    sendFeatureReport,
    receiveFeatureReport,
    watchInputReports,
  };
}
