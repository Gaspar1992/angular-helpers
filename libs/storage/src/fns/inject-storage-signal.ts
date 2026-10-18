import { inject, signal, DestroyRef, assertInInjectionContext } from '@angular/core';
import { resolveStorageTransport } from '../utils/resolve-transport';
import type { StorageSignalOptions, StorageSignal } from '../interfaces/storage.types';

/**
 * Injects a Signal that automatically synchronizes with a storage medium (L2).
 *
 * @param key Unique storage key.
 * @param defaultValue Initial default value.
 * @param options Storage options (type, encryption, synchronization). Defaults to `{ storageType: 'local', serializer: 'json' }`.
 * @returns A `StorageSignal<T>` that allows reading/writing data directly and querying metadata.
 */
export function injectStorageSignal<T>(
  key: string,
  defaultValue: T,
  options: StorageSignalOptions<T> = {},
): StorageSignal<T> {
  assertInInjectionContext(injectStorageSignal);
  const resolvedOptions: StorageSignalOptions<T> = {
    storageType: 'local',
    serializer: 'json',
    ...options,
  };
  const isAsync =
    resolvedOptions.storageType === 'indexeddb' || resolvedOptions.storageType === 'cacheapi';

  const dataSignal = signal<T>(defaultValue, {
    equal: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  });
  const loadingSignal = signal<boolean>(isAsync);
  const errorSignal = signal<Error | null>(null);

  // Extract original signal methods immediately to prevent TDZ and duplicate writes on initial load
  const originalSet = dataSignal.set.bind(dataSignal);
  const originalUpdate = dataSignal.update.bind(dataSignal);

  const transport = resolveStorageTransport();

  // 1. Load initial value from L2
  transport
    .read<T>(key, resolvedOptions)
    .then((value) => {
      if (value !== undefined) {
        if (resolvedOptions.validator && !resolvedOptions.validator(value)) {
          const driftError = new Error(
            `[injectStorageSignal] Schema drift detected for key: ${key}. Data failed validation.`,
          );
          console.warn(driftError.message);
          errorSignal.set(driftError);
          originalSet(defaultValue);
          // Auto-repair storage with default value
          transport
            .write(key, defaultValue, resolvedOptions)
            .catch((err) =>
              console.error(`[injectStorageSignal] Error repairing storage key: ${key}`, err),
            );
        } else {
          originalSet(value);
        }
      }
      loadingSignal.set(false);
    })
    .catch((error) => {
      errorSignal.set(error instanceof Error ? error : new Error(String(error)));
      loadingSignal.set(false);
    });

  const persist = (newData: T) => {
    transport
      .write(key, newData, resolvedOptions)
      .catch((err) => console.error(`[injectStorageSignal] Error writing key: ${key}`, err));
  };

  const customSignal = dataSignal as any;

  customSignal.set = (newValue: T) => {
    persist(newValue);
    originalSet(newValue);
    errorSignal.set(null); // Clear errors on manual writes
  };

  customSignal.update = (updater: (value: T) => T) => {
    originalUpdate((current) => {
      const next = updater(current);
      persist(next);
      return next;
    });
    errorSignal.set(null);
  };

  // Expose metadata as read-only Signals
  customSignal.loading = loadingSignal.asReadonly();
  customSignal.error = errorSignal.asReadonly();

  // 3. Multi-tab synchronization (only if configured and transport supports it)
  if (resolvedOptions.crossTabSync && transport.onChange) {
    const unsubscribe = transport.onChange<T>(key, (newValue) => {
      originalSet(newValue);
    });
    inject(DestroyRef).onDestroy(() => unsubscribe());
  }

  return customSignal as StorageSignal<T>;
}
