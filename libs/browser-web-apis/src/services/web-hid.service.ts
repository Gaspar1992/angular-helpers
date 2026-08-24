import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';

export interface HIDDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

export interface HIDDeviceRequestOptions {
  filters: HIDDeviceFilter[];
  exclusionFilters?: HIDDeviceFilter[];
}

export interface HIDReportItem {
  isAbsolute?: boolean;
  isArray?: boolean;
  isBufferedBytes?: boolean;
  isConstant?: boolean;
  isLinear?: boolean;
  isRange?: boolean;
  isVolatile?: boolean;
  hasNull?: boolean;
  hasPreferredState?: boolean;
  reportSize?: number;
  reportCount?: number;
  unitExponent?: number;
  unitSystem?: string;
  unitFactorLengthExponent?: number;
  unitFactorMassExponent?: number;
  unitFactorTimeExponent?: number;
  unitFactorTemperatureExponent?: number;
  unitFactorCurrentExponent?: number;
  unitFactorLuminousIntensityExponent?: number;
  logicalMinimum?: number;
  logicalMaximum?: number;
  physicalMinimum?: number;
  physicalMaximum?: number;
  strings?: string[];
  usages?: number[];
  usageMinimum?: number;
  usageMaximum?: number;
}

export interface HIDReportInfo {
  reportId: number;
  items?: HIDReportItem[];
}

export interface HIDCollectionInfo {
  usagePage: number;
  usage: number;
  type: number;
  children?: HIDCollectionInfo[];
  inputReports?: HIDReportInfo[];
  outputReports?: HIDReportInfo[];
  featureReports?: HIDReportInfo[];
}

export interface HIDInputReportEvent extends Event {
  readonly data: DataView;
  readonly device: HIDDevice;
  readonly reportId: number;
}

export interface HIDConnectionEvent {
  type: 'connect' | 'disconnect';
  device: HIDDevice;
}

export interface HIDDevice extends EventTarget {
  readonly opened: boolean;
  readonly vendorId: number;
  readonly productId: number;
  readonly productName: string;
  readonly collections: HIDCollectionInfo[];
  open(): Promise<void>;
  close(): Promise<void>;
  forget?(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;
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

export interface HIDNavigator extends Navigator {
  hid?: {
    getDevices(): Promise<HIDDevice[]>;
    requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]>;
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
export class WebHidService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'web-hid';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'webHid';
  }

  override isSupported(): boolean {
    return (
      super.isSupported() &&
      typeof navigator !== 'undefined' &&
      'hid' in navigator &&
      (typeof window === 'undefined' || window.isSecureContext)
    );
  }

  protected override ensureSupported(): void {
    super.ensureSupported();
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      throw new Error('WebHID API requires a secure context (HTTPS)');
    }
  }

  private get hidApi(): HIDNavigator['hid'] | undefined {
    return typeof navigator !== 'undefined' ? (navigator as HIDNavigator).hid : undefined;
  }

  /**
   * Requests one or more HID devices from the user.
   */
  async requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]> {
    this.ensureSupported();
    const api = this.hidApi;
    if (!api || typeof api.requestDevice !== 'function') {
      throw this.createError('WebHID requestDevice is not supported');
    }
    return api.requestDevice(options);
  }

  /**
   * Gets a list of HID devices already paired with this origin.
   */
  async getDevices(): Promise<HIDDevice[]> {
    this.ensureSupported();
    const api = this.hidApi;
    if (!api || typeof api.getDevices !== 'function') {
      return [];
    }
    return api.getDevices();
  }

  /**
   * Opens the specified HID device.
   */
  async openDevice(device: HIDDevice): Promise<void> {
    this.ensureSupported();
    if (!device || typeof device.open !== 'function') {
      throw this.createError('Invalid HID device');
    }
    await device.open();
  }

  /**
   * Closes the specified HID device.
   */
  async closeDevice(device: HIDDevice): Promise<void> {
    this.ensureSupported();
    if (!device || typeof device.close !== 'function') {
      throw this.createError('Invalid HID device');
    }
    await device.close();
  }

  /**
   * Sends an output report to the HID device.
   */
  async sendReport(device: HIDDevice, reportId: number, data: BufferSource): Promise<void> {
    this.ensureSupported();
    if (!device || typeof device.sendReport !== 'function') {
      throw this.createError('Invalid HID device or sendReport not available');
    }
    await device.sendReport(reportId, data);
  }

  /**
   * Sends a feature report to the HID device.
   */
  async sendFeatureReport(device: HIDDevice, reportId: number, data: BufferSource): Promise<void> {
    this.ensureSupported();
    if (!device || typeof device.sendFeatureReport !== 'function') {
      throw this.createError('Invalid HID device or sendFeatureReport not available');
    }
    await device.sendFeatureReport(reportId, data);
  }

  /**
   * Receives a feature report from the HID device.
   */
  async receiveFeatureReport(device: HIDDevice, reportId: number): Promise<DataView> {
    this.ensureSupported();
    if (!device || typeof device.receiveFeatureReport !== 'function') {
      throw this.createError('Invalid HID device or receiveFeatureReport not available');
    }
    return device.receiveFeatureReport(reportId);
  }

  /**
   * Observes HID device connection and disconnection events.
   */
  watchDevices(): Observable<HIDConnectionEvent> {
    if (!this.isSupported()) {
      return throwError(() => this.createError('WebHID API not supported'));
    }

    const api = this.hidApi;
    if (!api || typeof api.addEventListener !== 'function') {
      return throwError(() => this.createError('WebHID event listening is not supported'));
    }

    return new Observable<HIDConnectionEvent>((subscriber) => {
      const connectHandler = (event: Event) => {
        const device =
          (event as Event & { device?: HIDDevice }).device ??
          (event.target as unknown as HIDDevice);
        subscriber.next({ type: 'connect', device });
      };

      const disconnectHandler = (event: Event) => {
        const device =
          (event as Event & { device?: HIDDevice }).device ??
          (event.target as unknown as HIDDevice);
        subscriber.next({ type: 'disconnect', device });
      };

      api.addEventListener?.('connect', connectHandler);
      api.addEventListener?.('disconnect', disconnectHandler);

      return () => {
        api.removeEventListener?.('connect', connectHandler);
        api.removeEventListener?.('disconnect', disconnectHandler);
      };
    });
  }

  /**
   * Observes input reports received from the specified HID device.
   */
  watchInputReports(device: HIDDevice): Observable<HIDInputReportEvent> {
    if (!this.isSupported()) {
      return throwError(() => this.createError('WebHID API not supported'));
    }

    if (!device || typeof device.addEventListener !== 'function') {
      return throwError(() => this.createError('Invalid HID device'));
    }

    return new Observable<HIDInputReportEvent>((subscriber) => {
      const handler = (event: Event) => {
        subscriber.next(event as HIDInputReportEvent);
      };

      device.addEventListener('inputreport', handler);

      return () => {
        device.removeEventListener('inputreport', handler);
      };
    });
  }
}
