import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ScrollPosition {
  x: number;
  y: number;
}

/**
 * Tracks window scroll coordinates reactively with a passive scroll listener.
 * SSR-safe: returns zeros on the server.
 */
export function injectWindowScroll(): Signal<ScrollPosition> {
  assertInInjectionContext(injectWindowScroll);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  const initialVal: ScrollPosition = {
    x: 0,
    y: 0,
  };

  const pos = signal<ScrollPosition>(initialVal);

  if (isBrowser && typeof window !== 'undefined') {
    const getScrollPosition = (): ScrollPosition => ({
      x: window.scrollX !== undefined ? window.scrollX : window.pageXOffset,
      y: window.scrollY !== undefined ? window.scrollY : window.pageYOffset,
    });

    pos.set(getScrollPosition());

    const listener = () => {
      pos.set(getScrollPosition());
    };

    window.addEventListener('scroll', listener, { passive: true });

    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', listener);
    });
  }

  return pos.asReadonly();
}
