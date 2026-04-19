import { DestroyRef, inject, PLATFORM_ID, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface WakeLockSentinelLike extends EventTarget {
  released: boolean;
  type: 'screen';
  release(): Promise<void>;
}

interface WakeLockNavigator {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
}

export interface WakeLockRef {
  readonly active: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly isSupported: Signal<boolean>;
  request(): Promise<boolean>;
  release(): Promise<void>;
}

export function injectWakeLock(): WakeLockRef {
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const isBrowser = isPlatformBrowser(platformId);
  const supported = signal<boolean>(
    isBrowser && typeof navigator !== 'undefined' && 'wakeLock' in navigator,
  );
  const active = signal<boolean>(false);
  const error = signal<string | null>(null);
  let sentinel: WakeLockSentinelLike | null = null;
  let disposed = false;

  const onRelease = (): void => {
    if (!disposed) active.set(false);
    sentinel = null;
  };

  const request = async (): Promise<boolean> => {
    if (!supported() || disposed) {
      error.set('Screen Wake Lock API not supported');
      return false;
    }
    if (sentinel && !sentinel.released) return true;
    try {
      const nav = navigator as unknown as WakeLockNavigator;
      sentinel = await nav.wakeLock!.request('screen');
      sentinel!.addEventListener('release', onRelease);
      if (!disposed) {
        active.set(true);
        error.set(null);
      }
      return true;
    } catch (err) {
      if (!disposed) error.set(err instanceof Error ? err.message : 'wakeLock.request failed');
      return false;
    }
  };

  const release = async (): Promise<void> => {
    if (!sentinel || sentinel.released) return;
    try {
      await sentinel.release();
    } finally {
      onRelease();
    }
  };

  destroyRef.onDestroy(() => {
    disposed = true;
    if (sentinel && !sentinel.released) {
      void sentinel.release();
    }
    sentinel = null;
  });

  return {
    active: active.asReadonly(),
    error: error.asReadonly(),
    isSupported: supported.asReadonly(),
    request,
    release,
  };
}
