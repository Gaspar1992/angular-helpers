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

import { type ElementSize, type ResizeObserverOptions } from '../services/resize-observer.service';
import { isResizeObserverSupported, resizeObserverStream } from '../utils/resize-observer.utils';
import { type ElementInput } from '../interfaces/common.types';

export interface ResizeRef {
  readonly size: Signal<ElementSize | null>;
  readonly width: Signal<number>;
  readonly height: Signal<number>;
  readonly inlineSize: Signal<number>;
  readonly blockSize: Signal<number>;
}

export function injectResizeObserver(
  elementOrRef: ElementInput,
  options?: ResizeObserverOptions,
): ResizeRef {
  assertInInjectionContext(injectResizeObserver);
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const size = signal<ElementSize | null>(null);

  if (isPlatformBrowser(platformId) && isResizeObserverSupported()) {
    const applyTiming = (source$: ReturnType<typeof resizeObserverStream>) => {
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
            sub = applyTiming(resizeObserverStream(el, options)).subscribe((s) => size.set(s));
          }
        } else {
          size.set(null);
        }
        onCleanup(() => {
          sub?.unsubscribe();
          sub = undefined;
        });
      });
    } else {
      const el = elementOrRef instanceof ElementRef ? elementOrRef.nativeElement : elementOrRef;
      if (el) {
        const sub = applyTiming(resizeObserverStream(el, options)).subscribe((s) => size.set(s));
        destroyRef.onDestroy(() => sub.unsubscribe());
      }
    }
  }

  return {
    size: size.asReadonly(),
    width: computed(() => size()?.width ?? 0),
    height: computed(() => size()?.height ?? 0),
    inlineSize: computed(() => size()?.inlineSize ?? 0),
    blockSize: computed(() => size()?.blockSize ?? 0),
  };
}
