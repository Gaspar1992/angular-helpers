import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type BarcodeFormat =
  | 'aztec'
  | 'code_128'
  | 'code_39'
  | 'code_93'
  | 'codabar'
  | 'data_matrix'
  | 'ean_13'
  | 'ean_8'
  | 'itf'
  | 'pdf417'
  | 'qr_code'
  | 'upc_a'
  | 'upc_e'
  | 'unknown';

export interface DetectedBarcode {
  boundingBox: DOMRectReadOnly;
  cornerPoints: ReadonlyArray<{ x: number; y: number }>;
  format: BarcodeFormat;
  rawValue: string;
}

interface BarcodeDetectorInstance {
  detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats: BarcodeFormat[] }): BarcodeDetectorInstance;
  getSupportedFormats(): Promise<BarcodeFormat[]>;
}

function getBarcodeDetectorClass(): BarcodeDetectorConstructor | undefined {
  return (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
}

@Injectable()
export class BarcodeDetectorService {
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'BarcodeDetector' in window;
  }

  async getSupportedFormats(): Promise<BarcodeFormat[]> {
    if (!this.isSupported()) return [];
    return getBarcodeDetectorClass()!.getSupportedFormats();
  }

  async detect(image: ImageBitmapSource, formats?: BarcodeFormat[]): Promise<DetectedBarcode[]> {
    if (!this.isSupported()) {
      throw new Error('BarcodeDetector API not supported');
    }
    const detector = formats
      ? new (getBarcodeDetectorClass()!)({ formats })
      : new (getBarcodeDetectorClass()!)();
    return detector.detect(image);
  }
}
