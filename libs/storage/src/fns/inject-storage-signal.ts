/* oxlint-disable no-console */
import {
  inject,
  signal,
  effect,
  untracked,
  DestroyRef,
  assertInInjectionContext,
  type Signal,
} from '@angular/core';
import { resolveStorageTransport } from '../utils/resolve-transport';
import type { StorageSignalOptions, StorageSignal } from '../interfaces/storage.types';

function safeEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/**
 * Injects a Signal that automatically synchronizes with a storage medium (L2).
 * Accepts either a static `string` key or a reactive `Signal<string>` key.
 *
 * @param key Unique storage key or Signal emitting the active storage key.
 * @param defaultValue Initial default value.
 * @param options Storage options (type, encryption, synchronization). Defaults to `{ storageType: 'local', serializer: 'json' }`.
 * @returns A `StorageSignal<T>` that allows reading/writing data directly and querying metadata.
 */
export function injectStorageSignal<T>(
  key: string | Signal<string>,
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
    equal: safeEqual,
  });
  const loadingSignal = signal<boolean>(isAsync);
  const errorSignal = signal<Error | null>(null);
  let writeGeneration = 0;

  // Extract original signal methods immediately to prevent TDZ and duplicate writes on initial load
  const originalSet = dataSignal.set.bind(dataSignal);
  const originalUpdate = dataSignal.update.bind(dataSignal);

  const transport = resolveStorageTransport();
  const resolveKey = (): string => (typeof key === 'function' ? untracked(key) : key);

  const loadKey = (currentKey: string): void => {
    const loadGeneration = ++writeGeneration;
    if (isAsync) {
      loadingSignal.set(true);
    }

    transport
      .read<T>(currentKey, resolvedOptions)
      .then((value) => {
        if (writeGeneration !== loadGeneration) {
          loadingSignal.set(false);
          return;
        }
        if (value !== undefined) {
          if (resolvedOptions.validator && !resolvedOptions.validator(value)) {
            const driftError = new Error(
              `[injectStorageSignal] Schema drift detected for key: ${currentKey}. Data failed validation.`,
            );
            console.warn(driftError.message);
            errorSignal.set(driftError);
            originalSet(defaultValue);
            transport
              .write(currentKey, defaultValue, resolvedOptions)
              .catch((err) =>
                console.error(
                  `[injectStorageSignal] Error repairing storage key: ${currentKey}`,
                  err,
                ),
              );
          } else {
            errorSignal.set(null);
            originalSet(value);
          }
        } else {
          originalSet(defaultValue);
        }
        loadingSignal.set(false);
      })
      .catch((error) => {
        if (writeGeneration !== loadGeneration) {
          return;
        }
        errorSignal.set(error instanceof Error ? error : new Error(String(error)));
        loadingSignal.set(false);
      });
  };

  if (typeof key === 'function') {
    effect((onCleanup) => {
      const currentKey = key();
      loadKey(currentKey);
      if (resolvedOptions.crossTabSync && transport.onChange) {
        const unsubscribe = transport.onChange<T>(currentKey, (newValue) => {
          originalSet(newValue);
        });
        onCleanup(() => unsubscribe());
      }
    });
  } else {
    loadKey(key);
    if (resolvedOptions.crossTabSync && transport.onChange) {
      const unsubscribe = transport.onChange<T>(key, (newValue) => {
        originalSet(newValue);
      });
      inject(DestroyRef).onDestroy(() => unsubscribe());
    }
  }

  const persist = (targetKey: string, newData: T) => {
    transport
      .write(targetKey, newData, resolvedOptions)
      .catch((err) => console.error(`[injectStorageSignal] Error writing key: ${targetKey}`, err));
  };

  const customSignal = dataSignal as unknown as StorageSignal<T>;

  customSignal.set = (newValue: T) => {
    writeGeneration++;
    persist(resolveKey(), newValue);
    originalSet(newValue);
    errorSignal.set(null);
  };

  customSignal.update = (updater: (value: T) => T) => {
    writeGeneration++;
    const targetKey = resolveKey();
    originalUpdate((current) => {
      const next = updater(current);
      persist(targetKey, next);
      return next;
    });
    errorSignal.set(null);
  };

  // Expose metadata as read-only Signals
  (customSignal as { loading: Signal<boolean> }).loading = loadingSignal.asReadonly();
  (customSignal as { error: Signal<Error | null> }).error = errorSignal.asReadonly();

  return customSignal;
}
