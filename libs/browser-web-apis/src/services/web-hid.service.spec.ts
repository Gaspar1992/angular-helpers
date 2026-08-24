import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { WebHidService, type HIDDevice, type HIDInputReportEvent } from './web-hid.service';

describe('WebHidService', () => {
  let service: WebHidService;
  let mockHidApi: any;

  beforeEach(() => {
    mockHidApi = {
      requestDevice: vi.fn(),
      getDevices: vi.fn().mockResolvedValue([]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.stubGlobal('navigator', {
      hid: mockHidApi,
    });
    vi.stubGlobal('isSecureContext', true);

    TestBed.configureTestingModule({
      providers: [WebHidService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(WebHidService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isSupported', () => {
    it('should return true when hid is in navigator and context is secure', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should return false when hid is not in navigator', () => {
      vi.stubGlobal('navigator', {});
      expect(service.isSupported()).toBe(false);
    });

    it('should return false on server platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [WebHidService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const serverService = TestBed.inject(WebHidService);
      expect(serverService.isSupported()).toBe(false);
    });
  });

  describe('requestDevice & getDevices', () => {
    it('should request devices from user', async () => {
      const mockDevices: HIDDevice[] = [
        {
          vendorId: 0x1234,
          productId: 0x5678,
          productName: 'Gaming Mouse',
          open: vi.fn(),
          close: vi.fn(),
        } as unknown as HIDDevice,
      ];
      mockHidApi.requestDevice.mockResolvedValue(mockDevices);

      const result = await service.requestDevice({ filters: [{ vendorId: 0x1234 }] });
      expect(result).toBe(mockDevices);
      expect(mockHidApi.requestDevice).toHaveBeenCalledWith({ filters: [{ vendorId: 0x1234 }] });
    });

    it('should get paired devices', async () => {
      const mockDevices = [{ productName: 'Keyboard' } as HIDDevice];
      mockHidApi.getDevices.mockResolvedValue(mockDevices);

      const devices = await service.getDevices();
      expect(devices).toEqual(mockDevices);
    });
  });

  describe('Device operations', () => {
    it('should open and close device', async () => {
      const mockDevice = {
        open: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      } as unknown as HIDDevice;

      await service.openDevice(mockDevice);
      expect(mockDevice.open).toHaveBeenCalled();

      await service.closeDevice(mockDevice);
      expect(mockDevice.close).toHaveBeenCalled();
    });

    it('should send output report', async () => {
      const mockDevice = {
        sendReport: vi.fn().mockResolvedValue(undefined),
      } as unknown as HIDDevice;
      const data = new Uint8Array([0x01, 0x02]);

      await service.sendReport(mockDevice, 1, data);
      expect(mockDevice.sendReport).toHaveBeenCalledWith(1, data);
    });

    it('should send feature report', async () => {
      const mockDevice = {
        sendFeatureReport: vi.fn().mockResolvedValue(undefined),
      } as unknown as HIDDevice;
      const data = new Uint8Array([0xaa]);

      await service.sendFeatureReport(mockDevice, 2, data);
      expect(mockDevice.sendFeatureReport).toHaveBeenCalledWith(2, data);
    });

    it('should receive feature report', async () => {
      const mockDataView = new DataView(new ArrayBuffer(4));
      const mockDevice = {
        receiveFeatureReport: vi.fn().mockResolvedValue(mockDataView),
      } as unknown as HIDDevice;

      const result = await service.receiveFeatureReport(mockDevice, 3);
      expect(result).toBe(mockDataView);
      expect(mockDevice.receiveFeatureReport).toHaveBeenCalledWith(3);
    });
  });

  describe('watchDevices & watchInputReports', () => {
    it('should emit connection events', async () => {
      let connectListener: any;
      mockHidApi.addEventListener.mockImplementation((type: string, listener: any) => {
        if (type === 'connect') connectListener = listener;
      });

      const events$ = service.watchDevices();
      const mockDevice = { productName: 'Game Controller' } as unknown as HIDDevice;

      const subPromise = firstValueFrom(events$);
      connectListener({ device: mockDevice });

      const event = await subPromise;
      expect(event).toEqual({ type: 'connect', device: mockDevice });
    });

    it('should watch input reports from device', async () => {
      let inputReportListener: any;
      const mockDevice = {
        addEventListener: vi.fn().mockImplementation((type, listener) => {
          if (type === 'inputreport') inputReportListener = listener;
        }),
        removeEventListener: vi.fn(),
      } as unknown as HIDDevice;

      const report$ = service.watchInputReports(mockDevice);
      const mockEvent = {
        reportId: 1,
        data: new DataView(new ArrayBuffer(2)),
        device: mockDevice,
      } as unknown as HIDInputReportEvent;

      const subPromise = firstValueFrom(report$);
      inputReportListener(mockEvent);

      const emitted = await subPromise;
      expect(emitted).toBe(mockEvent);
    });

    it('should return error observable when watchDevices is unsupported', async () => {
      vi.stubGlobal('navigator', {});
      const stream$ = service.watchDevices();
      await expect(firstValueFrom(stream$)).rejects.toThrow(/not supported/);
    });
  });
});
