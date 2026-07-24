import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { injectBarcodeDetector } from './inject-barcode-detector';
import { BarcodeDetectorService, type DetectedBarcode } from '../services/barcode-detector.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';

describe('injectBarcodeDetector', () => {
  let mockService: any;

  beforeEach(() => {
    mockService = {
      isSupported: vi.fn().mockReturnValue(true),
      detect: vi.fn(),
      detectStream: vi.fn(),
    };
  });

  it('should throw an error when called outside an injection context', () => {
    expect(() => injectBarcodeDetector()).toThrow(/injectBarcodeDetector/);
  });

  it('should report isSupported as false when on server platform', async () => {
    mockService.isSupported.mockReturnValue(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: BarcodeDetectorService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectBarcodeDetector();
      expect(ref.isSupported()).toBe(false);
    });
  });

  it('should report isSupported as true when supported in browser', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: BarcodeDetectorService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectBarcodeDetector();
      await new Promise((resolve) => queueMicrotask(resolve));
      expect(ref.isSupported()).toBe(true);
    });
  });

  it('should detect barcodes successfully and update signals', async () => {
    const mockBarcodes: DetectedBarcode[] = [
      {
        boundingBox: {} as any,
        cornerPoints: [],
        format: 'qr_code',
        rawValue: 'https://example.com',
      },
    ];
    mockService.detect.mockResolvedValue(mockBarcodes);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: BarcodeDetectorService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectBarcodeDetector();
      await new Promise((resolve) => queueMicrotask(resolve));

      const result = await ref.detect({} as any);
      expect(result).toEqual(mockBarcodes);
      expect(ref.barcodes()).toEqual(mockBarcodes);
      expect(ref.error()).toBeNull();
    });
  });

  it('should set error signal on detect rejection', async () => {
    const detectError = new Error('Detection failed');
    mockService.detect.mockRejectedValue(detectError);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: BarcodeDetectorService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectBarcodeDetector();
      await new Promise((resolve) => queueMicrotask(resolve));

      await expect(ref.detect({} as any)).rejects.toThrow('Detection failed');
      expect(ref.error()).toBe(detectError);
    });
  });

  it('should scan barcodes stream successfully and handle stopScan', async () => {
    const mockBarcodes: DetectedBarcode[] = [
      {
        boundingBox: {} as any,
        cornerPoints: [],
        format: 'qr_code',
        rawValue: 'https://example.com',
      },
    ];
    mockService.detectStream.mockReturnValue(of(mockBarcodes));

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: BarcodeDetectorService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectBarcodeDetector();
      await new Promise((resolve) => queueMicrotask(resolve));

      expect(ref.scanning()).toBe(false);

      ref.startScan({} as any);
      expect(ref.scanning()).toBe(true);
      expect(ref.barcodes()).toEqual(mockBarcodes);

      ref.stopScan();
      expect(ref.scanning()).toBe(false);
    });
  });

  it('should set error on stream scanning error', async () => {
    const scanError = new Error('Stream error');
    mockService.detectStream.mockReturnValue(throwError(() => scanError));

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: BarcodeDetectorService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectBarcodeDetector();
      await new Promise((resolve) => queueMicrotask(resolve));

      ref.startScan({} as any);
      expect(ref.scanning()).toBe(false);
      expect(ref.error()).toBe(scanError);
    });
  });

  it('should unsubscribe scanning on DestroyRef onDestroy', async () => {
    const unsubscribeSpy = vi.fn();
    const mockSubscription = {
      unsubscribe: unsubscribeSpy,
    };
    const mockObservable = {
      subscribe: vi.fn().mockReturnValue(mockSubscription),
    };
    mockService.detectStream.mockReturnValue(mockObservable);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: BarcodeDetectorService, useValue: mockService },
      ],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);
    let ref: any;

    runInInjectionContext(childInjector, () => {
      ref = injectBarcodeDetector();
    });

    await new Promise((resolve) => queueMicrotask(resolve));
    ref.startScan({} as any);
    expect(ref.scanning()).toBe(true);

    childInjector.destroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
