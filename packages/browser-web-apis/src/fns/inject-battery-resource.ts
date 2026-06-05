import { inject, PLATFORM_ID, signal, type Signal, type ResourceRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

interface BatteryManagerLike extends EventTarget {
  charging: boolean;
  level: number;
  chargingTime: number;
  dischargingTime: number;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManagerLike>;
}

export interface BatteryInfo {
  charging: boolean;
  level: number;
  chargingTime: number;
  dischargingTime: number;
}

export interface BatteryResourceRef {
  readonly resource: ResourceRef<BatteryInfo | null>;
  readonly info: Signal<BatteryInfo | null | undefined>;
  readonly isSupported: Signal<boolean>;
  refresh(): void;
}

export function injectBatteryResource(): BatteryResourceRef {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  const supported = signal<boolean>(false);
  if (isBrowser) {
    supported.set(typeof navigator !== 'undefined' && 'getBattery' in navigator);
  }

  const requestState = signal<{ trigger: number }>({ trigger: 0 });

  const resource = rxResource<BatteryInfo | null, { trigger: number }>({
    params: () => requestState(),
    stream: ({ abortSignal }) => {
      if (!isBrowser || !supported()) {
        throw new Error('Battery API not supported');
      }

      return new Observable<BatteryInfo | null>((subscriber) => {
        let manager: BatteryManagerLike | null = null;
        let disposed = false;

        const update = () => {
          if (!disposed && manager) {
            subscriber.next({
              charging: manager.charging,
              level: manager.level,
              chargingTime: manager.chargingTime,
              dischargingTime: manager.dischargingTime,
            });
          }
        };

        const events = [
          'chargingchange',
          'levelchange',
          'chargingtimechange',
          'dischargingtimechange',
        ];

        const nav = navigator as NavigatorWithBattery;
        nav.getBattery!()
          .then((m) => {
            if (disposed) return;
            manager = m;
            for (const ev of events) {
              manager.addEventListener(ev, update);
            }
            update();
          })
          .catch((err) => {
            if (!disposed) {
              subscriber.error(err);
            }
          });

        const abortHandler = () => {
          disposed = true;
          if (manager) {
            for (const ev of events) {
              manager.removeEventListener(ev, update);
            }
          }
          subscriber.complete();
        };

        abortSignal.addEventListener('abort', abortHandler);

        return () => {
          disposed = true;
          if (manager) {
            for (const ev of events) {
              manager.removeEventListener(ev, update);
            }
          }
          abortSignal.removeEventListener('abort', abortHandler);
        };
      });
    },
  });

  const refresh = () => {
    requestState.update((prev) => ({ trigger: prev.trigger + 1 }));
  };

  return {
    resource: resource as unknown as ResourceRef<BatteryInfo | null>,
    info: resource.value,
    isSupported: supported.asReadonly(),
    refresh,
  };
}
