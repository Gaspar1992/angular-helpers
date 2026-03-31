import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

import {
  type UsbDeviceRef,
  type UsbDeviceFilterDef,
  type UsbTransferResult,
  type NavigatorWithExperimentalApis,
} from '../interfaces/experimental-apis.types';

export type { UsbDeviceRef, UsbDeviceFilterDef, UsbTransferResult };

export interface UsbDeviceInfo {
  vendorId: number;
  productId: number;
  productName: string | undefined;
  manufacturerName: string | undefined;
  serialNumber: string | undefined;
  opened: boolean;
}

function getUsb(): NavigatorWithExperimentalApis['usb'] {
  return (navigator as NavigatorWithExperimentalApis).usb;
}

@Injectable()
export class WebUsbService {
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && !!getUsb();
  }

  async requestDevice(filters: UsbDeviceFilterDef[] = []): Promise<UsbDeviceRef> {
    if (!this.isSupported()) {
      throw new Error('WebUSB API not supported');
    }
    return getUsb()!.requestDevice({ filters });
  }

  async getDevices(): Promise<UsbDeviceRef[]> {
    if (!this.isSupported()) return [];
    return getUsb()!.getDevices();
  }

  async open(device: UsbDeviceRef): Promise<void> {
    await device.open();
  }

  async close(device: UsbDeviceRef): Promise<void> {
    await device.close();
  }

  async selectConfiguration(device: UsbDeviceRef, configurationValue: number): Promise<void> {
    await device.selectConfiguration(configurationValue);
  }

  async claimInterface(device: UsbDeviceRef, interfaceNumber: number): Promise<void> {
    await device.claimInterface(interfaceNumber);
  }

  async releaseInterface(device: UsbDeviceRef, interfaceNumber: number): Promise<void> {
    await device.releaseInterface(interfaceNumber);
  }

  async transferIn(
    device: UsbDeviceRef,
    endpointNumber: number,
    length: number,
  ): Promise<UsbTransferResult> {
    return device.transferIn(endpointNumber, length);
  }

  async transferOut(
    device: UsbDeviceRef,
    endpointNumber: number,
    data: BufferSource,
  ): Promise<UsbTransferResult> {
    return device.transferOut(endpointNumber, data);
  }

  watchConnection(): Observable<{ device: UsbDeviceRef; type: 'connect' | 'disconnect' }> {
    if (!this.isSupported()) {
      return new Observable((o) => o.error(new Error('WebUSB API not supported')));
    }
    return new Observable((subscriber) => {
      const usb = getUsb()!;

      const onConnect = (e: { device: UsbDeviceRef }) =>
        subscriber.next({ device: e.device, type: 'connect' as const });
      const onDisconnect = (e: { device: UsbDeviceRef }) =>
        subscriber.next({ device: e.device, type: 'disconnect' as const });

      usb.addEventListener('connect', onConnect);
      usb.addEventListener('disconnect', onDisconnect);

      return () => {
        usb.removeEventListener('connect', onConnect);
        usb.removeEventListener('disconnect', onDisconnect);
      };
    });
  }

  getDeviceInfo(device: UsbDeviceRef): UsbDeviceInfo {
    return {
      vendorId: device.vendorId,
      productId: device.productId,
      productName: device.productName,
      manufacturerName: device.manufacturerName,
      serialNumber: device.serialNumber,
      opened: device.opened,
    };
  }
}
