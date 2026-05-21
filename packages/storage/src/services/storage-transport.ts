import { InjectionToken } from '@angular/core';
import { StorageSignalOptions } from '../interfaces/storage.types';

export interface StorageTransport {
  /**
   * Reads a persisted value asynchronously
   */
  read<T>(key: string, options?: StorageSignalOptions): Promise<T | undefined>;

  /**
   * Writes a persisted value asynchronously
   */
  write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void>;

  /**
   * Deletes a persisted value asynchronously
   */
  delete(key: string, options?: StorageSignalOptions): Promise<void>;

  /**
   * Subscribes a callback for external changes (multi-tab synchronization)
   * Returns an unsubscribe function.
   */
  onChange?<T>(key: string, callback: (value: T) => void): () => void;
}

/**
 * Injection Token for the active Storage Transport
 */
export const STORAGE_TRANSPORT = new InjectionToken<StorageTransport>('STORAGE_TRANSPORT');
