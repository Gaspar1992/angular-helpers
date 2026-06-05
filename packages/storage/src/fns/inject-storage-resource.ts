import { inject, DestroyRef } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { STORAGE_TRANSPORT } from '../tokens/storage.tokens';
import { LocalStorageTransport } from '../services/local-transport';
import { StorageSignalOptions, StorageResource } from '../interfaces/storage.types';
import { from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
  let transport = inject(STORAGE_TRANSPORT, { optional: true });
  if (!transport) {
    transport = inject(LocalStorageTransport);
  }

  const resource = rxResource<T | undefined, unknown>({
    stream: () => {
      return from(transport!.read<T>(key, options)).pipe(
        map((value) => {
          if (value !== undefined) {
            if (options.validator && !options.validator(value)) {
              console.warn(
                `[injectStorageResource] Schema drift detected for key: ${key}. Data failed validation.`,
              );
              // Auto-repair storage with default value
              transport!
                .write(key, defaultValue, options)
                .catch((err) =>
                  console.error(`[injectStorageResource] Error repairing storage key: ${key}`, err),
                );
              return defaultValue;
            }
            return value;
          }
          return defaultValue;
        }),
        catchError((err) => {
          throw err;
        }),
      );
    },
  });

  const persist = (newData: T | undefined) => {
    if (newData !== undefined) {
      transport!
        .write(key, newData, options)
        .catch((err) => console.error(`[injectStorageResource] Error writing key: ${key}`, err));
    } else {
      // If undefined, maybe remove? For now just write undefined as we do in original signal
      transport!
        .write(key, newData, options)
        .catch((err) => console.error(`[injectStorageResource] Error writing key: ${key}`, err));
    }
  };

  const set = (newValue: T | undefined) => {
    persist(newValue);
    resource.update(() => newValue);
  };

  const update = (updater: (current: T | undefined) => T | undefined) => {
    resource.update((current) => {
      const next = updater(current);
      persist(next);
      return next;
    });
  };

  if (options.crossTabSync && transport!.onChange) {
    const unsubscribe = transport!.onChange<T>(key, (newValue) => {
      resource.update(() => newValue);
    });
    inject(DestroyRef).onDestroy(() => unsubscribe());
  }

  return { resource, set, update };
}
