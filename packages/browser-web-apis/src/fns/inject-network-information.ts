import { computed, DestroyRef, inject, PLATFORM_ID, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type Subscription } from 'rxjs';

import {
  type ConnectionType,
  type EffectiveConnectionType,
  type NetworkInformation,
} from '../services/network-information.service';
import { getNetworkSnapshot, networkInformationStream } from '../utils/network-information.utils';

export interface NetworkInformationRef {
  readonly snapshot: Signal<NetworkInformation>;
  readonly online: Signal<boolean>;
  readonly effectiveType: Signal<EffectiveConnectionType | undefined>;
  readonly downlink: Signal<number | undefined>;
  readonly rtt: Signal<number | undefined>;
  readonly type: Signal<ConnectionType | undefined>;
  readonly saveData: Signal<boolean | undefined>;
}

export function injectNetworkInformation(): NetworkInformationRef {
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  const snapshot = signal<NetworkInformation>({ online: true });

  if (isBrowser) {
    let sub: Subscription | null = null;
    let destroyed = false;

    queueMicrotask(() => {
      if (destroyed) return;
      snapshot.set(getNetworkSnapshot());
      sub = networkInformationStream().subscribe((n) => snapshot.set(n));
    });

    destroyRef.onDestroy(() => {
      destroyed = true;
      if (sub) {
        sub.unsubscribe();
      }
    });
  }

  return {
    snapshot: snapshot.asReadonly(),
    online: computed(() => snapshot().online),
    effectiveType: computed(() => snapshot().effectiveType),
    downlink: computed(() => snapshot().downlink),
    rtt: computed(() => snapshot().rtt),
    type: computed(() => snapshot().type),
    saveData: computed(() => snapshot().saveData),
  };
}
