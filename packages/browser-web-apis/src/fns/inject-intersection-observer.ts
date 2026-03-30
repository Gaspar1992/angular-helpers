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
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const isIntersecting = signal<boolean>(false);

  if (isPlatformBrowser(platformId) && isIntersectionObserverSupported()) {
    if (isSignal(elementOrRef)) {
      let sub: Subscription | undefined;
      effect((onCleanup) => {
        sub?.unsubscribe();
        const raw = elementOrRef();
        if (raw) {
          const el = raw instanceof ElementRef ? raw.nativeElement : raw;
          sub = intersectionObserverStream(el, options).subscribe((v) => isIntersecting.set(v));
        }
        onCleanup(() => sub?.unsubscribe());
      });
    } else {
      const el = elementOrRef instanceof ElementRef ? elementOrRef.nativeElement : elementOrRef;
      const sub = intersectionObserverStream(el, options).subscribe((v) => isIntersecting.set(v));
      destroyRef.onDestroy(() => sub.unsubscribe());
    }
  }

  return {
    isIntersecting: isIntersecting.asReadonly(),
    isVisible: computed(() => isIntersecting()),
  };
}
