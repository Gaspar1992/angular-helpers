import {
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
  type Type,
} from '@angular/core';
import { SECURE_STORAGE_PASSPHRASE, STORAGE_TRANSPORT } from './tokens/storage.tokens';
import { STORAGE_WORKER_FACTORY } from './tokens/worker.tokens';
import type { StorageTransport } from './services/storage-transport';

export interface StorageConfig {
  /**
   * Custom AES-GCM passphrase used when `encrypt: true` is set on storage signals or resources.
   */
  passphrase?: string;

  /**
   * Optional Web Worker factory to offload storage serialization and encryption off the main thread.
   */
  workerFactory?: () => Worker;

  /**
   * Optional custom `StorageTransport` instance or service class override.
   */
  transport?: StorageTransport | Type<StorageTransport>;
}

/**
 * Configures `@angular-helpers/storage` at the application or route level.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideStorage({
 *       passphrase: environment.storagePassphrase,
 *       workerFactory: () => new Worker(new URL('./storage.worker', import.meta.url), { type: 'module' }),
 *     }),
 *   ],
 * });
 * ```
 */
export function provideStorage(config: StorageConfig = {}): EnvironmentProviders {
  const providers: Provider[] = [];

  if (config.passphrase !== undefined) {
    providers.push({
      provide: SECURE_STORAGE_PASSPHRASE,
      useValue: config.passphrase,
    });
  }

  if (config.workerFactory !== undefined) {
    providers.push({
      provide: STORAGE_WORKER_FACTORY,
      useValue: config.workerFactory,
    });
  }

  if (config.transport !== undefined) {
    if (typeof config.transport === 'function') {
      providers.push({
        provide: STORAGE_TRANSPORT,
        useClass: config.transport,
      });
    } else {
      providers.push({
        provide: STORAGE_TRANSPORT,
        useValue: config.transport,
      });
    }
  }

  return makeEnvironmentProviders(providers);
}
