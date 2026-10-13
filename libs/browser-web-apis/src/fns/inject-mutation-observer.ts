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

import { type MutationObserverOptions } from '../services/mutation-observer.service';
import {
  isMutationObserverSupported,
  mutationObserverStream,
} from '../utils/mutation-observer.utils';
import { type ElementInput } from '../interfaces/common.types';

export interface MutationRef {
  readonly mutations: Signal<MutationRecord[]>;
  readonly mutationCount: Signal<number>;
}

export function injectMutationObserver(
  elementOrRef: ElementInput,
  options?: MutationObserverOptions,
): MutationRef {
  assertInInjectionContext(injectMutationObserver);
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const mutations = signal<MutationRecord[]>([]);

  if (isPlatformBrowser(platformId) && isMutationObserverSupported()) {
    const applyTiming = (source$: ReturnType<typeof mutationObserverStream>) => {
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
            sub = applyTiming(mutationObserverStream(el, options)).subscribe((m) =>
              mutations.set(m),
            );
          }
        } else {
          mutations.set([]);
        }
        onCleanup(() => {
          sub?.unsubscribe();
          sub = undefined;
        });
      });
    } else {
      const el = elementOrRef instanceof ElementRef ? elementOrRef.nativeElement : elementOrRef;
      if (el) {
        const sub = applyTiming(mutationObserverStream(el, options)).subscribe((m) =>
          mutations.set(m),
        );
        destroyRef.onDestroy(() => sub.unsubscribe());
      }
    }
  }

  return {
    mutations: mutations.asReadonly(),
    mutationCount: computed(() => mutations().length),
  };
}
