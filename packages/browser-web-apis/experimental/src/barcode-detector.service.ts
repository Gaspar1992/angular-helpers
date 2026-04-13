import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from '@angular-helpers/browser-web-apis';

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
  cornerPoints: Array<{ x: number; y: number }>;
  format: BarcodeFormat;
  rawValue: string;
}

interface BarcodeDetectorInstance {
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: BarcodeFormat[] }): BarcodeDetectorInstance;
  getSupportedFormats(): Promise<BarcodeFormat[]>;
}

function getBarcodeDetectorClass(): BarcodeDetectorConstructor | undefined {
  return (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
}

@Injectable()
export class BarcodeDetectorService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'barcode-detector';
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && 'BarcodeDetector' in window;
  }

  async getSupportedFormats(): Promise<BarcodeFormat[]> {
    if (!this.isSupported()) {
      return [];
    }
    return getBarcodeDetectorClass()!.getSupportedFormats();
  }

  async detect(source: ImageBitmapSource, formats?: BarcodeFormat[]): Promise<DetectedBarcode[]> {
    if (!this.isSupported()) {
      throw new Error('BarcodeDetector API not supported');
    }

    const detector = new (getBarcodeDetectorClass()!)(formats ? { formats } : undefined);
    return detector.detect(source);
  }

  detectStream(
    video: HTMLVideoElement,
    options: { formats?: BarcodeFormat[]; interval?: number } = {},
  ): Observable<DetectedBarcode[]> {
    return new Observable<DetectedBarcode[]>((subscriber) => {
      if (!this.isSupported()) {
        subscriber.error(new Error('BarcodeDetector API not supported'));
        return;
      }

      const detector = new (getBarcodeDetectorClass()!)(
        options.formats ? { formats: options.formats } : undefined,
      );

      let rafId: number | null = null;
      let isActive = true;

      const detect = async () => {
        if (!isActive) return;

        try {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0) {
            subscriber.next(barcodes);
          }
          rafId = requestAnimationFrame(detect);
        } catch (error) {
          subscriber.error(error);
        }
      };

      rafId = requestAnimationFrame(detect);

      return () => {
        isActive = false;
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
      };
    });
  }
}
