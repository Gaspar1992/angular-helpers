import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  Injector,
  runInInjectionContext,
  type Signal,
  signal,
} from '@angular/core';
import { injectPlatform } from '../utils/platform';

export function timerSignal(
  delay: number,
  interval?: number,
  options?: { injector?: Injector },
): Signal<number> {
  const injector = options?.injector;
  if (!injector) {
    assertInInjectionContext(timerSignal);
  }

  const executeInContext = <R>(fn: () => R): R => {
    if (injector) {
      return runInInjectionContext(injector, fn);
    }
    return fn();
  };

  const platform = executeInContext(() => injectPlatform());
  const timer = signal<number>(0);

  if (!platform.isBrowser) {
    // SSR context: return 0 immediately (no scheduling)
    return timer.asReadonly();
  }

  const destroyRef = executeInContext(() => inject(DestroyRef));

  let timeoutId: any = null;
  let intervalId: any = null;

  const cleanup = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  destroyRef.onDestroy(() => {
    cleanup();
  });

  timeoutId = setTimeout(() => {
    timeoutId = null;
    timer.set(1);

    if (interval !== undefined && interval > 0) {
      intervalId = setInterval(() => {
        timer.update((val) => val + 1);
      }, interval);
    }
  }, delay);

  return timer.asReadonly();
}
