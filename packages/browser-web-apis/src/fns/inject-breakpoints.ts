import { assertInInjectionContext, type Signal } from '@angular/core';
import { injectMediaQuery } from './inject-media-query';

export interface BreakpointsOptions<K extends string> {
  defaultValues?: Partial<Record<K, boolean>>;
}

/**
 * Combines multiple media queries into a record of reactive boolean signals.
 * Layers directly on top of `injectMediaQuery`.
 */
export function injectBreakpoints<K extends string>(
  breakpoints: Record<K, string>,
  options?: BreakpointsOptions<K>,
): Record<K, Signal<boolean>> {
  assertInInjectionContext(injectBreakpoints);

  const result = {} as Record<K, Signal<boolean>>;

  for (const key of Object.keys(breakpoints) as K[]) {
    const query = breakpoints[key];
    const defaultValue = options?.defaultValues?.[key];
    result[key] = injectMediaQuery(query, { defaultValue });
  }

  return result;
}
