import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';

export type BluetoothServiceUUID = string | number;
export type BluetoothCharacteristicUUID = string | number;
export type BluetoothDescriptorUUID = string | number;

export interface BluetoothManufacturerDataFilter {
  companyIdentifier: number;
  dataPrefix?: BufferSource;
  mask?: BufferSource;
}

export interface BluetoothServiceDataFilter {
  service: BluetoothServiceUUID;
  dataPrefix?: BufferSource;
  mask?: BufferSource;
}

export interface BluetoothLEScanFilterInit {
  name?: string;
  namePrefix?: string;
  services?: BluetoothServiceUUID[];
  manufacturerData?: BluetoothManufacturerDataFilter[];
  serviceData?: BluetoothServiceDataFilter[];
}

export interface BluetoothRequestDeviceOptions {
  filters?: BluetoothLEScanFilterInit[];
  optionalServices?: BluetoothServiceUUID[];
  optionalManufacturerData?: number[];
  acceptAllDevices?: boolean;
}

export interface BluetoothCharacteristicProperties {
  readonly broadcast: boolean;
  readonly read: boolean;
  readonly writeWithoutResponse: boolean;
  readonly write: boolean;
  readonly notify: boolean;
  readonly indicate: boolean;
  readonly authenticatedSignedWrites: boolean;
  readonly reliableWrite: boolean;
  readonly writableAuxiliaries: boolean;
}

export interface BluetoothRemoteGATTDescriptor {
  readonly characteristic: BluetoothRemoteGATTCharacteristic;
  readonly uuid: string;
  readonly value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
}

export interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly service: BluetoothRemoteGATTService;
  readonly uuid: string;
  readonly properties: BluetoothCharacteristicProperties;
  readonly value?: DataView;
  getDescriptor(descriptor: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor>;
  getDescriptors(descriptor?: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor[]>;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithResponse?(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

export interface BluetoothRemoteGATTService {
  readonly device: BluetoothDevice;
  readonly uuid: string;
  readonly isPrimary: boolean;
  getCharacteristic(
    characteristic: BluetoothCharacteristicUUID,
  ): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(
    characteristic?: BluetoothCharacteristicUUID,
  ): Promise<BluetoothRemoteGATTCharacteristic[]>;
  getIncludedService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  getIncludedServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

export interface BluetoothRemoteGATTServer {
  readonly device: BluetoothDevice;
  readonly connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

export interface BluetoothDevice extends EventTarget {
  readonly id: string;
  readonly name?: string;
  readonly gatt?: BluetoothRemoteGATTServer;
  readonly watchingAdvertisements?: boolean;
  watchAdvertisements?(): Promise<void>;
  unwatchAdvertisements?(): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

export interface BluetoothNavigator extends Navigator {
  bluetooth?: {
    getAvailability?(): Promise<boolean>;
    getDevices?(): Promise<BluetoothDevice[]>;
    requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
    addEventListener?(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener?(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions,
    ): void;
  };
}

@Injectable({
  providedIn: 'root',
})
export class WebBluetoothService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'web-bluetooth';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'webBluetooth';
  }

  override isSupported(): boolean {
    return (
      super.isSupported() &&
      typeof navigator !== 'undefined' &&
      'bluetooth' in navigator &&
      (typeof window === 'undefined' || window.isSecureContext)
    );
  }

  protected override ensureSupported(): void {
    super.ensureSupported();
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      throw new Error('Web Bluetooth API requires a secure context (HTTPS)');
    }
  }

  private get bluetoothApi(): BluetoothNavigator['bluetooth'] | undefined {
    return typeof navigator !== 'undefined'
      ? (navigator as BluetoothNavigator).bluetooth
      : undefined;
  }

  /**
   * Requests a Bluetooth device from the user matching the specified options.
   */
  async requestDevice(options?: BluetoothRequestDeviceOptions): Promise<BluetoothDevice> {
    this.ensureSupported();
    const api = this.bluetoothApi;
    if (!api || typeof api.requestDevice !== 'function') {
      throw this.createError('Web Bluetooth requestDevice is not supported');
    }

    const defaultOptions: BluetoothRequestDeviceOptions = options ?? { acceptAllDevices: true };
    return api.requestDevice(defaultOptions);
  }

  /**
   * Gets a list of permitted Bluetooth devices for this origin.
   */
  async getDevices(): Promise<BluetoothDevice[]> {
    this.ensureSupported();
    const api = this.bluetoothApi;
    if (!api || typeof api.getDevices !== 'function') {
      return [];
    }
    return api.getDevices();
  }

  /**
   * Queries whether Bluetooth is available on the user's device/adapter.
   */
  async getAvailability(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }
    const api = this.bluetoothApi;
    if (api && typeof api.getAvailability === 'function') {
      return api.getAvailability();
    }
    return true;
  }

  /**
   * Connects to the GATT server on the specified device.
   */
  async connectGatt(device: BluetoothDevice): Promise<BluetoothRemoteGATTServer> {
    this.ensureSupported();
    if (!device.gatt) {
      throw this.createError('Device does not provide a GATT server');
    }
    return device.gatt.connect();
  }

  /**
   * Disconnects from the GATT server on the specified device.
   */
  disconnectGatt(device: BluetoothDevice): void {
    this.ensureSupported();
    if (device.gatt?.connected) {
      device.gatt.disconnect();
    }
  }

  /**
   * Reads the value of a GATT characteristic.
   */
  async readCharacteristic(characteristic: BluetoothRemoteGATTCharacteristic): Promise<DataView> {
    this.ensureSupported();
    if (!characteristic || typeof characteristic.readValue !== 'function') {
      throw this.createError('Invalid characteristic or readValue not available');
    }
    return characteristic.readValue();
  }

  /**
   * Writes data to a GATT characteristic.
   */
  async writeCharacteristic(
    characteristic: BluetoothRemoteGATTCharacteristic,
    data: BufferSource,
    withoutResponse = false,
  ): Promise<void> {
    this.ensureSupported();
    if (!characteristic) {
      throw this.createError('Invalid characteristic');
    }

    if (withoutResponse && typeof characteristic.writeValueWithoutResponse === 'function') {
      await characteristic.writeValueWithoutResponse(data);
    } else if (typeof characteristic.writeValueWithResponse === 'function') {
      await characteristic.writeValueWithResponse(data);
    } else if (typeof characteristic.writeValue === 'function') {
      await characteristic.writeValue(data);
    } else {
      throw this.createError('Characteristic does not support writeValue');
    }
  }

  /**
   * Observes value changes (notifications/indications) on a GATT characteristic.
   */
  watchCharacteristicNotifications(
    characteristic: BluetoothRemoteGATTCharacteristic,
  ): Observable<DataView> {
    if (!this.isSupported()) {
      return throwError(() => this.createError('Web Bluetooth API not supported'));
    }

    return new Observable<DataView>((subscriber) => {
      let isSubscribed = true;

      const handler = (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        if (target?.value) {
          subscriber.next(target.value);
        }
      };

      characteristic.addEventListener('characteristicvaluechanged', handler);

      characteristic
        .startNotifications()
        .then(() => {
          // Started successfully
        })
        .catch((err) => {
          if (isSubscribed) {
            subscriber.error(err);
          }
        });

      return () => {
        isSubscribed = false;
        characteristic.removeEventListener('characteristicvaluechanged', handler);
        try {
          void characteristic.stopNotifications();
        } catch {
          // Ignore error during cleanup
        }
      };
    });
  }
}
