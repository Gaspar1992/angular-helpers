import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface MousePosition {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
}

/**
 * Tracks mouse pointer coordinates reactively with a passive listener.
 * SSR-safe: returns zeros for all coordinates on the server.
 */
export function injectMousePosition(): Signal<MousePosition> {
  assertInInjectionContext(injectMousePosition);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  const initialVal: MousePosition = {
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    screenX: 0,
    screenY: 0,
  };

  const pos = signal<MousePosition>(initialVal);

  if (isBrowser && typeof window !== 'undefined') {
    const listener = (event: MouseEvent) => {
      pos.set({
        x: event.clientX,
        y: event.clientY,
        clientX: event.clientX,
        clientY: event.clientY,
        pageX: event.pageX,
        pageY: event.pageY,
        screenX: event.screenX,
        screenY: event.screenY,
      });
    };

    window.addEventListener('mousemove', listener, { passive: true });

    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      window.removeEventListener('mousemove', listener);
    });
  }

  return pos.asReadonly();
}
