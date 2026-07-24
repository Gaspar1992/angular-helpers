import {
  assertInInjectionContext,
  DestroyRef,
  effect,
  inject,
  Injector,
  runInInjectionContext,
  type Signal,
  signal,
} from '@angular/core';
import { injectPlatform } from '../utils/platform';

export function throttledSignal<T>(
  source: Signal<T>,
  timeMs: number,
  options?: { leading?: boolean; trailing?: boolean; injector?: Injector },
): Signal<T> {
  const injector = options?.injector;
  if (!injector) {
    assertInInjectionContext(throttledSignal);
  }

  const executeInContext = <R>(fn: () => R): R => {
    if (injector) {
      return runInInjectionContext(injector, fn);
    }
    return fn();
  };

  const platform = executeInContext(() => injectPlatform());

  if (!platform.isBrowser) {
    // SSR context: return source value immediately (no scheduling)
    return signal<T>(source()).asReadonly();
  }

  const destroyRef = executeInContext(() => inject(DestroyRef));
  const throttled = signal<T>(source());

  const leading = options?.leading ?? true;
  const trailing = options?.trailing ?? true;

  let timeoutId: any = null;
  let inCooldown = false;
  let hasTrailingVal = false;
  let trailingVal: T;
  let lastValue = source();

  const cleanup = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const cooldownExpired = () => {
    timeoutId = null;
    inCooldown = false;
    if (trailing && hasTrailingVal) {
      const nextVal = trailingVal;
      hasTrailingVal = false;
      throttled.set(nextVal);
      startCooldown();
    }
  };

  const startCooldown = () => {
    inCooldown = true;
    timeoutId = setTimeout(cooldownExpired, timeMs);
  };

  destroyRef.onDestroy(() => {
    cleanup();
  });

  executeInContext(() => {
    effect(
      () => {
        const val = source();
        if (val === lastValue) {
          return;
        }
        lastValue = val;

        if (inCooldown) {
          if (trailing) {
            hasTrailingVal = true;
            trailingVal = val;
          }
        } else {
          if (leading) {
            throttled.set(val);
            startCooldown();
          } else if (trailing) {
            hasTrailingVal = true;
            trailingVal = val;
            startCooldown();
          }
        }
      },
      { injector },
    );
  });

  return throttled.asReadonly();
}
