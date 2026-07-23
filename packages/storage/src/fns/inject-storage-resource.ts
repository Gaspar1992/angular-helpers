import { inject, DestroyRef, assertInInjectionContext, resource } from '@angular/core';
import { STORAGE_TRANSPORT } from '../tokens/storage.tokens';
import { LocalStorageTransport } from '../services/local-transport';
import { StorageSignalOptions, StorageResource } from '../interfaces/storage.types';

/**
 * Injects a Resource that automatically synchronizes with a storage medium (L2).
 *
 * @param key Unique storage key.
 * @param defaultValue Initial default value.
 * @param options Storage options (type, encryption, synchronization).
 * @returns A `StorageResource<T>` that allows reading/writing data and querying metadata.
 */
export function injectStorageResource<T>(
  key: string,
  defaultValue: T,
  options: StorageSignalOptions<T>,
): StorageResource<T> {
  assertInInjectionContext(injectStorageResource);
  let transport = inject(STORAGE_TRANSPORT, { optional: true });
  if (!transport) {
    transport = inject(LocalStorageTransport);
  }

  const res = resource<T | undefined, unknown>({
    loader: async () => {
      const value = await transport!.read<T>(key, options);
      if (value !== undefined) {
        if (options.validator && !options.validator(value)) {
          console.warn(
            `[injectStorageResource] Schema drift detected for key: ${key}. Data failed validation.`,
          );
          // Auto-repair storage with default value
          await transport!.write(key, defaultValue, options);
          return defaultValue;
        }
        return value;
      }
      return defaultValue;
    },
  });

  const persist = (newData: T | undefined) => {
    if (newData !== undefined) {
      transport!
        .write(key, newData, options)
        .catch((err) => console.error(`[injectStorageResource] Error writing key: ${key}`, err));
    } else {
      // If undefined, write undefined as in original implementation
      transport!
        .write(key, newData, options)
        .catch((err) => console.error(`[injectStorageResource] Error writing key: ${key}`, err));
    }
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

  if (options.crossTabSync && transport!.onChange) {
    const unsubscribe = transport!.onChange<T>(key, (newValue) => {
      res.update(() => newValue);
    });
    inject(DestroyRef).onDestroy(() => unsubscribe());
  }

  return { resource: res, set, update };
}
