import { inject, signal, DestroyRef, WritableSignal } from '@angular/core';
import { STORAGE_TRANSPORT } from '../services/storage-transport';
import { LocalStorageTransport } from '../services/local-transport';
import { StorageSignalOptions, StorageSignalState } from '../interfaces/storage.types';

export function injectStorageSignal<T>(
  key: string,
  defaultValue: T,
  options: StorageSignalOptions,
): WritableSignal<StorageSignalState<T>> {
  const isAsync = options.storageType === 'indexeddb' || options.storageType === 'cacheapi';

  const state = signal<StorageSignalState<T>>({
    data: defaultValue,
    loading: isAsync,
    error: null,
  });

  // Resolverse del transporte inyectado o instanciar por defecto el LocalStorageTransport
  let transport = inject(STORAGE_TRANSPORT, { optional: true });
  if (!transport) {
    transport = inject(LocalStorageTransport);
  }

  // Configurar las propiedades de persistencia si es transporte local
  if (transport instanceof LocalStorageTransport) {
    transport.storageType = options.storageType;
    transport.encrypt = !!options.encrypt;
    if (options.dbName) transport.dbName = options.dbName;
    if (options.storeName) transport.storeName = options.storeName;
    if (options.cacheName) transport.cacheName = options.cacheName;
  }

  const useToon = options.serializer === 'toon';

  // 1. Cargar valor inicial de L2
  transport
    .read<T>(key, useToon)
    .then((value) => {
      state.set({
        data: value !== undefined ? value : defaultValue,
        loading: false,
        error: null,
      });
    })
    .catch((error) => {
      state.set({
        data: defaultValue,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    });

  // 2. Encapsular la persistencia reactiva en escrituras
  const originalSet = state.set.bind(state);
  const originalUpdate = state.update.bind(state);

  const persist = (newData: T) => {
    transport!
      .write(key, newData, useToon)
      .catch((err) => console.error(`[injectStorageSignal] Error escribiendo clave: ${key}`, err));
  };

  const customSignal = state as any;

  customSignal.set = (newValue: StorageSignalState<T>) => {
    persist(newValue.data);
    originalSet(newValue);
  };

  customSignal.update = (updater: (value: StorageSignalState<T>) => StorageSignalState<T>) => {
    originalUpdate((current) => {
      const next = updater(current);
      persist(next.data);
      return next;
    });
  };

  // 3. Sincronización multi-pestaña (solo si está configurada y el transporte la soporta)
  if (options.crossTabSync && transport.onChange) {
    const unsubscribe = transport.onChange<T>(key, (newValue) => {
      state.update((curr) => ({ ...curr, data: newValue }));
    });
    inject(DestroyRef).onDestroy(() => unsubscribe());
  }

  return state;
}
