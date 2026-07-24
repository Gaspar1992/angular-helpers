import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from '@angular-helpers/browser-web-apis';
import {
  type UsbDeviceFilterDef,
  type UsbDeviceRef,
  type NavigatorWithExperimentalApis,
} from './experimental-apis.types';

export type { UsbDeviceFilterDef, UsbDeviceRef };

function getUsb(): NavigatorWithExperimentalApis['usb'] {
  return (navigator as NavigatorWithExperimentalApis).usb;
}

@Injectable()
export class WebUsbService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'web-usb';
  }

  override isSupported(): boolean {
    return this.isBrowserEnvironment() && 'usb' in navigator;
  }

  async requestDevice(filters: UsbDeviceFilterDef[]): Promise<UsbDeviceRef> {
    if (!this.isSupported()) {
      throw new Error('WebUSB API not supported');
    }

    const device = await getUsb()!.requestDevice({ filters });
    return device;
  }

  async getDevices(): Promise<UsbDeviceRef[]> {
    if (!this.isSupported()) {
      return [];
    }

    return getUsb()!.getDevices();
  }

  watchDeviceChanges(): Observable<{ device: UsbDeviceRef; type: 'connect' | 'disconnect' }> {
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

  getDeviceInfo(device: UsbDeviceRef): {
    vendorId: number;
    productId: number;
    productName: string | undefined;
    manufacturerName: string | undefined;
    serialNumber: string | undefined;
    opened: boolean;
  } {
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
