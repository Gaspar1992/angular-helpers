import { computed, DestroyRef, inject, PLATFORM_ID, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { type PerformanceObserverConfig } from '../services/performance-observer.service';
import {
  isPerformanceObserverSupported,
  performanceObserverStream,
} from '../utils/performance-observer.utils';

export interface PerformanceObserverRef {
  readonly entries: Signal<PerformanceEntryList>;
  readonly entryCount: Signal<number>;
  readonly latestEntry: Signal<PerformanceEntry | undefined>;
}

export function injectPerformanceObserver(
  config: PerformanceObserverConfig,
): PerformanceObserverRef {
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const entries = signal<PerformanceEntryList>([]);

  if (isPlatformBrowser(platformId) && isPerformanceObserverSupported()) {
    const sub = performanceObserverStream(config).subscribe((e) => entries.set(e));
    destroyRef.onDestroy(() => sub.unsubscribe());
  }

  return {
    entries: entries.asReadonly(),
    entryCount: computed(() => entries().length),
    latestEntry: computed(() => entries().at(-1)),
  };
}
