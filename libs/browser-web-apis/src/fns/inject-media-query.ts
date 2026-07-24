import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface MediaQueryOptions {
  defaultValue?: boolean;
}

/**
 * Evaluates a media query reactively and returns a Readonly Signal<boolean> that updates when changes occur.
 * SSR-safe: returns options.defaultValue (or false) on the server.
 */
export function injectMediaQuery(query: string, options?: MediaQueryOptions): Signal<boolean> {
  assertInInjectionContext(injectMediaQuery);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  const defaultValue = options?.defaultValue ?? false;
  const matches = signal<boolean>(defaultValue);

  if (isBrowser && typeof window !== 'undefined' && 'matchMedia' in window) {
    const mediaQueryList = window.matchMedia(query);
    matches.set(mediaQueryList.matches);

    const listener = (event: MediaQueryListEvent | MediaQueryList) => {
      matches.set(event.matches);
    };

    // Modern browsers support addEventListener on MediaQueryList
    mediaQueryList.addEventListener('change', listener);

    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      mediaQueryList.removeEventListener('change', listener);
    });
  }

  return matches.asReadonly();
}
