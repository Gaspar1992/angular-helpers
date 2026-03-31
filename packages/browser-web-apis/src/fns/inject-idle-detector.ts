import { computed, DestroyRef, inject, PLATFORM_ID, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import {
  type IdleState,
  type UserIdleState,
  type ScreenIdleState,
  type IdleDetectorOptions,
} from '../services/idle-detector.service';

interface IdleDetectorInstance extends EventTarget {
  readonly userState: UserIdleState;
  readonly screenState: ScreenIdleState;
  start(options?: { threshold?: number; signal?: AbortSignal }): Promise<void>;
}

interface IdleDetectorConstructor {
  new (): IdleDetectorInstance;
}

function getIdleDetectorClass(): IdleDetectorConstructor | undefined {
  return (window as unknown as { IdleDetector?: IdleDetectorConstructor }).IdleDetector;
}

export interface IdleDetectorRef {
  readonly state: Signal<IdleState>;
  readonly userState: Signal<UserIdleState>;
  readonly screenState: Signal<ScreenIdleState>;
  readonly isUserIdle: Signal<boolean>;
  readonly isScreenLocked: Signal<boolean>;
}

export function injectIdleDetector(options: IdleDetectorOptions = {}): IdleDetectorRef {
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const defaultState: IdleState = { user: 'active', screen: 'unlocked' };
  const state = signal<IdleState>(defaultState);

  if (isPlatformBrowser(platformId) && 'IdleDetector' in window) {
    const abortController = new AbortController();
    const detector = new (getIdleDetectorClass()!)();

    detector.addEventListener('change', () => {
      state.set({
        user: detector.userState,
        screen: detector.screenState,
      });
    });

    detector
      .start({
        threshold: options.threshold ?? 60_000,
        signal: abortController.signal,
      })
      .catch(() => {
        /* permission denied or unsupported — keep defaults */
      });

    destroyRef.onDestroy(() => abortController.abort());
  }

  return {
    state: state.asReadonly(),
    userState: computed(() => state().user),
    screenState: computed(() => state().screen),
    isUserIdle: computed(() => state().user === 'idle'),
    isScreenLocked: computed(() => state().screen === 'locked'),
  };
}
