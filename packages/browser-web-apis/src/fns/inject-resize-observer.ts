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

import { type ElementSize, type ResizeObserverOptions } from '../services/resize-observer.service';
import { isResizeObserverSupported, resizeObserverStream } from '../utils/resize-observer.utils';

export interface ResizeRef {
  readonly size: Signal<ElementSize | null>;
  readonly width: Signal<number>;
  readonly height: Signal<number>;
  readonly inlineSize: Signal<number>;
  readonly blockSize: Signal<number>;
}

export function injectResizeObserver(
  elementOrRef: Element | ElementRef<Element>,
  options?: ResizeObserverOptions,
): ResizeRef {
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const size = signal<ElementSize | null>(null);

  if (isPlatformBrowser(platformId) && isResizeObserverSupported()) {
    const el = elementOrRef instanceof ElementRef ? elementOrRef.nativeElement : elementOrRef;
    const sub = resizeObserverStream(el, options).subscribe((s) => size.set(s));
    destroyRef.onDestroy(() => sub.unsubscribe());
  }

  return {
    size: size.asReadonly(),
    width: computed(() => size()?.width ?? 0),
    height: computed(() => size()?.height ?? 0),
    inlineSize: computed(() => size()?.inlineSize ?? 0),
    blockSize: computed(() => size()?.blockSize ?? 0),
  };
}
