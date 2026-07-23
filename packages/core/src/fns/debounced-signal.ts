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

export function debouncedSignal<T>(
  source: Signal<T>,
  timeMs: number,
  options?: { injector?: Injector },
): Signal<T> {
  const injector = options?.injector;
  if (!injector) {
    assertInInjectionContext(debouncedSignal);
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
  const debounced = signal<T>(source());
  let timeoutId: any = null;

  const cleanup = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  destroyRef.onDestroy(() => {
    cleanup();
  });

  let lastValue = source();

  executeInContext(() => {
    effect(
      (onCleanup) => {
        const val = source();
        if (val === lastValue) {
          return;
        }
        lastValue = val;

        cleanup();

        timeoutId = setTimeout(() => {
          debounced.set(val);
        }, timeMs);

        onCleanup(() => {
          cleanup();
        });
      },
      { injector },
    );
  });

  return debounced.asReadonly();
}
