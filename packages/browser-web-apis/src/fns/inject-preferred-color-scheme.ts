import { assertInInjectionContext, type Signal } from '@angular/core';
import { injectMediaQuery } from './inject-media-query';

export interface PreferredColorSchemeOptions {
  defaultValue?: boolean;
}

/**
 * Tracks user prefers-color-scheme: dark preference reactively via media query.
 * SSR-safe: returns options.defaultValue (or false) on the server.
 * Layers on top of `injectMediaQuery`.
 */
export function injectPreferredColorScheme(options?: PreferredColorSchemeOptions): Signal<boolean> {
  assertInInjectionContext(injectPreferredColorScheme);
  return injectMediaQuery('(prefers-color-scheme: dark)', options);
}
