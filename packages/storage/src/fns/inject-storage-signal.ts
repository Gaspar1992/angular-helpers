import { inject, signal, DestroyRef, Signal } from '@angular/core';
import { STORAGE_TRANSPORT } from '../services/storage-transport';
import { LocalStorageTransport } from '../services/local-transport';
import { StorageSignalOptions, StorageSignal } from '../interfaces/storage.types';

/**
 * Injects a Signal that automatically synchronizes with a storage medium (L2).
 *
 * @param key Unique storage key.
 * @param defaultValue Initial default value.
 * @param options Storage options (type, encryption, synchronization).
 * @returns A `StorageSignal<T>` that allows reading/writing data directly and querying metadata.
 */
export function injectStorageSignal<T>(
  key: string,
  defaultValue: T,
  options: StorageSignalOptions,
): StorageSignal<T> {
  const isAsync = options.storageType === 'indexeddb' || options.storageType === 'cacheapi';

  const dataSignal = signal<T>(defaultValue, {
    equal: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  });
  const loadingSignal = signal<boolean>(isAsync);
  const errorSignal = signal<Error | null>(null);

  // Resolve injected transport or instantiate LocalStorageTransport
  let transport = inject(STORAGE_TRANSPORT, { optional: true });
  if (!transport) {
    transport = inject(LocalStorageTransport);
  }

  // 1. Load initial value from L2
  transport
    .read<T>(key, options)
    .then((value) => {
      if (value !== undefined) {
        dataSignal.set(value);
      }
      loadingSignal.set(false);
    })
    .catch((error) => {
      errorSignal.set(error instanceof Error ? error : new Error(String(error)));
      loadingSignal.set(false);
    });

  // 2. Encapsulate reactive persistence in writes
  const originalSet = dataSignal.set.bind(dataSignal);
  const originalUpdate = dataSignal.update.bind(dataSignal);

  const persist = (newData: T) => {
    transport!
      .write(key, newData, options)
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
  if (options.crossTabSync && transport.onChange) {
    const unsubscribe = transport.onChange<T>(key, (newValue) => {
      dataSignal.set(newValue);
    });
    inject(DestroyRef).onDestroy(() => unsubscribe());
  }

  return customSignal as StorageSignal<T>;
}
