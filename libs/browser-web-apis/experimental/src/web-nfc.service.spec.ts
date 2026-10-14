import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { WebNfcService, type NdefMessage, type NdefReadingEvent } from './web-nfc.service';

describe('WebNfcService', () => {
  let service: WebNfcService;
  let mockReaderInstance: any;
  let listeners: Record<string, Function>;

  beforeEach(() => {
    listeners = {};
    mockReaderInstance = {
      addEventListener: vi.fn((event: string, callback: Function) => {
        listeners[event] = callback;
      }),
      removeEventListener: vi.fn((event: string) => {
        delete listeners[event];
      }),
      scan: vi.fn().mockResolvedValue(undefined),
      write: vi.fn().mockResolvedValue(undefined),
    };

    function MockNDEFReaderConstructor(this: any) {
      return mockReaderInstance;
    }
    (window as any).NDEFReader = MockNDEFReaderConstructor;

    TestBed.configureTestingModule({
      providers: [WebNfcService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(WebNfcService);
  });

  afterEach(() => {
    delete (window as any).NDEFReader;
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isSupported', () => {
    it('should return true when running in browser and NDEFReader is in window', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should return false when NDEFReader is not in window', () => {
      delete (window as any).NDEFReader;
      expect(service.isSupported()).toBe(false);
    });

    it('should return false on server platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [WebNfcService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const serverService = TestBed.inject(WebNfcService);
      expect(serverService.isSupported()).toBe(false);
    });
  });

  describe('scan', () => {
    it('should emit error when API is unsupported', async () => {
      delete (window as any).NDEFReader;

      await expect(firstValueFrom(service.scan())).rejects.toThrow('Web NFC API not supported');
    });

    it('should start scanning and emit reading events', async () => {
      const readingPromise = firstValueFrom(service.scan());

      expect(mockReaderInstance.scan).toHaveBeenCalled();
      expect(listeners['reading']).toBeDefined();

      const mockEvent: NdefReadingEvent = {
        serialNumber: 'SN-12345',
        message: { records: [{ recordType: 'text' }] },
      };

      listeners['reading'](mockEvent);

      const received = await readingPromise;
      expect(received).toEqual({
        serialNumber: 'SN-12345',
        message: { records: [{ recordType: 'text' }] },
      });
    });

    it('should propagate reading errors from reader', async () => {
      const scan$ = service.scan();
      const readPromise = firstValueFrom(scan$);

      expect(listeners['readingerror']).toBeDefined();
      listeners['readingerror']({ error: new Error('NFC tag read failed') });

      await expect(readPromise).rejects.toThrow('NFC tag read failed');
    });

    it('should propagate scan invocation rejection', async () => {
      mockReaderInstance.scan.mockRejectedValueOnce(new Error('Permission denied'));

      const scan$ = service.scan();
      await expect(firstValueFrom(scan$)).rejects.toThrow('Permission denied');
    });
  });

  describe('write', () => {
    it('should write message to NFC tag when supported', async () => {
      const message: NdefMessage = {
        records: [{ recordType: 'text' }],
      };

      await service.write(message, { overwrite: true });

      expect(mockReaderInstance.write).toHaveBeenCalledWith(message, { overwrite: true });
    });

    it('should throw error when API is not supported', async () => {
      delete (window as any).NDEFReader;

      await expect(service.write('test string')).rejects.toThrow('Web NFC API not supported');
    });
  });
});
