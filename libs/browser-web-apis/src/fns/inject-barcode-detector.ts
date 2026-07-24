import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type Subscription } from 'rxjs';

import {
  BarcodeDetectorService,
  type BarcodeFormat,
  type DetectedBarcode,
} from '../services/barcode-detector.service';

export interface BarcodeDetectorRef {
  readonly isSupported: Signal<boolean>;
  readonly barcodes: Signal<DetectedBarcode[]>;
  readonly error: Signal<Error | null>;
  readonly scanning: Signal<boolean>;
  detect(source: ImageBitmapSource, formats?: BarcodeFormat[]): Promise<DetectedBarcode[]>;
  startScan(
    video: HTMLVideoElement,
    options?: { formats?: BarcodeFormat[]; interval?: number },
  ): void;
  stopScan(): void;
}

export function injectBarcodeDetector(): BarcodeDetectorRef {
  assertInInjectionContext(injectBarcodeDetector);
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const detectorService = inject(BarcodeDetectorService);

  const supported = signal<boolean>(false);
  const barcodes = signal<DetectedBarcode[]>([]);
  const error = signal<Error | null>(null);
  const scanning = signal<boolean>(false);

  let sub: Subscription | null = null;
  let disposed = false;

  if (isBrowser) {
    let destroyed = false;
    queueMicrotask(() => {
      if (destroyed) return;
      supported.set(detectorService.isSupported());
    });

    destroyRef.onDestroy(() => {
      destroyed = true;
      disposed = true;
      if (sub) {
        sub.unsubscribe();
      }
    });
  } else {
    destroyRef.onDestroy(() => {
      disposed = true;
    });
  }

  const detect = async (
    source: ImageBitmapSource,
    formats?: BarcodeFormat[],
  ): Promise<DetectedBarcode[]> => {
    if (!supported() || disposed) {
      const err = new Error('BarcodeDetector API is not supported in this environment');
      error.set(err);
      throw err;
    }
    error.set(null);
    try {
      const result = await detectorService.detect(source, formats);
      barcodes.set(result);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      error.set(err);
      throw err;
    }
  };

  const startScan = (
    video: HTMLVideoElement,
    options?: { formats?: BarcodeFormat[]; interval?: number },
  ): void => {
    if (!supported() || disposed) return;
    stopScan();
    scanning.set(true);
    error.set(null);
    sub = detectorService.detectStream(video, options).subscribe({
      next: (result) => barcodes.set(result),
      error: (e) => {
        error.set(e instanceof Error ? e : new Error(String(e)));
        scanning.set(false);
      },
    });
  };

  const stopScan = (): void => {
    if (sub) {
      sub.unsubscribe();
      sub = null;
    }
    scanning.set(false);
  };

  return {
    isSupported: supported.asReadonly(),
    barcodes: barcodes.asReadonly(),
    error: error.asReadonly(),
    scanning: scanning.asReadonly(),
    detect,
    startScan,
    stopScan,
  };
}
