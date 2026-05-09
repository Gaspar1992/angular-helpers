import { inject, PLATFORM_ID, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { EyeDropperResult } from '../services/eye-dropper.service';

export interface EyeDropperRef {
  readonly isSupported: Signal<boolean>;
  readonly color: Signal<string | null>;
  readonly error: Signal<Error | null>;
  readonly isOpening: Signal<boolean>;
  open(options?: { signal?: AbortSignal }): Promise<EyeDropperResult | null>;
}

interface WindowWithEyeDropper extends Window {
  EyeDropper?: any;
}

export function injectEyeDropper(): EyeDropperRef {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const hasDropper = isBrowser && typeof window !== 'undefined' && 'EyeDropper' in window;

  const supported = signal<boolean>(hasDropper && window.isSecureContext);
  const color = signal<string | null>(null);
  const error = signal<Error | null>(null);
  const isOpening = signal<boolean>(false);

  const open = async (options?: { signal?: AbortSignal }): Promise<EyeDropperResult | null> => {
    if (!supported()) {
      error.set(new Error('EyeDropper API is not supported in this environment'));
      return null;
    }

    const EyeDropperClass = (window as unknown as WindowWithEyeDropper).EyeDropper;
    const dropper = new EyeDropperClass();

    isOpening.set(true);
    error.set(null);

    try {
      const result = await dropper.open(options);
      color.set(result.sRGBHex);
      return result;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // User canceled, not an error
        return null;
      }
      const err = e instanceof Error ? e : new Error(String(e));
      error.set(err);
      return null;
    } finally {
      isOpening.set(false);
    }
  };

  return {
    isSupported: supported.asReadonly(),
    color: color.asReadonly(),
    error: error.asReadonly(),
    isOpening: isOpening.asReadonly(),
    open,
  };
}
