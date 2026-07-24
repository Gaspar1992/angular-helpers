import { InjectionToken, PLATFORM_ID, inject, signal, type WritableSignal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * An SSR-safe InjectionToken for the global `window` object.
 * Returns the native `window` in the browser, or an empty mock object in SSR.
 */
export const WINDOW = new InjectionToken<Window>('Safe Window Token', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID);
    return isPlatformBrowser(platformId) ? window : ({} as Window);
  },
});

/**
 * An SSR-safe InjectionToken for the global `navigator` object.
 * Returns the native `navigator` in the browser, or an empty mock object in SSR.
 */
export const NAVIGATOR = new InjectionToken<Navigator>('Safe Navigator Token', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID);
    return isPlatformBrowser(platformId) ? navigator : ({} as Navigator);
  },
});

/**
 * Creates a WritableSignal that safely initializes a browser-only API.
 * In a browser environment, it evaluates `browserValueFn()`.
 * In an SSR environment, it returns `ssrFallbackValue` without executing browser APIs.
 *
 * Must be called in an injection context (e.g., class property initializer or constructor).
 *
 * @param browserValueFn A function that returns the initial value using browser APIs.
 * @param ssrFallbackValue The fallback value to use during Server-Side Rendering.
 */
export function createBrowserSignal<T>(
  browserValueFn: () => T,
  ssrFallbackValue: T,
): WritableSignal<T> {
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    return signal<T>(browserValueFn());
  }

  return signal<T>(ssrFallbackValue);
}
