import { InjectionToken } from '@angular/core';
import type { StorageTransport } from '../services/storage-transport';

/**
 * Injection token to configure the AES-GCM encryption passphrase for StorageTransports.
 * Must be provided explicitly by the application when encryption is enabled.
 */
export const SECURE_STORAGE_PASSPHRASE = new InjectionToken<string>('SECURE_STORAGE_PASSPHRASE', {
  providedIn: 'root',
  factory: () => 'angular-helpers-secure-storage-passphrase',
});

/**
 * Injection Token for the active Storage Transport
 */
export const STORAGE_TRANSPORT = new InjectionToken<StorageTransport>('STORAGE_TRANSPORT');
