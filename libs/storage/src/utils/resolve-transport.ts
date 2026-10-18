import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { STORAGE_TRANSPORT } from '../tokens/storage.tokens';
import { LocalStorageTransport } from '../services/local-transport';
import { InMemoryStorageTransport } from '../services/transports/in-memory.transport';
import type { StorageTransport } from '../services/storage-transport';

export interface ResolveStorageTransportOptions {
  transport?: StorageTransport;
  ssrInMemory?: boolean;
  allowOutsideInjectionContext?: boolean;
}

/**
 * Resolves the active `StorageTransport` from the Angular injector or options,
 * with optional SSR `InMemoryStorageTransport` fallback and outside-injection-context fallback.
 */
export function resolveStorageTransport(
  options: ResolveStorageTransportOptions = {},
): StorageTransport {
  try {
    if (options.ssrInMemory) {
      const platformId = inject(PLATFORM_ID);
      if (!isPlatformBrowser(platformId)) {
        return new InMemoryStorageTransport();
      }
    }

    if (options.transport) {
      return options.transport;
    }

    return inject(STORAGE_TRANSPORT, { optional: true }) ?? inject(LocalStorageTransport);
  } catch (err) {
    if (options.allowOutsideInjectionContext) {
      return options.transport ?? new LocalStorageTransport();
    }
    throw err;
  }
}
