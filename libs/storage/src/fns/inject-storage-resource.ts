/* oxlint-disable no-console */
import {
  inject,
  effect,
  untracked,
  DestroyRef,
  assertInInjectionContext,
  resource,
  type Signal,
} from '@angular/core';
import { resolveStorageTransport } from '../utils/resolve-transport';
import type { StorageSignalOptions, StorageResource } from '../interfaces/storage.types';

/**
 * Injects a Resource that automatically synchronizes with a storage medium (L2).
 * Accepts either a static `string` key or a reactive `Signal<string>` key.
 *
 * @param key Unique storage key or Signal emitting the active storage key.
 * @param defaultValue Initial default value.
 * @param options Storage options (type, encryption, synchronization). Defaults to `{ storageType: 'local', serializer: 'json' }`.
 * @returns A `StorageResource<T>` that allows reading/writing data and querying metadata.
 */
export function injectStorageResource<T>(
  key: string | Signal<string>,
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
  const resolveKey = (): string => (typeof key === 'function' ? untracked(key) : key);

  const res = resource<T | undefined, string>({
    params: () => (typeof key === 'function' ? key() : key),
    loader: async ({ params: currentKey }) => {
      const value = await transport.read<T>(currentKey, resolvedOptions);
      if (value !== undefined) {
        if (resolvedOptions.validator && !resolvedOptions.validator(value)) {
          console.warn(
            `[injectStorageResource] Schema drift detected for key: ${currentKey}. Data failed validation.`,
          );
          await transport.write(currentKey, defaultValue, resolvedOptions);
          return defaultValue;
        }
        return value;
      }
      return defaultValue;
    },
  });

  const persist = (targetKey: string, newData: T | undefined) => {
    transport
      .write(targetKey, newData, resolvedOptions)
      .catch((err) =>
        console.error(`[injectStorageResource] Error writing key: ${targetKey}`, err),
      );
  };

  const set = (newValue: T | undefined) => {
    persist(resolveKey(), newValue);
    res.update(() => newValue);
  };

  const update = (updater: (current: T | undefined) => T | undefined) => {
    const targetKey = resolveKey();
    res.update((current) => {
      const next = updater(current);
      persist(targetKey, next);
      return next;
    });
  };

  if (resolvedOptions.crossTabSync && transport.onChange) {
    if (typeof key === 'function') {
      effect((onCleanup) => {
        const currentKey = key();
        const unsubscribe = transport.onChange!<T>(currentKey, (newValue) => {
          res.update(() => newValue);
        });
        onCleanup(() => unsubscribe());
      });
    } else {
      const unsubscribe = transport.onChange<T>(key, (newValue) => {
        res.update(() => newValue);
      });
      inject(DestroyRef).onDestroy(() => unsubscribe());
    }
  }

  return { resource: res, set, update };
}
