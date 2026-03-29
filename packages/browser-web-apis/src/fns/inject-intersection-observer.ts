import {
  computed,
  DestroyRef,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { type IntersectionObserverOptions } from '../services/intersection-observer.service';
import {
  intersectionObserverStream,
  isIntersectionObserverSupported,
} from '../utils/intersection-observer.utils';

export interface IntersectionRef {
  readonly isIntersecting: Signal<boolean>;
  readonly isVisible: Signal<boolean>;
}

export function injectIntersectionObserver(
  elementOrRef: Element | ElementRef<Element>,
  options?: IntersectionObserverOptions,
): IntersectionRef {
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const isIntersecting = signal<boolean>(false);

  if (isPlatformBrowser(platformId) && isIntersectionObserverSupported()) {
    const el = elementOrRef instanceof ElementRef ? elementOrRef.nativeElement : elementOrRef;
    const sub = intersectionObserverStream(el, options).subscribe((v) => isIntersecting.set(v));
    destroyRef.onDestroy(() => sub.unsubscribe());
  }

  return {
    isIntersecting: isIntersecting.asReadonly(),
    isVisible: computed(() => isIntersecting()),
  };
}
