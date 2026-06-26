import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NAVIGATOR } from '../tokens/ssr.token';

export interface PermissionStateRef {
  readonly state: Signal<PermissionState | 'unsupported' | 'loading'>;
  readonly isSupported: Signal<boolean>;
}

/**
 * Queries and tracks a PermissionState reactively.
 * Catch TypeError on Firefox and return a synthetic 'prompt' state.
 * SSR-safe: returns isSupported = false, state = 'unsupported' on the server.
 */
export function injectPermissionState(name: PermissionName): PermissionStateRef {
  assertInInjectionContext(injectPermissionState);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const nav = inject(NAVIGATOR);

  const isSupportedSig = signal<boolean>(false);
  const stateSig = signal<PermissionState | 'unsupported' | 'loading'>('loading');

  if (isBrowser) {
    const hasApi = typeof nav !== 'undefined' && !!nav.permissions;
    isSupportedSig.set(hasApi);

    if (hasApi) {
      let statusRef: PermissionStatus | null = null;
      let disposed = false;

      const listener = () => {
        if (!disposed && statusRef) {
          stateSig.set(statusRef.state);
        }
      };

      nav.permissions
        .query({ name })
        .then((status) => {
          if (disposed) return;
          statusRef = status;
          stateSig.set(status.state);
          status.addEventListener('change', listener);
        })
        .catch((err) => {
          if (disposed) return;
          if (err instanceof TypeError) {
            // Firefox throws TypeError for some queries, return synthetic 'prompt' state
            stateSig.set('prompt');
          } else {
            stateSig.set('unsupported');
          }
        });

      const destroyRef = inject(DestroyRef);
      destroyRef.onDestroy(() => {
        disposed = true;
        if (statusRef) {
          statusRef.removeEventListener('change', listener);
        }
      });
    } else {
      stateSig.set('unsupported');
    }
  } else {
    stateSig.set('unsupported');
  }

  return {
    state: stateSig.asReadonly(),
    isSupported: isSupportedSig.asReadonly(),
  };
}
