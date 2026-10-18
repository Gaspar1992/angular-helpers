import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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

  it('should report isSupported as false on server platform and reject operations', async () => {
    mockService.isSupported.mockReturnValue(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: WebHidService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectHid();
      expect(ref.isSupported()).toBe(false);

      const dev = { productName: 'Pad', opened: false } as HIDDevice;
      expect(await ref.requestDevice({ filters: [] })).toBeNull();
      expect(ref.error()?.message).toContain('not supported');

      expect(await ref.open(dev)).toBe(false);
      expect(await ref.sendReport(1, new Uint8Array([1]), dev)).toBe(false);
      expect(await ref.sendFeatureReport(1, new Uint8Array([1]), dev)).toBe(false);
      expect(await ref.receiveFeatureReport(1, dev)).toBeNull();
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

  it('should handle missing device and service errors for all operations', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebHidService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectHid();
      await new Promise((r) => queueMicrotask(r));

      // Operations without a selected device
      expect(await ref.open()).toBe(false);
      expect(ref.error()?.message).toContain('No HID device available to open');

      expect(await ref.sendReport(1, new Uint8Array([1]))).toBe(false);
      expect(ref.error()?.message).toContain('No HID device available to send report');

      expect(await ref.sendFeatureReport(1, new Uint8Array([1]))).toBe(false);
      expect(ref.error()?.message).toContain('No HID device available to send feature report');

      expect(await ref.receiveFeatureReport(1)).toBeNull();
      expect(ref.error()?.message).toContain('No HID device available to receive feature report');

      mockService.watchInputReports.mockReturnValue(of());
      ref.watchInputReports();
      expect(mockService.watchInputReports).toHaveBeenCalledWith(null);

      // Select device explicitly
      const dev = { productName: 'Key', opened: true } as HIDDevice;
      ref.selectDevice(dev);
      expect(ref.selectedDevice()).toBe(dev);
      expect(ref.isOpen()).toBe(true);

      // Service errors on requestDevice, open, close, sendReport, sendFeatureReport, receiveFeatureReport
      mockService.requestDevice.mockRejectedValueOnce(new Error('req fail'));
      expect(await ref.requestDevice({ filters: [] })).toBeNull();
      expect(ref.error()?.message).toBe('req fail');

      const otherDev = { productName: 'Other', opened: false } as HIDDevice;
      mockService.openDevice.mockRejectedValueOnce(new Error('open fail'));
      expect(await ref.open(otherDev)).toBe(false);
      expect(ref.error()?.message).toBe('open fail');

      mockService.closeDevice.mockRejectedValueOnce(new Error('close fail'));
      await ref.close(otherDev);
      expect(ref.error()?.message).toBe('close fail');

      mockService.sendReport.mockRejectedValueOnce(new Error('send fail'));
      expect(await ref.sendReport(1, new Uint8Array([1]), otherDev)).toBe(false);
      expect(ref.error()?.message).toBe('send fail');

      mockService.sendFeatureReport.mockRejectedValueOnce(new Error('feat send fail'));
      expect(await ref.sendFeatureReport(1, new Uint8Array([1]), otherDev)).toBe(false);
      expect(ref.error()?.message).toBe('feat send fail');

      mockService.receiveFeatureReport.mockRejectedValueOnce(new Error('feat recv fail'));
      expect(await ref.receiveFeatureReport(1, otherDev)).toBeNull();
      expect(ref.error()?.message).toBe('feat recv fail');
    });
  });

  it('should open, close, send/receive reports, and watch input reports (including errors)', async () => {
    const mockDevice = { productName: 'Sensor', opened: false } as HIDDevice;
    const mockEvent = {
      reportId: 1,
      data: new DataView(new ArrayBuffer(2)),
      device: mockDevice,
    } as unknown as HIDInputReportEvent;

    mockService.requestDevice.mockResolvedValue([mockDevice]);
    mockService.openDevice.mockResolvedValue(undefined);
    mockService.closeDevice.mockResolvedValue(undefined);
    mockService.sendReport.mockResolvedValue(undefined);
    mockService.sendFeatureReport.mockResolvedValue(undefined);
    mockService.receiveFeatureReport.mockResolvedValue(new DataView(new ArrayBuffer(4)));
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
      expect(await ref.open()).toBe(true);
      expect(await ref.sendReport(1, new Uint8Array([0x01]))).toBe(true);
      expect(await ref.sendFeatureReport(2, new Uint8Array([0x02]))).toBe(true);
      expect(await ref.receiveFeatureReport(3)).toBeDefined();

      let emitted: any;
      ref.watchInputReports().subscribe((ev) => {
        emitted = ev;
      });
      expect(emitted).toBe(mockEvent);
      expect(ref.lastInputReport()).toBe(mockEvent);

      // Watch input report error branch
      const streamErr = new Error('Input report error');
      mockService.watchInputReports.mockReturnValueOnce(throwError(() => streamErr));
      ref.watchInputReports().subscribe({ error: () => {} });
      expect(ref.error()).toBe(streamErr);

      await ref.close();
      expect(ref.isOpen()).toBe(false);
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
