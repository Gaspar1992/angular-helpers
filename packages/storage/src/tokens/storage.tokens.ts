import { InjectionToken } from '@angular/core';

/**
 * Injection token to configure the AES-GCM encryption passphrase for StorageTransports.
 * Defaults to the legacy string for seamless backward compatibility.
 */
export const SECURE_STORAGE_PASSPHRASE = new InjectionToken<string>('SECURE_STORAGE_PASSPHRASE', {
  providedIn: 'root',
  factory: () => 'angular-helpers-secure-storage-passphrase',
});
