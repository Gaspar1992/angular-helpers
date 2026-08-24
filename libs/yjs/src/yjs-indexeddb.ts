import { computed, DestroyRef, inject, signal, type Signal } from '@angular/core';
import type * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

export interface YjsIndexeddbRef {
  /** Signal reflecting whether local IndexedDB document hydration has completed */
  readonly synced: Signal<boolean>;
  /** Alias for synced signal, ideal for @defer (when db.isHydrated()) */
  readonly isHydrated: Signal<boolean>;
  /** Signal reflecting whether IndexedDB hydration is currently in progress */
  readonly isHydrating: Signal<boolean>;
  /** True if IndexedDB is available in current execution environment */
  readonly isSupported: boolean;
  /** The underlying y-indexeddb IndexeddbPersistence instance, or null in SSR / unsupported environments */
  readonly provider: IndexeddbPersistence | null;
  /** Clear all persisted data for this document in IndexedDB */
  clearData(): Promise<void>;
}

/**
 * Reactive Angular adapter for y-indexeddb offline persistence provider.
 * Persists a Y.Doc to IndexedDB and exposes hydration Signals.
 * SSR-safe: gracefully falls back when indexedDB is unavailable in non-browser environments.
 *
 * @param name The IndexedDB database key name
 * @param doc The target Y.Doc instance
 */
export function injectYjsIndexeddb(name: string, doc: Y.Doc): YjsIndexeddbRef {
  const destroyRef = inject(DestroyRef);
  const isSupported =
    typeof globalThis !== 'undefined' && typeof (globalThis as any).indexedDB !== 'undefined';

  if (!isSupported) {
    const syncedSig = signal<boolean>(true);
    return {
      synced: syncedSig.asReadonly(),
      isHydrated: syncedSig.asReadonly(),
      isHydrating: signal(false).asReadonly(),
      isSupported: false,
      provider: null,
      async clearData() {},
    };
  }

  const provider = new IndexeddbPersistence(name, doc);
  const syncedSig = signal<boolean>(provider.synced);
  const isHydrated = computed(() => syncedSig());
  const isHydrating = computed(() => !syncedSig());

  const handleSynced = (event: { synced: boolean }) => {
    syncedSig.set(event.synced);
  };

  provider.on('synced', handleSynced);

  destroyRef.onDestroy(() => {
    provider.off('synced', handleSynced);
    provider.destroy();
  });

  return {
    synced: syncedSig.asReadonly(),
    isHydrated,
    isHydrating,
    isSupported: true,
    provider,
    async clearData() {
      await provider.clearData();
      syncedSig.set(false);
    },
  };
}
