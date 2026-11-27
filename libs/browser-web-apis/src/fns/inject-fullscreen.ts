import {
  DestroyRef,
  PLATFORM_ID,
  assertInInjectionContext,
  inject,
  signal,
  type Signal,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export interface FullscreenRef {
  readonly isFullscreen: Signal<boolean>;
  readonly isSupported: Signal<boolean>;
  enter: (element?: Element) => Promise<void>;
  exit: () => Promise<void>;
  toggle: (element?: Element) => Promise<void>;
}

/**
 * Signal-first injection primitive for the Fullscreen API.
 * Automatically tracks `fullscreenchange` events and cleans up listeners on destroy.
 */
export function injectFullscreen(): FullscreenRef {
  assertInInjectionContext(injectFullscreen);
  const platformId = inject(PLATFORM_ID);
  const document = inject(DOCUMENT);
  const destroyRef = inject(DestroyRef);

  const isBrowser = isPlatformBrowser(platformId);
  const doc = document as Document & {
    webkitFullscreenEnabled?: boolean;
    webkitFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void>;
  };

  const supported = isBrowser && !!(doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled);
  const readFullscreen = (): boolean =>
    isBrowser && !!(doc.fullscreenElement ?? doc.webkitFullscreenElement);

  const isSupported = signal(supported);
  const isFullscreen = signal(readFullscreen());

  if (isBrowser) {
    const onFullscreenChange = () => {
      isFullscreen.set(readFullscreen());
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    destroyRef.onDestroy(() => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    });
  }

  const enter = async (element?: Element): Promise<void> => {
    if (!supported) {
      throw new Error('Fullscreen API not supported in this browser');
    }
    const target = (element ?? document.documentElement) as Element & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    if (target.requestFullscreen) {
      await target.requestFullscreen();
    } else if (target.webkitRequestFullscreen) {
      await target.webkitRequestFullscreen();
    }
    isFullscreen.set(readFullscreen());
  };

  const exit = async (): Promise<void> => {
    if (!isBrowser || !readFullscreen()) {
      return;
    }
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    }
    isFullscreen.set(readFullscreen());
  };

  const toggle = async (element?: Element): Promise<void> => {
    if (readFullscreen()) {
      await exit();
    } else {
      await enter(element);
    }
  };

  return {
    isFullscreen: isFullscreen.asReadonly(),
    isSupported: isSupported.asReadonly(),
    enter,
    exit,
    toggle,
  };
}
