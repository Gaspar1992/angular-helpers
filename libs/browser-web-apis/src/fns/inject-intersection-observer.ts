import {
  assertInInjectionContext,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  isSignal,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { debounceTime, throttleTime, type Subscription } from 'rxjs';

import { type IntersectionObserverOptions } from '../services/intersection-observer.service';
import {
  intersectionObserverStream,
  isIntersectionObserverSupported,
} from '../utils/intersection-observer.utils';
import { type ElementInput } from '../interfaces/common.types';

export interface IntersectionRef {
  readonly isIntersecting: Signal<boolean>;
  readonly isVisible: Signal<boolean>;
}

export function injectIntersectionObserver(
  elementOrRef: ElementInput,
  options?: IntersectionObserverOptions,
): IntersectionRef {
  assertInInjectionContext(injectIntersectionObserver);
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const isIntersecting = signal<boolean>(false);

  if (isPlatformBrowser(platformId) && isIntersectionObserverSupported()) {
    const applyTiming = (source$: ReturnType<typeof intersectionObserverStream>) => {
      if (options?.debounceMs && options.debounceMs > 0) {
        return source$.pipe(debounceTime(options.debounceMs));
      }
      if (options?.throttleMs && options.throttleMs > 0) {
        return source$.pipe(
          throttleTime(options.throttleMs, undefined, { leading: true, trailing: true }),
        );
      }
      return source$;
    };

    if (isSignal(elementOrRef)) {
      let sub: Subscription | undefined;
      effect((onCleanup) => {
        sub?.unsubscribe();
        sub = undefined;
        const raw = elementOrRef();
        if (raw) {
          const el = raw instanceof ElementRef ? raw.nativeElement : raw;
          if (el) {
            sub = applyTiming(intersectionObserverStream(el, options)).subscribe((v) =>
              isIntersecting.set(v),
            );
          }
        } else {
          isIntersecting.set(false);
        }
        onCleanup(() => {
          sub?.unsubscribe();
          sub = undefined;
        });
      });
    } else {
      const el = elementOrRef instanceof ElementRef ? elementOrRef.nativeElement : elementOrRef;
      if (el) {
        const sub = applyTiming(intersectionObserverStream(el, options)).subscribe((v) =>
          isIntersecting.set(v),
        );
        destroyRef.onDestroy(() => sub.unsubscribe());
      }
    }
  }

  return {
    isIntersecting: isIntersecting.asReadonly(),
    isVisible: computed(() => isIntersecting()),
  };
}
