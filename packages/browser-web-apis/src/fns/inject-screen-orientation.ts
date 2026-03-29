import { computed, DestroyRef, inject, PLATFORM_ID, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import {
  type OrientationInfo,
  type OrientationLockType,
  type OrientationType,
} from '../services/screen-orientation.service';
import { getOrientationSnapshot, screenOrientationStream } from '../utils/screen-orientation.utils';

export interface ScreenOrientationRef {
  readonly orientation: Signal<OrientationInfo>;
  readonly type: Signal<OrientationType>;
  readonly angle: Signal<number>;
  readonly isPortrait: Signal<boolean>;
  readonly isLandscape: Signal<boolean>;
  lock(orientation: OrientationLockType): Promise<void>;
  unlock(): void;
}

interface ScreenOrientationWithLock extends ScreenOrientation {
  lock(orientation: OrientationLockType): Promise<void>;
}

export function injectScreenOrientation(): ScreenOrientationRef {
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const orientation = signal<OrientationInfo>(
    isPlatformBrowser(platformId)
      ? getOrientationSnapshot()
      : { type: 'portrait-primary', angle: 0 },
  );

  const sub = screenOrientationStream().subscribe((o) => orientation.set(o));
  destroyRef.onDestroy(() => sub.unsubscribe());

  return {
    orientation: orientation.asReadonly(),
    type: computed(() => orientation().type),
    angle: computed(() => orientation().angle),
    isPortrait: computed(() => orientation().type.startsWith('portrait')),
    isLandscape: computed(() => orientation().type.startsWith('landscape')),

    async lock(o: OrientationLockType): Promise<void> {
      await (screen.orientation as ScreenOrientationWithLock).lock(o);
    },

    unlock(): void {
      screen.orientation.unlock();
    },
  };
}
