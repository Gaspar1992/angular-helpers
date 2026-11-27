import { PLATFORM_ID, assertInInjectionContext, inject, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface WebShareResult {
  shared: boolean;
  error?: string;
}

export interface WebShareRef {
  readonly isSupported: Signal<boolean>;
  readonly canShareFiles: Signal<boolean>;
  readonly isSharing: Signal<boolean>;
  readonly lastError: Signal<string | null>;
  share: (data: ShareData) => Promise<WebShareResult>;
}

/**
 * Signal-first injection primitive for the Web Share API.
 * SSR-safe: reports `isSupported() === false` on the server.
 */
export function injectWebShare(): WebShareRef {
  assertInInjectionContext(injectWebShare);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const supported = isBrowser && typeof navigator !== 'undefined' && 'share' in navigator;

  let filesSupported = false;
  if (supported && typeof navigator.canShare === 'function' && typeof File !== 'undefined') {
    try {
      filesSupported = navigator.canShare({
        files: [new File([''], 'test.txt', { type: 'text/plain' })],
      });
    } catch {
      filesSupported = false;
    }
  }

  const isSupported = signal(supported);
  const canShareFiles = signal(filesSupported);
  const isSharing = signal(false);
  const lastError = signal<string | null>(null);

  const share = async (data: ShareData): Promise<WebShareResult> => {
    if (!supported) {
      const error = 'Web Share API not supported in this environment';
      lastError.set(error);
      return { shared: false, error };
    }
    isSharing.set(true);
    lastError.set(null);
    try {
      await navigator.share(data);
      return { shared: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Share failed';
      lastError.set(error);
      return { shared: false, error };
    } finally {
      isSharing.set(false);
    }
  };

  return {
    isSupported: isSupported.asReadonly(),
    canShareFiles: canShareFiles.asReadonly(),
    isSharing: isSharing.asReadonly(),
    lastError: lastError.asReadonly(),
    share,
  };
}
