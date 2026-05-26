import { Signal, WritableSignal } from '@angular/core';
import { StorageSignalOptions } from './storage-options.types';

export interface StorageSignalState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

/**
 * Reactive Signal that synchronizes its value with a storage medium (L2).
 * Exposes the data directly when reading the signal, but allows querying
 * loading and error states via sub-signals.
 */
export interface StorageSignal<T> extends WritableSignal<T> {
  readonly loading: Signal<boolean>;
  readonly error: Signal<Error | null>;
}

export interface EntityStoreOptions<Id, Entity> {
  idKey: keyof Entity | ((entity: Entity) => Id);
  persistKey?: string;
  storageOptions?: Omit<StorageSignalOptions, 'serializer'> & { serializer?: 'json' | 'toon' };
}
