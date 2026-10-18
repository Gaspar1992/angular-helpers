import { inject, DestroyRef, assertInInjectionContext, resource } from '@angular/core';
import { resolveStorageTransport } from '../utils/resolve-transport';
import type { StorageSignalOptions, StorageResource } from '../interfaces/storage.types';

/**
 * Injects a Resource that automatically synchronizes with a storage medium (L2).
 *
 * @param key Unique storage key.
 * @param defaultValue Initial default value.
 * @param options Storage options (type, encryption, synchronization). Defaults to `{ storageType: 'local', serializer: 'json' }`.
 * @returns A `StorageResource<T>` that allows reading/writing data and querying metadata.
 */
export function injectStorageResource<T>(
  key: string,
  defaultValue: T,
  options: StorageSignalOptions<T> = {},
): StorageResource<T> {
  assertInInjectionContext(injectStorageResource);
  const resolvedOptions: StorageSignalOptions<T> = {
    storageType: 'local',
    serializer: 'json',
    ...options,
  };
  const transport = resolveStorageTransport();

  const res = resource<T | undefined, unknown>({
    loader: async () => {
      const value = await transport.read<T>(key, resolvedOptions);
      if (value !== undefined) {
        if (resolvedOptions.validator && !resolvedOptions.validator(value)) {
          console.warn(
            `[injectStorageResource] Schema drift detected for key: ${key}. Data failed validation.`,
          );
          // Auto-repair storage with default value
          await transport.write(key, defaultValue, resolvedOptions);
          return defaultValue;
        }
        return value;
      }
      return defaultValue;
    },
  });

  const persist = (newData: T | undefined) => {
    transport
      .write(key, newData, resolvedOptions)
      .catch((err) => console.error(`[injectStorageResource] Error writing key: ${key}`, err));
  };

  const set = (newValue: T | undefined) => {
    persist(newValue);
    res.update(() => newValue);
  };

  const update = (updater: (current: T | undefined) => T | undefined) => {
    res.update((current) => {
      const next = updater(current);
      persist(next);
      return next;
    });
  };

  if (resolvedOptions.crossTabSync && transport.onChange) {
    const unsubscribe = transport.onChange<T>(key, (newValue) => {
      res.update(() => newValue);
    });
    inject(DestroyRef).onDestroy(() => unsubscribe());
  }

  return { resource: res, set, update };
}
