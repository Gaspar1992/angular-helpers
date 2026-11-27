import { computed, linkedSignal, type Signal } from '@angular/core';

/**
 * Tracks the previous emitted value of a source `Signal<T>` without `effect()`.
 * Returns `undefined` until the source signal changes from its initial value.
 */
export function previousSignal<T>(source: Signal<T>): Signal<T | undefined> {
  const state = linkedSignal<{ value: T }, { current: T; previous: T | undefined }>({
    source: () => ({ value: source() }),
    computation: (next, previous) => ({
      current: next.value,
      previous: previous ? previous.value.current : undefined,
    }),
  });

  return computed(() => state().previous);
}
