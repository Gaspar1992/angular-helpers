import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import {
  WebBluetoothService,
  type BluetoothDevice,
  type BluetoothRemoteGATTServer,
  type BluetoothRemoteGATTCharacteristic,
  type BluetoothRequestDeviceOptions,
} from '../services/web-bluetooth.service';

export interface BluetoothRef {
  readonly isSupported: Signal<boolean>;
  readonly device: Signal<BluetoothDevice | null>;
  readonly connected: Signal<boolean>;
  readonly error: Signal<Error | null>;
  requestDevice(options?: BluetoothRequestDeviceOptions): Promise<BluetoothDevice | null>;
  connect(targetDevice?: BluetoothDevice): Promise<BluetoothRemoteGATTServer | null>;
  disconnect(): void;
  readCharacteristic(characteristic: BluetoothRemoteGATTCharacteristic): Promise<DataView | null>;
  writeCharacteristic(
    characteristic: BluetoothRemoteGATTCharacteristic,
    data: BufferSource,
    withoutResponse?: boolean,
  ): Promise<boolean>;
  watchNotifications(characteristic: BluetoothRemoteGATTCharacteristic): Observable<DataView>;
}

export function injectBluetooth(): BluetoothRef {
  assertInInjectionContext(injectBluetooth);

  const platformId = inject(PLATFORM_ID);
  const destroyRef = inject(DestroyRef);
  const service = inject(WebBluetoothService);
  const isBrowser = isPlatformBrowser(platformId);

  const supported = signal<boolean>(false);
  const currentDevice = signal<BluetoothDevice | null>(null);
  const isConnected = signal<boolean>(false);
  const errorSignal = signal<Error | null>(null);

  let disconnectListener: ((event: Event) => void) | null = null;
  let activeDevice: BluetoothDevice | null = null;
  const activeSubscriptions: Subscription[] = [];
  let disposed = false;

  const removeDeviceListeners = () => {
    if (activeDevice && disconnectListener) {
      activeDevice.removeEventListener('gattserverdisconnected', disconnectListener);
      disconnectListener = null;
    }
  };

  const attachDeviceListeners = (dev: BluetoothDevice) => {
    removeDeviceListeners();
    activeDevice = dev;
    disconnectListener = () => {
      if (!disposed) {
        isConnected.set(false);
      }
    };
    dev.addEventListener('gattserverdisconnected', disconnectListener);
  };

  if (isBrowser) {
    let destroyed = false;
    queueMicrotask(() => {
      if (destroyed) return;
      supported.set(service.isSupported());
    });

    destroyRef.onDestroy(() => {
      destroyed = true;
      disposed = true;
      activeSubscriptions.forEach((sub) => sub.unsubscribe());
      activeSubscriptions.length = 0;

      if (activeDevice) {
        removeDeviceListeners();
        try {
          service.disconnectGatt(activeDevice);
        } catch {
          // Ignore error during destroy
        }
        activeDevice = null;
      }
    });
  } else {
    destroyRef.onDestroy(() => {
      disposed = true;
    });
  }

  const requestDevice = async (
    options?: BluetoothRequestDeviceOptions,
  ): Promise<BluetoothDevice | null> => {
    if (!supported() || disposed) {
      errorSignal.set(new Error('Web Bluetooth API is not supported in this environment'));
      return null;
    }

    errorSignal.set(null);
    try {
      const dev = await service.requestDevice(options);
      currentDevice.set(dev);
      attachDeviceListeners(dev);
      isConnected.set(dev.gatt?.connected ?? false);
      return dev;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorSignal.set(error);
      return null;
    }
  };

  const connect = async (
    targetDevice?: BluetoothDevice,
  ): Promise<BluetoothRemoteGATTServer | null> => {
    const dev = targetDevice ?? currentDevice();
    if (!dev) {
      const err = new Error('No Bluetooth device available to connect');
      errorSignal.set(err);
      return null;
    }

    if (!supported() || disposed) {
      errorSignal.set(new Error('Web Bluetooth API is not supported in this environment'));
      return null;
    }

    errorSignal.set(null);
    try {
      if (dev !== activeDevice) {
        currentDevice.set(dev);
        attachDeviceListeners(dev);
      }
      const server = await service.connectGatt(dev);
      isConnected.set(true);
      return server;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorSignal.set(error);
      return null;
    }
  };

  const disconnect = (): void => {
    const dev = currentDevice();
    if (dev) {
      try {
        service.disconnectGatt(dev);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        errorSignal.set(error);
      }
    }
    isConnected.set(false);
  };

  const readCharacteristic = async (
    characteristic: BluetoothRemoteGATTCharacteristic,
  ): Promise<DataView | null> => {
    if (!supported() || disposed) {
      errorSignal.set(new Error('Web Bluetooth API is not supported in this environment'));
      return null;
    }

    errorSignal.set(null);
    try {
      return await service.readCharacteristic(characteristic);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorSignal.set(error);
      return null;
    }
  };

  const writeCharacteristic = async (
    characteristic: BluetoothRemoteGATTCharacteristic,
    data: BufferSource,
    withoutResponse = false,
  ): Promise<boolean> => {
    if (!supported() || disposed) {
      errorSignal.set(new Error('Web Bluetooth API is not supported in this environment'));
      return false;
    }

    errorSignal.set(null);
    try {
      await service.writeCharacteristic(characteristic, data, withoutResponse);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorSignal.set(error);
      return false;
    }
  };

  const watchNotifications = (
    characteristic: BluetoothRemoteGATTCharacteristic,
  ): Observable<DataView> => {
    return service.watchCharacteristicNotifications(characteristic);
  };

  return {
    isSupported: supported.asReadonly(),
    device: currentDevice.asReadonly(),
    connected: isConnected.asReadonly(),
    error: errorSignal.asReadonly(),
    requestDevice,
    connect,
    disconnect,
    readCharacteristic,
    writeCharacteristic,
    watchNotifications,
  };
}
