import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom, toArray, take } from 'rxjs';
import { WebSerialService, type SerialPort } from './web-serial.service';

describe('WebSerialService', () => {
  let service: WebSerialService;
  let mockSerialApi: any;

  beforeEach(() => {
    mockSerialApi = {
      requestPort: vi.fn(),
      getPorts: vi.fn().mockResolvedValue([]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.stubGlobal('navigator', {
      serial: mockSerialApi,
    });
    vi.stubGlobal('isSecureContext', true);

    TestBed.configureTestingModule({
      providers: [WebSerialService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(WebSerialService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isSupported', () => {
    it('should return true when serial is in navigator and context is secure', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should return false when serial is not in navigator', () => {
      vi.stubGlobal('navigator', {});
      expect(service.isSupported()).toBe(false);
    });

    it('should return false on server platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [WebSerialService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const serverService = TestBed.inject(WebSerialService);
      expect(serverService.isSupported()).toBe(false);
    });
  });

  describe('requestPort & getPorts', () => {
    it('should request a port from user', async () => {
      const mockPort = { open: vi.fn(), close: vi.fn() } as unknown as SerialPort;
      mockSerialApi.requestPort.mockResolvedValue(mockPort);

      const port = await service.requestPort({ filters: [{ usbVendorId: 0x1234 }] });
      expect(port).toBe(mockPort);
      expect(mockSerialApi.requestPort).toHaveBeenCalledWith({
        filters: [{ usbVendorId: 0x1234 }],
      });
    });

    it('should get paired ports', async () => {
      const mockPorts = [{ open: vi.fn() } as unknown as SerialPort];
      mockSerialApi.getPorts.mockResolvedValue(mockPorts);

      const ports = await service.getPorts();
      expect(ports).toEqual(mockPorts);
    });
  });

  describe('openPort & closePort', () => {
    it('should open a port with options', async () => {
      const mockPort = {
        open: vi.fn().mockResolvedValue(undefined),
      } as unknown as SerialPort;

      await service.openPort(mockPort, { baudRate: 9600 });
      expect(mockPort.open).toHaveBeenCalledWith({ baudRate: 9600 });
    });

    it('should close a port', async () => {
      const mockPort = {
        close: vi.fn().mockResolvedValue(undefined),
      } as unknown as SerialPort;

      await service.closePort(mockPort);
      expect(mockPort.close).toHaveBeenCalled();
    });
  });

  describe('read & write', () => {
    it('should stream data from readable port', async () => {
      const chunk1 = new Uint8Array([1, 2]);
      const chunk2 = new Uint8Array([3, 4]);

      let readCount = 0;
      const mockReader = {
        read: vi.fn().mockImplementation(async () => {
          readCount++;
          if (readCount === 1) return { value: chunk1, done: false };
          if (readCount === 2) return { value: chunk2, done: false };
          return { value: undefined, done: true };
        }),
        releaseLock: vi.fn(),
        cancel: vi.fn(),
      };

      const mockPort = {
        readable: {
          getReader: vi.fn().mockReturnValue(mockReader),
        },
      } as unknown as SerialPort;

      const stream$ = service.read(mockPort);
      const emitted = await firstValueFrom(stream$.pipe(take(2), toArray()));

      expect(emitted).toEqual([chunk1, chunk2]);
    });

    it('should return error observable if readable is not present', async () => {
      const mockPort = { readable: null } as unknown as SerialPort;
      const stream$ = service.read(mockPort);

      await expect(firstValueFrom(stream$)).rejects.toThrow('readable');
    });

    it('should write byte chunks or strings to writable port', async () => {
      const mockWriter = {
        write: vi.fn().mockResolvedValue(undefined),
        releaseLock: vi.fn(),
      };
      const mockPort = {
        writable: {
          getWriter: vi.fn().mockReturnValue(mockWriter),
        },
      } as unknown as SerialPort;

      await service.write(mockPort, 'hello');
      expect(mockWriter.write).toHaveBeenCalled();
      expect(mockWriter.releaseLock).toHaveBeenCalled();
    });

    it('should throw error when writing to port with no writable stream', async () => {
      const mockPort = { writable: null } as unknown as SerialPort;
      await expect(service.write(mockPort, 'hello')).rejects.toThrow('writable');
    });
  });

  describe('watchPorts', () => {
    it('should emit connect and disconnect events', async () => {
      let connectListener: any;
      let disconnectListener: any;

      mockSerialApi.addEventListener.mockImplementation((type: string, listener: any) => {
        if (type === 'connect') connectListener = listener;
        if (type === 'disconnect') disconnectListener = listener;
      });

      const events$ = service.watchPorts();
      const mockPort = { id: 'p1' } as unknown as SerialPort;

      const subPromise = firstValueFrom(events$);
      connectListener({ port: mockPort });

      const event = await subPromise;
      expect(event).toEqual({ type: 'connect', port: mockPort });
    });

    it('should return error observable when watchPorts is unsupported', async () => {
      vi.stubGlobal('navigator', {});
      const stream$ = service.watchPorts();
      await expect(firstValueFrom(stream$)).rejects.toThrow(/not supported/);
    });
  });
});
