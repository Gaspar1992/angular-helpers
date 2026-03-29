import { computed, DestroyRef, inject, PLATFORM_ID, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { type VisibilityState } from '../services/page-visibility.service';
import { pageVisibilityStream } from '../utils/page-visibility.utils';

export interface PageVisibilityRef {
  readonly state: Signal<VisibilityState>;
  readonly isVisible: Signal<boolean>;
  readonly isHidden: Signal<boolean>;
}

export function injectPageVisibility(): PageVisibilityRef {
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const initial: VisibilityState =
    isPlatformBrowser(platformId) && typeof document !== 'undefined'
      ? (document.visibilityState as VisibilityState)
      : 'visible';

  const state = signal<VisibilityState>(initial);

  const sub = pageVisibilityStream().subscribe((s) => state.set(s));
  destroyRef.onDestroy(() => sub.unsubscribe());

  return {
    state: state.asReadonly(),
    isVisible: computed(() => state() === 'visible'),
    isHidden: computed(() => state() !== 'visible'),
  };
}
