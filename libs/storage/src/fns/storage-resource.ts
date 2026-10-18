import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  linkedSignal,
  resource,
  signal,
  type ResourceRef,
  type ResourceStatus,
  type Signal,
} from '@angular/core';
import { resolveStorageTransport } from '../utils/resolve-transport';
import type { StorageTransport } from '../services/storage-transport';
import type { StorageSignalOptions } from '../interfaces/storage.types';

export interface StorageResourceOptions<T, R = unknown> {
  /**
   * Unique storage key, or a function resolving the key from the current request/params value.
   */
  key: string | ((request: R) => string);

  /**
   * Optional reactive request parameter function (passed to Angular Resource).
   */
  request?: () => R;

  /**
   * Optional reactive params parameter function (Angular 21/22 alias for request).
   */
  params?: () => R;

  /**
   * Initial default value if both storage and remote loader have no data.
   */
  defaultValue?: T;

  /**
   * Storage transport type override ('local' | 'session' | 'indexeddb' | 'cacheapi' | 'memory').
   */
  storageType?: 'local' | 'session' | 'indexeddb' | 'cacheapi' | 'memory';

  /**
   * Storage transport options (encryption, serializer, crossTabSync, validator).
   */
  storageOptions?: Partial<StorageSignalOptions<T>>;

  /**
   * Optional custom transport driver override.
   */
  transport?: StorageTransport;

  /**
   * Fetching / caching strategy:
   * - 'cache-first': Read from local storage first; if missing, call loader and persist.
   * - 'stale-while-revalidate': Instant hydration from local storage; executes loader in background to update and persist fresh data.
   * - 'network-first': Call loader first; fallback to storage if loader fails.
   * Default: 'cache-first' (or 'stale-while-revalidate' if loader is provided).
   */
  strategy?: 'cache-first' | 'stale-while-revalidate' | 'network-first';

  /**
   * Remote async loader function to fetch fresh data.
   */
  loader?: (params: { request: R; abortSignal: AbortSignal }) => Promise<T>;
}

export interface StorageResourceRef<T> {
  /**
   * Reactive Signal of the current value.
   * Linked to the underlying resource, with immediate optimistic updates on write.
   */
  readonly value: Signal<T | undefined>;

  /**
   * Status of the underlying Resource ('idle' | 'loading' | 'resolved' | 'error').
   */
  readonly status: Signal<ResourceStatus>;

  /**
   * Boolean signal indicating whether loading or revalidating is in progress.
   */
  readonly isLoading: Signal<boolean>;

  /**
   * Signal exposing any error that occurred during resource loading or persisting.
   */
  readonly error: Signal<Error | null>;

  /**
   * Direct access to the underlying Angular ResourceRef.
   */
  readonly resource: ResourceRef<T | undefined>;

  /**
   * Optimistically updates the value and persists to storage asynchronously.
   * Automatically rolls back to the previous value if writing fails.
   */
  set(value: T | undefined): Promise<void>;

  /**
   * Optimistically updates via an updater function and persists with automatic rollback on error.
   */
  update(updater: (current: T | undefined) => T | undefined): Promise<void>;

  /**
   * Re-triggers the resource loader.
   */
  reload(): boolean;
}

/**
 * Creates a reactive Resource connected to a storage driver with optimistic updates,
 * automatic rollback, SSR memory fallback, and optional Stale-While-Revalidate caching.
 */
