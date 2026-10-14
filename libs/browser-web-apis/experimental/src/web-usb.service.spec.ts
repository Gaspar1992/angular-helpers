import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { WebUsbService, type UsbDeviceFilterDef, type UsbDeviceRef } from './web-usb.service';

describe('WebUsbService', () => {
  let service: WebUsbService;
  let mockUsbApi: any;
  let usbListeners: Record<string, Function>;

  const mockDevice: UsbDeviceRef = {
    vendorId: 0x1234,
    productId: 0x5678,
    productName: 'Test USB Peripheral',
    manufacturerName: 'Antigravity Labs',
    serialNumber: 'SN-998877',
    opened: true,
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    selectConfiguration: vi.fn().mockResolvedValue(undefined),
    claimInterface: vi.fn().mockResolvedValue(undefined),
    releaseInterface: vi.fn().mockResolvedValue(undefined),
    transferIn: vi.fn().mockResolvedValue({ status: 'ok', data: new DataView(new ArrayBuffer(8)) }),
    transferOut: vi.fn().mockResolvedValue({ status: 'ok', data: undefined }),
  };

  beforeEach(() => {
    usbListeners = {};
    mockUsbApi = {
      requestDevice: vi.fn().mockResolvedValue(mockDevice),
      getDevices: vi.fn().mockResolvedValue([mockDevice]),
      addEventListener: vi.fn((event: string, callback: Function) => {
        usbListeners[event] = callback;
      }),
      removeEventListener: vi.fn((event: string) => {
        delete usbListeners[event];
      }),
    };

    vi.stubGlobal('navigator', {
      usb: mockUsbApi,
    });

    TestBed.configureTestingModule({
      providers: [WebUsbService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(WebUsbService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isSupported', () => {
    it('should return true when running in browser and usb is in navigator', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should return false when usb is not in navigator', () => {
      vi.stubGlobal('navigator', {});
      expect(service.isSupported()).toBe(false);
    });

    it('should return false on server platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [WebUsbService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const serverService = TestBed.inject(WebUsbService);
      expect(serverService.isSupported()).toBe(false);
    });
  });

  describe('requestDevice', () => {
    it('should request device matching filters', async () => {
      const filters: UsbDeviceFilterDef[] = [{ vendorId: 0x1234 }];
      const device = await service.requestDevice(filters);

      expect(device).toBe(mockDevice);
      expect(mockUsbApi.requestDevice).toHaveBeenCalledWith({ filters });
    });

    it('should throw error when WebUSB is unsupported', async () => {
      vi.stubGlobal('navigator', {});
      await expect(service.requestDevice([])).rejects.toThrow('WebUSB API not supported');
    });
  });

  describe('getDevices', () => {
    it('should return paired devices when supported', async () => {
      const devices = await service.getDevices();
      expect(devices).toEqual([mockDevice]);
      expect(mockUsbApi.getDevices).toHaveBeenCalled();
    });

    it('should return empty array when WebUSB is unsupported', async () => {
      vi.stubGlobal('navigator', {});
      const devices = await service.getDevices();
      expect(devices).toEqual([]);
    });
  });

  describe('watchDeviceChanges', () => {
    it('should emit connect and disconnect events and clean up listeners', async () => {
      const changes$ = service.watchDeviceChanges();
      const emitted: Array<{ device: UsbDeviceRef; type: 'connect' | 'disconnect' }> = [];

      const sub = changes$.subscribe((event) => emitted.push(event));

      expect(mockUsbApi.addEventListener).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockUsbApi.addEventListener).toHaveBeenCalledWith('disconnect', expect.any(Function));

      usbListeners['connect']({ device: mockDevice });
      usbListeners['disconnect']({ device: mockDevice });

      expect(emitted).toEqual([
        { device: mockDevice, type: 'connect' },
        { device: mockDevice, type: 'disconnect' },
      ]);

      sub.unsubscribe();
      expect(mockUsbApi.removeEventListener).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockUsbApi.removeEventListener).toHaveBeenCalledWith(
        'disconnect',
        expect.any(Function),
      );
    });

    it('should emit error when API is unsupported', async () => {
      vi.stubGlobal('navigator', {});
      await expect(firstValueFrom(service.watchDeviceChanges())).rejects.toThrow(
        'WebUSB API not supported',
      );
    });
  });

  describe('getDeviceInfo', () => {
    it('should extract structured device properties', () => {
      const info = service.getDeviceInfo(mockDevice);
      expect(info).toEqual({
        vendorId: 0x1234,
        productId: 0x5678,
        productName: 'Test USB Peripheral',
        manufacturerName: 'Antigravity Labs',
        serialNumber: 'SN-998877',
        opened: true,
      });
    });
  });
});
