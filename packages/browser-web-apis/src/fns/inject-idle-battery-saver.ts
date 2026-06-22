import { assertInInjectionContext, computed, type Signal } from '@angular/core';
import { injectPageVisibility } from './inject-page-visibility';
import { injectBattery } from './inject-battery';

export interface IdleBatterySaverRef {
  readonly isHidden: Signal<boolean>;
  readonly isLowBattery: Signal<boolean>;
  readonly shouldSaveEnergy: Signal<boolean>;
}

export function injectIdleBatterySaver(): IdleBatterySaverRef {
  assertInInjectionContext(injectIdleBatterySaver);
  // Leverage existing reactive primitives
  const visibility = injectPageVisibility();
  const battery = injectBattery();

  const isLowBattery = computed(() => {
    const info = battery.info();
    if (!info) return false;
    // Low battery trigger: less than 20% and not currently charging/plugged in
    return info.level < 0.2 && !info.charging;
  });

  const shouldSaveEnergy = computed(() => {
    return visibility.isHidden() || isLowBattery();
  });

  return {
    isHidden: visibility.isHidden,
    isLowBattery,
    shouldSaveEnergy,
  };
}
