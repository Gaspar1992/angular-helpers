import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { injectBluetooth } from './inject-bluetooth';
import {
  WebBluetoothService,
  type BluetoothDevice,
  type BluetoothRemoteGATTCharacteristic,
  type BluetoothRemoteGATTServer,
} from '../services/web-bluetooth.service';

describe('injectBluetooth', () => {
  let mockService: any;

  beforeEach(() => {
    mockService = {
      isSupported: vi.fn().mockReturnValue(true),
      requestDevice: vi.fn(),
      connectGatt: vi.fn(),
      disconnectGatt: vi.fn(),
      readCharacteristic: vi.fn(),
      writeCharacteristic: vi.fn(),
      watchCharacteristicNotifications: vi.fn(),
    };
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectBluetooth()).toThrow(/injectBluetooth/);
  });

  it('should report isSupported as false on server platform', async () => {
    mockService.isSupported.mockReturnValue(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: WebBluetoothService, useValue: mockService },
      ],
    });

    TestBed.runInInjectionContext(() => {
      const ref = injectBluetooth();
      expect(ref.isSupported()).toBe(false);
    });
  });

  it('should report isSupported as true in browser after microtask', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebBluetoothService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectBluetooth();
      await new Promise((r) => queueMicrotask(r));
      expect(ref.isSupported()).toBe(true);
    });
  });

  it('should request device and update device signal', async () => {
    const mockDev = {
      id: 'dev-1',
      gatt: { connected: false },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as BluetoothDevice;

    mockService.requestDevice.mockResolvedValue(mockDev);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebBluetoothService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectBluetooth();
      await new Promise((r) => queueMicrotask(r));

      const result = await ref.requestDevice({ acceptAllDevices: true });
      expect(result).toBe(mockDev);
      expect(ref.device()).toBe(mockDev);
      expect(ref.connected()).toBe(false);
      expect(ref.error()).toBeNull();
    });
  });

  it('should set error on requestDevice rejection', async () => {
    const error = new Error('Permission denied');
    mockService.requestDevice.mockRejectedValue(error);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebBluetoothService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectBluetooth();
      await new Promise((r) => queueMicrotask(r));

      const result = await ref.requestDevice();
      expect(result).toBeNull();
      expect(ref.error()).toBe(error);
    });
  });

  it('should connect to GATT server and update connected signal', async () => {
    const mockServer = { connected: true } as BluetoothRemoteGATTServer;
    const mockDev = {
      id: 'dev-1',
      gatt: { connected: false },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as BluetoothDevice;

    mockService.connectGatt.mockResolvedValue(mockServer);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebBluetoothService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectBluetooth();
      await new Promise((r) => queueMicrotask(r));

      const server = await ref.connect(mockDev);
      expect(server).toBe(mockServer);
      expect(ref.connected()).toBe(true);

      ref.disconnect();
      expect(ref.connected()).toBe(false);
      expect(mockService.disconnectGatt).toHaveBeenCalledWith(mockDev);
    });
  });

  it('should update connected to false on gattserverdisconnected event', async () => {
    let disconnectHandler: any;
    const mockDev = {
      id: 'dev-1',
      gatt: { connected: true },
      addEventListener: vi.fn().mockImplementation((type, handler) => {
        if (type === 'gattserverdisconnected') disconnectHandler = handler;
      }),
      removeEventListener: vi.fn(),
    } as unknown as BluetoothDevice;

    mockService.requestDevice.mockResolvedValue(mockDev);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebBluetoothService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectBluetooth();
      await new Promise((r) => queueMicrotask(r));

      await ref.requestDevice();
      expect(ref.connected()).toBe(true);

      disconnectHandler(new Event('gattserverdisconnected'));
      expect(ref.connected()).toBe(false);
    });
  });

  it('should read and write characteristic', async () => {
    const mockDataView = new DataView(new ArrayBuffer(2));
    const mockChar = {} as BluetoothRemoteGATTCharacteristic;
    mockService.readCharacteristic.mockResolvedValue(mockDataView);
    mockService.writeCharacteristic.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebBluetoothService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectBluetooth();
      await new Promise((r) => queueMicrotask(r));

      const readResult = await ref.readCharacteristic(mockChar);
      expect(readResult).toBe(mockDataView);

      const writeSuccess = await ref.writeCharacteristic(mockChar, new Uint8Array([1]));
      expect(writeSuccess).toBe(true);
    });
  });

  it('should cleanup on DestroyRef destruction', async () => {
    const mockDev = {
      id: 'dev-1',
      gatt: { connected: true },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as BluetoothDevice;

    mockService.requestDevice.mockResolvedValue(mockDev);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebBluetoothService, useValue: mockService },
      ],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);
    let ref: any;

    runInInjectionContext(childInjector, () => {
      ref = injectBluetooth();
    });

    await new Promise((r) => queueMicrotask(r));
    await ref.requestDevice();

    childInjector.destroy();
    expect(mockService.disconnectGatt).toHaveBeenCalledWith(mockDev);
    expect(mockDev.removeEventListener).toHaveBeenCalled();
  });
});
