import { computed, DestroyRef, inject, PLATFORM_ID, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { type GamepadState, isGamepadSupported, gamepadPollStream } from '../utils/gamepad.utils';

export interface GamepadRef {
  readonly state: Signal<GamepadState | null>;
  readonly connected: Signal<boolean>;
  readonly buttons: Signal<ReadonlyArray<{ pressed: boolean; value: number }>>;
  readonly axes: Signal<readonly number[]>;
}

export function injectGamepad(index: number, intervalMs = 16): GamepadRef {
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const state = signal<GamepadState | null>(null);

  if (isPlatformBrowser(platformId) && isGamepadSupported()) {
    const sub = gamepadPollStream(index, intervalMs).subscribe((s) => state.set(s));
    destroyRef.onDestroy(() => sub.unsubscribe());
  }

  return {
    state: state.asReadonly(),
    connected: computed(() => state()?.connected ?? false),
    buttons: computed(() => state()?.buttons ?? []),
    axes: computed(() => state()?.axes ?? []),
  };
}
