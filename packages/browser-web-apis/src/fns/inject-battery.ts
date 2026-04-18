import { DestroyRef, inject, PLATFORM_ID, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

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

export interface BatteryRef {
  readonly info: Signal<BatteryInfo | null>;
  readonly error: Signal<string | null>;
  readonly isSupported: Signal<boolean>;
  /** Force a one-shot refresh of the battery snapshot. */
  refresh(): Promise<void>;
}

export function injectBattery(): BatteryRef {
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID);

  const isBrowser = isPlatformBrowser(platformId);
  const supported = signal<boolean>(
    isBrowser && typeof navigator !== 'undefined' && 'getBattery' in navigator,
  );
  const info = signal<BatteryInfo | null>(null);
  const error = signal<string | null>(null);
  let manager: BatteryManagerLike | null = null;
  let disposed = false;

  const snapshot = (): BatteryInfo | null =>
    manager
      ? {
          charging: manager.charging,
          level: manager.level,
          chargingTime: manager.chargingTime,
          dischargingTime: manager.dischargingTime,
        }
      : null;

  const update = (): void => {
    if (!disposed) info.set(snapshot());
  };

  const events: Array<keyof BatteryManagerEventMap> = [
    'chargingchange',
    'levelchange',
    'chargingtimechange',
    'dischargingtimechange',
  ];

  const refresh = async (): Promise<void> => {
    if (!supported() || disposed) return;
    try {
      if (!manager) {
        const nav = navigator as NavigatorWithBattery;
        manager = await nav.getBattery!();
        for (const ev of events) {
          manager!.addEventListener(ev, update);
        }
      }
      update();
    } catch (err) {
      if (!disposed) error.set(err instanceof Error ? err.message : 'getBattery failed');
    }
  };

  destroyRef.onDestroy(() => {
    disposed = true;
    if (manager) {
      for (const ev of events) {
        manager.removeEventListener(ev, update);
      }
      manager = null;
    }
  });

  if (supported()) void refresh();

  return {
    info: info.asReadonly(),
    error: error.asReadonly(),
    isSupported: supported.asReadonly(),
    refresh,
  };
}

interface BatteryManagerEventMap {
  chargingchange: Event;
  levelchange: Event;
  chargingtimechange: Event;
  dischargingtimechange: Event;
}
