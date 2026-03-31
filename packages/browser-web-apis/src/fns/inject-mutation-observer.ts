import {
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
import { type Subscription } from 'rxjs';

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
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const mutations = signal<MutationRecord[]>([]);

  if (isPlatformBrowser(platformId) && isMutationObserverSupported()) {
    if (isSignal(elementOrRef)) {
      let sub: Subscription | undefined;
      effect((onCleanup) => {
        sub?.unsubscribe();
        const raw = elementOrRef();
        if (raw) {
          const el = raw instanceof ElementRef ? raw.nativeElement : raw;
          sub = mutationObserverStream(el, options).subscribe((m) => mutations.set(m));
        }
        onCleanup(() => sub?.unsubscribe());
      });
    } else {
      const el = elementOrRef instanceof ElementRef ? elementOrRef.nativeElement : elementOrRef;
      const sub = mutationObserverStream(el, options).subscribe((m) => mutations.set(m));
      destroyRef.onDestroy(() => sub.unsubscribe());
    }
  }

  return {
    mutations: mutations.asReadonly(),
    mutationCount: computed(() => mutations().length),
  };
}
