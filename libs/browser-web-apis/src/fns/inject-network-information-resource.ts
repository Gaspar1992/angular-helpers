import { assertInInjectionContext, type Signal, computed, type ResourceRef } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { createBrowserSignal, injectIsBrowser } from '../tokens/ssr.token';

import {
  type ConnectionType,
  type EffectiveConnectionType,
  type NetworkInformation,
} from '../services/network-information.service';
import {
  networkInformationStream,
  isNetworkInformationSupported,
} from '../utils/network-information.utils';

export interface NetworkInformationResourceRef {
  readonly resource: ResourceRef<NetworkInformation>;
  readonly snapshot: Signal<NetworkInformation | undefined>;
  readonly online: Signal<boolean | undefined>;
  readonly effectiveType: Signal<EffectiveConnectionType | undefined>;
  readonly downlink: Signal<number | undefined>;
  readonly rtt: Signal<number | undefined>;
  readonly type: Signal<ConnectionType | undefined>;
  readonly saveData: Signal<boolean | undefined>;
  readonly isSupported: Signal<boolean>;
}

export function injectNetworkInformationResource(): NetworkInformationResourceRef {
  assertInInjectionContext(injectNetworkInformationResource);
  const isBrowser = injectIsBrowser();
  const supported = createBrowserSignal(() => isNetworkInformationSupported(), false);

  const resource = rxResource<NetworkInformation, void>({
    stream: () => {
      if (!isBrowser) {
        return new Observable<NetworkInformation>((subscriber) => {
          subscriber.next({ online: true });
          subscriber.complete();
        });
      }
      return networkInformationStream();
    },
  });

  const snapshot = resource.value;

  return {
    resource: resource as unknown as ResourceRef<NetworkInformation>,
    snapshot,
    online: computed(() => snapshot()?.online),
    effectiveType: computed(() => snapshot()?.effectiveType),
    downlink: computed(() => snapshot()?.downlink),
    rtt: computed(() => snapshot()?.rtt),
    type: computed(() => snapshot()?.type),
    saveData: computed(() => snapshot()?.saveData),
    isSupported: supported.asReadonly(),
  };
}
