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

  it('should report isSupported as false on server platform', async () => {
    mockService.isSupported.mockReturnValue(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: WebSerialService, useValue: mockService },
      ],
    });

    TestBed.runInInjectionContext(() => {
      const ref = injectSerial();
      expect(ref.isSupported()).toBe(false);
    });
  });

  it('should report isSupported as true in browser after microtask', async () => {
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
    });
  });

  it('should request port and update port signal', async () => {
    const mockPort = {} as SerialPort;
    mockService.requestPort.mockResolvedValue(mockPort);

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
      expect(ref.port()).toBe(mockPort);
      expect(ref.isOpen()).toBe(false);
    });
  });

  it('should open and close port, updating isOpen signal', async () => {
    const mockPort = {} as SerialPort;
    mockService.requestPort.mockResolvedValue(mockPort);
    mockService.openPort.mockResolvedValue(undefined);
    mockService.closePort.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebSerialService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectSerial();
      await new Promise((r) => queueMicrotask(r));

      await ref.requestPort();
      const openSuccess = await ref.open({ baudRate: 115200 });
      expect(openSuccess).toBe(true);
      expect(ref.isOpen()).toBe(true);
      expect(mockService.openPort).toHaveBeenCalledWith(mockPort, { baudRate: 115200 });

      await ref.close();
      expect(ref.isOpen()).toBe(false);
      expect(mockService.closePort).toHaveBeenCalledWith(mockPort);
    });
  });

  it('should write data to port', async () => {
    const mockPort = {} as SerialPort;
    mockService.requestPort.mockResolvedValue(mockPort);
    mockService.write.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebSerialService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectSerial();
      await new Promise((r) => queueMicrotask(r));

      await ref.requestPort();
      const writeSuccess = await ref.write('test data');
      expect(writeSuccess).toBe(true);
      expect(mockService.write).toHaveBeenCalledWith(mockPort, 'test data');
    });
  });

  it('should read stream and update data signal', async () => {
    const mockPort = {} as SerialPort;
    const chunk = new Uint8Array([0xde, 0xad]);
    mockService.requestPort.mockResolvedValue(mockPort);
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

      await ref.requestPort();
      const stream$ = ref.readStream();

      let emittedChunk: Uint8Array | null = null;
      stream$.subscribe((data) => {
        emittedChunk = data;
      });

      expect(emittedChunk).toBe(chunk);
      expect(ref.data()).toBe(chunk);
    });
  });

  it('should handle read error in stream', async () => {
    const mockPort = {} as SerialPort;
    const readError = new Error('Stream read error');
    mockService.requestPort.mockResolvedValue(mockPort);
    mockService.read.mockReturnValue(throwError(() => readError));

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WebSerialService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectSerial();
      await new Promise((r) => queueMicrotask(r));

      await ref.requestPort();
      const stream$ = ref.readStream();

      stream$.subscribe({
        error: () => {},
      });

      expect(ref.error()).toBe(readError);
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