export function storageResource<T, R = void>(
  options: StorageResourceOptions<T, R>,
): StorageResourceRef<T> {
  assertInInjectionContext(storageResource);

  const activeTransport = resolveStorageTransport({
    transport: options.transport,
    ssrInMemory: true,
  });

  const storageOpts: StorageSignalOptions<T> = {
    storageType: options.storageType ?? 'local',
    serializer: options.storageOptions?.serializer ?? 'json',
    ...options.storageOptions,
  };
  const strategy = options.strategy ?? (options.loader ? 'stale-while-revalidate' : 'cache-first');
  const persistingError = signal<Error | null>(null);
  const revalidatedValue = signal<T | undefined>(undefined);

  const requestFn = options.params ?? options.request;

  const res = resource<T | undefined, R>({
    params: requestFn,
    loader: async (loaderContext: any) => {
      const currentReq: R =
        loaderContext?.params ??
        loaderContext?.request ??
        (requestFn ? requestFn() : (undefined as unknown as R));
      const abortSignal = loaderContext?.abortSignal as AbortSignal;

      const resolvedKey = typeof options.key === 'function' ? options.key(currentReq) : options.key;

      const cached = await activeTransport.read<T>(resolvedKey, storageOpts);

      if (options.loader) {
        if (strategy === 'network-first') {
          try {
            const remote = await options.loader({ request: currentReq, abortSignal });
            await activeTransport.write(resolvedKey, remote, storageOpts);
            return remote;
          } catch (netErr) {
            if (cached !== undefined) {
              return cached;
            }
            throw netErr;
          }
        }

        if (strategy === 'stale-while-revalidate' && cached !== undefined) {
          // Instant hydration from cache; revalidate in background
          options
            .loader({ request: currentReq, abortSignal })
            .then(async (fresh) => {
              if (abortSignal?.aborted) return;
              await activeTransport.write(resolvedKey, fresh, storageOpts);
              revalidatedValue.set(fresh);
            })
            .catch((err) => {
              // oxlint-disable-next-line no-console
              console.warn(
                `[storageResource] Background revalidation failed for key: ${resolvedKey}`,
                err,
              );
            });
          return cached;
        }

        // Cache-first (or SWR without cache hit): call loader
        if (cached !== undefined) {
          return cached;
        }

        const fresh = await options.loader({ request: currentReq, abortSignal });
        await activeTransport.write(resolvedKey, fresh, storageOpts);
        return fresh;
      }

      // Pure storage resource without remote loader
      if (cached !== undefined) {
        if (storageOpts.validator && !storageOpts.validator(cached)) {
          // Auto-repair schema drift
          await activeTransport.write(resolvedKey, options.defaultValue, storageOpts);
          return options.defaultValue;
        }
        return cached;
      }

      return options.defaultValue;
    },
  });

  // Optimistic updates backed by linkedSignal
  const optimisticValue = linkedSignal<T | undefined>(() => revalidatedValue() ?? res.value());

  const set = async (newValue: T | undefined): Promise<void> => {
    const previous = optimisticValue();
    optimisticValue.set(newValue);
    persistingError.set(null);

    const currentReq = requestFn ? requestFn() : (undefined as unknown as R);
    const resolvedKey = typeof options.key === 'function' ? options.key(currentReq) : options.key;

    try {
      await activeTransport.write(resolvedKey, newValue, storageOpts);
    } catch (err) {
      // Automatic rollback on persistence failure!
      optimisticValue.set(previous);
      const errorObj = err instanceof Error ? err : new Error(String(err));
      persistingError.set(errorObj);
      throw errorObj;
    }
  };

  const update = async (updater: (current: T | undefined) => T | undefined): Promise<void> => {
    const current = optimisticValue();
    const next = updater(current);
    await set(next);
  };

  // Cross-tab synchronization
  if (storageOpts.crossTabSync && activeTransport.onChange) {
    const initialReq = requestFn ? requestFn() : (undefined as unknown as R);
    const key = typeof options.key === 'function' ? options.key(initialReq) : options.key;
    const unsubscribe = activeTransport.onChange<T>(key, (remoteVal) => {
      optimisticValue.set(remoteVal);
    });
    inject(DestroyRef).onDestroy(() => unsubscribe());
  }

  return {
    value: optimisticValue,
    status: res.status,
    isLoading: res.isLoading,
    error: persistingError,
    resource: res,
    set,
    update,
    reload: () => res.reload(),
  };
}

/**
 * Alias for storageResource following the persistedResource naming convention.
 */
export const persistedResource = storageResource;
