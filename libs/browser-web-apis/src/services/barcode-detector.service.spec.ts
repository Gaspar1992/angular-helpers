import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom, take } from 'rxjs';
import { BarcodeDetectorService, type DetectedBarcode } from './barcode-detector.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('BarcodeDetectorService', () => {
  let service: BarcodeDetectorService;
  let mockDetectedBarcodes: DetectedBarcode[];

  beforeEach(() => {
    mockDetectedBarcodes = [
      {
        format: 'qr_code',
        rawValue: 'https://angular.dev',
        boundingBox: {} as DOMRectReadOnly,
        cornerPoints: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
      },
    ];

    class MockBarcodeDetector {
      constructor(public options?: any) {}
      detect = vi.fn().mockResolvedValue(mockDetectedBarcodes);
      static getSupportedFormats = vi.fn().mockResolvedValue(['qr_code', 'ean_13', 'code_128']);
    }

    vi.stubGlobal('BarcodeDetector', MockBarcodeDetector);

    TestBed.configureTestingModule({
      providers: [BarcodeDetectorService, BrowserCapabilityService],
    });
    service = TestBed.inject(BarcodeDetectorService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should get supported formats', async () => {
    const formats = await service.getSupportedFormats();
    expect(formats).toEqual(['qr_code', 'ean_13', 'code_128']);
  });

  it('should detect barcode from image bitmap source', async () => {
    const mockCanvas = document.createElement('canvas');
    const barcodes = await service.detect(mockCanvas, ['qr_code']);
    expect(barcodes.length).toBe(1);
    expect(barcodes[0].rawValue).toBe('https://angular.dev');
  });

  it('should detect stream from video element', async () => {
    let rafCallback: any = null;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb) => {
        rafCallback = cb;
        return 101;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const video = document.createElement('video');
    const stream$ = service.detectStream(video, { formats: ['qr_code'] });

    const promise = firstValueFrom(stream$.pipe(take(1)));
    if (rafCallback) rafCallback();

    const barcodes = await promise;
    expect(barcodes.length).toBe(1);
    expect(barcodes[0].format).toBe('qr_code');
  });

  it('should handle unsupported environment', async () => {
    delete (window as any).BarcodeDetector;
    delete (globalThis as any).BarcodeDetector;
    expect(service.isSupported()).toBe(false);
    expect(await service.getSupportedFormats()).toEqual([]);

    const mockCanvas = document.createElement('canvas');
    await expect(service.detect(mockCanvas)).rejects.toThrow('BarcodeDetector API not supported');

    const video = document.createElement('video');
    await expect(firstValueFrom(service.detectStream(video))).rejects.toThrow(
      'BarcodeDetector API not supported',
    );
  });
});
