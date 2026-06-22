import {
  assertInInjectionContext,
  computed,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type Subscription } from 'rxjs';

import { type VisibilityState } from '../services/page-visibility.service';
import { pageVisibilityStream } from '../utils/page-visibility.utils';

export interface PageVisibilityRef {
  readonly state: Signal<VisibilityState>;
  readonly isVisible: Signal<boolean>;
  readonly isHidden: Signal<boolean>;
}

export function injectPageVisibility(): PageVisibilityRef {
  assertInInjectionContext(injectPageVisibility);
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  const state = signal<VisibilityState>('visible');

  if (isBrowser) {
    let sub: Subscription | null = null;
    let destroyed = false;

    queueMicrotask(() => {
      if (destroyed) return;
      state.set(
        typeof document !== 'undefined' ? (document.visibilityState as VisibilityState) : 'visible',
      );
      sub = pageVisibilityStream().subscribe((s) => state.set(s));
    });

    destroyRef.onDestroy(() => {
      destroyed = true;
      if (sub) {
        sub.unsubscribe();
      }
    });
  }

  return {
    state: state.asReadonly(),
    isVisible: computed(() => state() === 'visible'),
    isHidden: computed(() => state() !== 'visible'),
  };
}
