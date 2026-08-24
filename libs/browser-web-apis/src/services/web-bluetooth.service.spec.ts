import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  WebBluetoothService,
  type BluetoothDevice,
  type BluetoothRemoteGATTCharacteristic,
  type BluetoothRemoteGATTServer,
} from './web-bluetooth.service';

describe('WebBluetoothService', () => {
  let service: WebBluetoothService;
  let mockBluetoothApi: any;

  beforeEach(() => {
    mockBluetoothApi = {
      requestDevice: vi.fn(),
      getDevices: vi.fn(),
      getAvailability: vi.fn().mockResolvedValue(true),
    };

    vi.stubGlobal('navigator', {
      bluetooth: mockBluetoothApi,
    });
    vi.stubGlobal('isSecureContext', true);

    TestBed.configureTestingModule({
      providers: [WebBluetoothService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(WebBluetoothService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isSupported', () => {
    it('should return true when bluetooth is in navigator and context is secure', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should return false when bluetooth is not in navigator', () => {
      vi.stubGlobal('navigator', {});
      expect(service.isSupported()).toBe(false);
    });

    it('should return false in server platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [WebBluetoothService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const serverService = TestBed.inject(WebBluetoothService);
      expect(serverService.isSupported()).toBe(false);
    });
  });

  describe('requestDevice', () => {
    it('should request device successfully', async () => {
      const mockDevice: BluetoothDevice = {
        id: 'dev-1',
        name: 'Heart Rate Monitor',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
      mockBluetoothApi.requestDevice.mockResolvedValue(mockDevice);

      const device = await service.requestDevice({ acceptAllDevices: true });
      expect(device).toBe(mockDevice);
      expect(mockBluetoothApi.requestDevice).toHaveBeenCalledWith({ acceptAllDevices: true });
    });

    it('should throw error when unsupported', async () => {
      vi.stubGlobal('navigator', {});
      await expect(service.requestDevice()).rejects.toThrow();
    });

    it('should throw error when requestDevice is rejected', async () => {
      mockBluetoothApi.requestDevice.mockRejectedValue(new Error('User cancelled'));
      await expect(service.requestDevice()).rejects.toThrow('User cancelled');
    });
  });

  describe('getDevices', () => {
    it('should return devices list when available', async () => {
      const mockDevices = [{ id: 'd1' } as BluetoothDevice];
      mockBluetoothApi.getDevices.mockResolvedValue(mockDevices);

      const devices = await service.getDevices();
      expect(devices).toEqual(mockDevices);
    });

    it('should return empty array if getDevices is not implemented on navigator.bluetooth', async () => {
      delete mockBluetoothApi.getDevices;
      const devices = await service.getDevices();
      expect(devices).toEqual([]);
    });
  });

  describe('getAvailability', () => {
    it('should return availability status', async () => {
      mockBluetoothApi.getAvailability.mockResolvedValue(true);
      const available = await service.getAvailability();
      expect(available).toBe(true);
    });

    it('should return false when API is not supported', async () => {
      vi.stubGlobal('navigator', {});
      const available = await service.getAvailability();
      expect(available).toBe(false);
    });
  });

  describe('GATT operations', () => {
    it('should connect to GATT server', async () => {
      const mockServer: BluetoothRemoteGATTServer = {
        device: {} as BluetoothDevice,
        connected: true,
        connect: vi.fn().mockResolvedValue({} as BluetoothRemoteGATTServer),
        disconnect: vi.fn(),
        getPrimaryService: vi.fn(),
        getPrimaryServices: vi.fn(),
      };
      const mockDevice = {
        id: 'd1',
        gatt: mockServer,
      } as unknown as BluetoothDevice;

      const server = await service.connectGatt(mockDevice);
      expect(mockServer.connect).toHaveBeenCalled();
      expect(server).toBeDefined();
    });

    it('should throw when device has no gatt', async () => {
      const mockDevice = { id: 'd1' } as BluetoothDevice;
      await expect(service.connectGatt(mockDevice)).rejects.toThrow('GATT');
    });

    it('should disconnect from GATT server if connected', () => {
      const mockDisconnect = vi.fn();
      const mockDevice = {
        id: 'd1',
        gatt: {
          connected: true,
          disconnect: mockDisconnect,
        },
      } as unknown as BluetoothDevice;

      service.disconnectGatt(mockDevice);
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('Characteristic operations', () => {
    it('should read characteristic value', async () => {
      const expectedData = new DataView(new ArrayBuffer(4));
      const mockChar = {
        readValue: vi.fn().mockResolvedValue(expectedData),
      } as unknown as BluetoothRemoteGATTCharacteristic;

      const result = await service.readCharacteristic(mockChar);
      expect(result).toBe(expectedData);
      expect(mockChar.readValue).toHaveBeenCalled();
    });

    it('should write characteristic value with response by default', async () => {
      const mockChar = {
        writeValueWithResponse: vi.fn().mockResolvedValue(undefined),
      } as unknown as BluetoothRemoteGATTCharacteristic;
      const data = new Uint8Array([1, 2, 3]);

      await service.writeCharacteristic(mockChar, data);
      expect(mockChar.writeValueWithResponse).toHaveBeenCalledWith(data);
    });

    it('should write characteristic value without response if specified', async () => {
      const mockChar = {
        writeValueWithoutResponse: vi.fn().mockResolvedValue(undefined),
        writeValueWithResponse: vi.fn(),
      } as unknown as BluetoothRemoteGATTCharacteristic;
      const data = new Uint8Array([1, 2, 3]);

      await service.writeCharacteristic(mockChar, data, true);
      expect(mockChar.writeValueWithoutResponse).toHaveBeenCalledWith(data);
    });

    it('should watch characteristic notifications', async () => {
      let listener: any;
      const mockChar = {
        addEventListener: vi.fn().mockImplementation((type, handler) => {
          if (type === 'characteristicvaluechanged') {
            listener = handler;
          }
        }),
        removeEventListener: vi.fn(),
        startNotifications: vi.fn().mockResolvedValue({} as any),
        stopNotifications: vi.fn().mockResolvedValue({} as any),
      } as unknown as BluetoothRemoteGATTCharacteristic;

      const notification$ = service.watchCharacteristicNotifications(mockChar);
      const dataView = new DataView(new ArrayBuffer(2));

      const subPromise = firstValueFrom(notification$);
      listener({ target: { value: dataView } });

      const emitted = await subPromise;
      expect(emitted).toBe(dataView);
      expect(mockChar.startNotifications).toHaveBeenCalled();
    });

    it('should return error observable when watchCharacteristicNotifications is unsupported', async () => {
      vi.stubGlobal('navigator', {});
      const mockChar = {} as BluetoothRemoteGATTCharacteristic;
      const stream$ = service.watchCharacteristicNotifications(mockChar);

      await expect(firstValueFrom(stream$)).rejects.toThrow(/not supported/);
    });
  });
});
