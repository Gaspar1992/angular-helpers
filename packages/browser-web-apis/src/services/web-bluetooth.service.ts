import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';

import {
  type BluetoothRequestDeviceOptions,
  type BluetoothDeviceRef,
  type BluetoothRemoteGATTServer,
  type BluetoothRemoteGATTCharacteristic,
  type NavigatorWithExperimentalApis,
} from '../interfaces/experimental-apis.types';

export type { BluetoothRequestDeviceOptions, BluetoothDeviceRef, BluetoothRemoteGATTServer };

export interface BluetoothDeviceInfo {
  id: string;
  name: string | undefined;
  connected: boolean;
}

function getBluetooth(): NavigatorWithExperimentalApis['bluetooth'] {
  return (navigator as NavigatorWithExperimentalApis).bluetooth;
}

@Injectable()
export class WebBluetoothService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'web-bluetooth';
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && !!getBluetooth();
  }

  async requestDevice(
    options: BluetoothRequestDeviceOptions = { acceptAllDevices: true },
  ): Promise<BluetoothDeviceRef> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth API not supported');
    }
    return getBluetooth()!.requestDevice(options);
  }

  async connect(device: BluetoothDeviceRef): Promise<BluetoothRemoteGATTServer> {
    if (!device.gatt) {
      throw new Error('GATT server not available on this device');
    }
    return device.gatt.connect();
  }

  disconnect(device: BluetoothDeviceRef): void {
    device.gatt?.disconnect();
  }

  watchDisconnection(device: BluetoothDeviceRef): Observable<void> {
    return new Observable<void>((subscriber) => {
      const handler = () => subscriber.next();
      device.addEventListener('gattserverdisconnected', handler);
      return () => device.removeEventListener('gattserverdisconnected', handler);
    });
  }

  async readCharacteristic(
    server: BluetoothRemoteGATTServer,
    serviceUuid: string,
    characteristicUuid: string,
  ): Promise<DataView> {
    const service = await server.getPrimaryService(serviceUuid);
    const characteristic = await service.getCharacteristic(characteristicUuid);
    return characteristic.readValue();
  }

  async writeCharacteristic(
    server: BluetoothRemoteGATTServer,
    serviceUuid: string,
    characteristicUuid: string,
    value: BufferSource,
  ): Promise<void> {
    const service = await server.getPrimaryService(serviceUuid);
    const characteristic = await service.getCharacteristic(characteristicUuid);
    await characteristic.writeValue(value);
  }

  watchCharacteristic(
    server: BluetoothRemoteGATTServer,
    serviceUuid: string,
    characteristicUuid: string,
  ): Observable<DataView> {
    return new Observable<DataView>((subscriber) => {
      let characteristic: BluetoothRemoteGATTCharacteristic;

      server
        .getPrimaryService(serviceUuid)
        .then((service) => service.getCharacteristic(characteristicUuid))
        .then((char: BluetoothRemoteGATTCharacteristic) => {
          characteristic = char;
          const handler = (event: Event) => {
            const target = event.target as BluetoothRemoteGATTCharacteristic;
            if (target.value) subscriber.next(target.value);
          };
          characteristic.addEventListener('characteristicvaluechanged', handler);
          return characteristic.startNotifications();
        })
        .catch((err: unknown) => subscriber.error(err));

      return () => {
        characteristic?.stopNotifications().catch(() => {});
      };
    });
  }
}
