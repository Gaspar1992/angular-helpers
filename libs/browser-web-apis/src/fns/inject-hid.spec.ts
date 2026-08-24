import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { injectHid } from './inject-hid';
import {
  WebHidService,
  type HIDDevice,
  type HIDInputReportEvent,
} from '../services/web-hid.service';

describe('injectHid', () => {
  let mockService: any;

  beforeEach(() => {
    mockService = {
      isSupported: vi.fn().mockReturnValue(true),
      getDevices: vi.fn().mockResolvedValue([]),
      requestDevice: vi.fn(),
      openDevice: vi.fn(),
      closeDevice: vi.fn(),
      sendReport: vi.fn(),
      sendFeatureReport: vi.fn(),
      receiveFeatureReport: vi.fn(),
      watchInputReports: vi.fn(),
    };
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectHid()).toThrow(/injectHid/);
  });

  it('should report isSupported as false on server platform', async () => {
    mockService.isSupported.mockReturnValue(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: WebHidService, useValue: mockService },
      ],
    });

    TestBed.runInInjectionContext(() => {
      const ref = injectHid();
      expect(ref.isSupported()).toBe(false);
    });
  });

  it('should report isSupported as true and load paired devices in browser', async () => {
    const mockPairedDevice = { productName: 'Mouse', opened: false } as HIDDevice;
    mockService.getDevices.mockResolvedValue([mockPairedDevice]);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebHidService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectHid();
      await new Promise((r) => queueMicrotask(r));
      await new Promise((r) => setTimeout(r, 0));

      expect(ref.isSupported()).toBe(true);
      expect(ref.devices()).toEqual([mockPairedDevice]);
      expect(ref.selectedDevice()).toBe(mockPairedDevice);
      expect(ref.isOpen()).toBe(false);
    });
  });

  it('should request device and update selectedDevice and devices signals', async () => {
    const mockDevice = { productName: 'GamePad', opened: false } as HIDDevice;
    mockService.requestDevice.mockResolvedValue([mockDevice]);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebHidService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectHid();
      await new Promise((r) => queueMicrotask(r));

      const devs = await ref.requestDevice({ filters: [{ vendorId: 0x1234 }] });
      expect(devs).toEqual([mockDevice]);
      expect(ref.devices()).toEqual([mockDevice]);
      expect(ref.selectedDevice()).toBe(mockDevice);
      expect(ref.isOpen()).toBe(false);
    });
  });

  it('should open and close device', async () => {
    const mockDevice = { productName: 'GamePad', opened: false } as HIDDevice;
    mockService.requestDevice.mockResolvedValue([mockDevice]);
    mockService.openDevice.mockResolvedValue(undefined);
    mockService.closeDevice.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebHidService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectHid();
      await new Promise((r) => queueMicrotask(r));

      await ref.requestDevice({ filters: [] });
      const openSuccess = await ref.open();
      expect(openSuccess).toBe(true);
      expect(ref.isOpen()).toBe(true);

      await ref.close();
      expect(ref.isOpen()).toBe(false);
    });
  });

  it('should send report and feature report', async () => {
    const mockDevice = { productName: 'LED Controller' } as HIDDevice;
    mockService.requestDevice.mockResolvedValue([mockDevice]);
    mockService.sendReport.mockResolvedValue(undefined);
    mockService.sendFeatureReport.mockResolvedValue(undefined);
    mockService.receiveFeatureReport.mockResolvedValue(new DataView(new ArrayBuffer(4)));

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebHidService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectHid();
      await new Promise((r) => queueMicrotask(r));

      await ref.requestDevice({ filters: [] });
      const sendRes = await ref.sendReport(1, new Uint8Array([0x01]));
      expect(sendRes).toBe(true);

      const featureRes = await ref.sendFeatureReport(2, new Uint8Array([0x02]));
      expect(featureRes).toBe(true);

      const reportView = await ref.receiveFeatureReport(3);
      expect(reportView).toBeDefined();
    });
  });

  it('should watch input reports and update lastInputReport signal', async () => {
    const mockDevice = { productName: 'Sensor' } as HIDDevice;
    const mockEvent = {
      reportId: 1,
      data: new DataView(new ArrayBuffer(2)),
      device: mockDevice,
    } as unknown as HIDInputReportEvent;

    mockService.requestDevice.mockResolvedValue([mockDevice]);
    mockService.watchInputReports.mockReturnValue(of(mockEvent));

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebHidService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectHid();
      await new Promise((r) => queueMicrotask(r));

      await ref.requestDevice({ filters: [] });
      const report$ = ref.watchInputReports();

      let emitted: any;
      report$.subscribe((ev) => {
        emitted = ev;
      });

      expect(emitted).toBe(mockEvent);
      expect(ref.lastInputReport()).toBe(mockEvent);
    });
  });

  it('should close active device on DestroyRef onDestroy', async () => {
    const mockDevice = { productName: 'Sensor', opened: true } as HIDDevice;
    mockService.requestDevice.mockResolvedValue([mockDevice]);
    mockService.openDevice.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebHidService, useValue: mockService },
      ],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);
    let ref: any;

    runInInjectionContext(childInjector, () => {
      ref = injectHid();
    });

    await new Promise((r) => queueMicrotask(r));
    await ref.requestDevice({ filters: [] });
    await ref.open();

    childInjector.destroy();
    expect(mockService.closeDevice).toHaveBeenCalledWith(mockDevice);
  });
});
