import { assertInInjectionContext, type Signal } from '@angular/core';
import { injectMediaQuery } from './inject-media-query';

export interface ReducedMotionOptions {
  defaultValue?: boolean;
}

/**
 * Tracks user prefers-reduced-motion: reduce preference reactively via media query.
 * SSR-safe: returns options.defaultValue (or false) on the server.
 * Layers on top of `injectMediaQuery`.
 */
export function injectReducedMotion(options?: ReducedMotionOptions): Signal<boolean> {
  assertInInjectionContext(injectReducedMotion);
  return injectMediaQuery('(prefers-reduced-motion: reduce)', options);
}
