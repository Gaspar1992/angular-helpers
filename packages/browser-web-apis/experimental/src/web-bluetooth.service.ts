import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from '@angular-helpers/browser-web-apis';
import {
  type BluetoothRequestDeviceOptions,
  type BluetoothDeviceRef,
  type BluetoothRemoteGATTServer,
  type NavigatorWithExperimentalApis,
} from './experimental-apis.types';

export type { BluetoothRequestDeviceOptions, BluetoothDeviceRef, BluetoothRemoteGATTServer };

function getBluetoothApi(): NavigatorWithExperimentalApis['bluetooth'] {
  return (navigator as NavigatorWithExperimentalApis).bluetooth;
}

@Injectable()
export class WebBluetoothService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'web-bluetooth';
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && 'bluetooth' in navigator;
  }

  async requestDevice(options?: BluetoothRequestDeviceOptions): Promise<BluetoothDeviceRef> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth API not supported');
    }

    const device = await getBluetoothApi()!.requestDevice(options ?? {});
    return device;
  }

  async getConnectedDevices(): Promise<BluetoothDeviceRef[]> {
    // Note: Web Bluetooth does not expose an API to list all connected devices
    // Devices must be paired/connected per session
    return [];
  }

  watchConnectionChanges(): Observable<{ device: BluetoothDeviceRef; connected: boolean }> {
    return new Observable((subscriber) => {
      // Web Bluetooth doesn't have a global connection event
      // This would need to be implemented per-device via gattserverdisconnected
      subscriber.complete();
    });
  }
}
