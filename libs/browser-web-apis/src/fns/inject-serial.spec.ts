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
import { injectSerial } from './inject-serial';
import { WebSerialService, type SerialPort } from '../services/web-serial.service';

describe('injectSerial', () => {
  let mockService: any;

  beforeEach(() => {
    mockService = {
      isSupported: vi.fn().mockReturnValue(true),
      requestPort: vi.fn(),
      openPort: vi.fn(),
      closePort: vi.fn(),
      write: vi.fn(),
      read: vi.fn(),
    };
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectSerial()).toThrow(/injectSerial/);
  });

  it('should report isSupported as false on server platform and reject operations', async () => {
    mockService.isSupported.mockReturnValue(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: WebSerialService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectSerial();
      expect(ref.isSupported()).toBe(false);

      const mockPort = {} as SerialPort;
      expect(await ref.requestPort()).toBeNull();
      expect(ref.error()?.message).toContain('not supported');

      expect(await ref.open({ baudRate: 9600 }, mockPort)).toBe(false);
      expect(ref.error()?.message).toContain('not supported');
    });
  });

  it('should handle missing port and service errors across operations', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebSerialService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectSerial();
      await new Promise((r) => queueMicrotask(r));
      expect(ref.isSupported()).toBe(true);

      // Operations when no port is available
      expect(await ref.open({ baudRate: 9600 })).toBe(false);
      expect(ref.error()?.message).toContain('No SerialPort available to open');

      expect(await ref.write('hello')).toBe(false);
      expect(ref.error()?.message).toContain('No SerialPort available to write');

      mockService.read.mockReturnValue(of());
      ref.readStream();
      expect(mockService.read).toHaveBeenCalledWith({ readable: null });

      // Service errors on requestPort, open, close, write
      mockService.requestPort.mockRejectedValueOnce(new Error('port request failed'));
      expect(await ref.requestPort()).toBeNull();
      expect(ref.error()?.message).toBe('port request failed');

      const customPort = {} as SerialPort;
      mockService.openPort.mockRejectedValueOnce(new Error('open failed'));
      expect(await ref.open({ baudRate: 9600 }, customPort)).toBe(false);
      expect(ref.error()?.message).toBe('open failed');

      mockService.write.mockRejectedValueOnce(new Error('write failed'));
      expect(await ref.write('data')).toBe(false);
      expect(ref.error()?.message).toBe('write failed');

      mockService.closePort.mockRejectedValueOnce(new Error('close failed'));
      await ref.close();
      expect(ref.error()?.message).toBe('close failed');
    });
  });

  it('should request port, open, write, read stream, handle stream error, and close', async () => {
    const mockPort = {} as SerialPort;
    const chunk = new Uint8Array([0xde, 0xad]);
    mockService.requestPort.mockResolvedValue(mockPort);
    mockService.openPort.mockResolvedValue(undefined);
    mockService.closePort.mockResolvedValue(undefined);
    mockService.write.mockResolvedValue(undefined);
    mockService.read.mockReturnValue(of(chunk));

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebSerialService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectSerial();
      await new Promise((r) => queueMicrotask(r));

      const port = await ref.requestPort();
      expect(port).toBe(mockPort);

      expect(await ref.open({ baudRate: 115200 })).toBe(true);
      expect(ref.isOpen()).toBe(true);

      expect(await ref.write('test data')).toBe(true);

      let emittedChunk: Uint8Array | null = null;
      ref.readStream().subscribe((data) => {
        emittedChunk = data;
      });
      expect(emittedChunk).toBe(chunk);
      expect(ref.data()).toBe(chunk);

      const readError = new Error('Stream read error');
      mockService.read.mockReturnValueOnce(throwError(() => readError));
      ref.readStream().subscribe({ error: () => {} });
      expect(ref.error()).toBe(readError);

      await ref.close();
      expect(ref.isOpen()).toBe(false);
    });
  });

  it('should close open port on DestroyRef onDestroy', async () => {
    const mockPort = {} as SerialPort;
    mockService.requestPort.mockResolvedValue(mockPort);
    mockService.openPort.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebSerialService, useValue: mockService },
      ],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);
    let ref: any;

    runInInjectionContext(childInjector, () => {
      ref = injectSerial();
    });

    await new Promise((r) => queueMicrotask(r));
    await ref.requestPort();
    await ref.open({ baudRate: 9600 });

    childInjector.destroy();
    expect(mockService.closePort).toHaveBeenCalledWith(mockPort);
  });
});
