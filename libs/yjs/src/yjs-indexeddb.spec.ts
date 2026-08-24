import {
  createEnvironmentInjector,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as Y from 'yjs';
import { injectYjsIndexeddb } from './yjs-indexeddb';

describe('injectYjsIndexeddb', () => {
  let doc: Y.Doc;
  let injector: EnvironmentInjector;

  beforeEach(() => {
    doc = new Y.Doc();
    injector = createEnvironmentInjector([]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should return fallback synced=true and null provider when indexedDB is unsupported', async () => {
    vi.stubGlobal('indexedDB', undefined);

    await runInInjectionContext(injector, async () => {
      const dbRef = injectYjsIndexeddb('test-db', doc);

      expect(dbRef.synced()).toBe(true);
      expect(dbRef.isHydrated()).toBe(true);
      expect(dbRef.isHydrating()).toBe(false);
      expect(dbRef.isSupported).toBe(false);
      expect(dbRef.provider).toBeNull();

      // Calling clearData in unsupported environment should resolve cleanly
      await expect(dbRef.clearData()).resolves.toBeUndefined();
    });
  });

  it('should bind IndexeddbPersistence when indexedDB is supported and reflect sync state changes', async () => {
    const fakeRequest = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      result: {
        createObjectStore: vi.fn(),
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            get: vi.fn(() => ({ addEventListener: vi.fn() })),
            put: vi.fn(() => ({ addEventListener: vi.fn() })),
          })),
        })),
        onversionchange: null,
      },
    };

    vi.stubGlobal('indexedDB', {
      open: vi.fn(() => fakeRequest),
    });

    runInInjectionContext(injector, () => {
      const dbRef = injectYjsIndexeddb('test-db-2', doc);
      expect(dbRef.synced()).toBe(false);
      expect(dbRef.isHydrated()).toBe(false);
      expect(dbRef.isHydrating()).toBe(true);
      expect(dbRef.isSupported).toBe(true);
      expect(dbRef.provider).toBeDefined();

      const provider = dbRef.provider!;

      // Simulate provider synced event
      provider.emit('synced', [{ synced: true }]);
      expect(dbRef.synced()).toBe(true);
      expect(dbRef.isHydrated()).toBe(true);
      expect(dbRef.isHydrating()).toBe(false);

      // Simulate provider synced false event
      provider.emit('synced', [{ synced: false }]);
      expect(dbRef.synced()).toBe(false);
      expect(dbRef.isHydrated()).toBe(false);
      expect(dbRef.isHydrating()).toBe(true);
    });
  });

  it('should clear data via provider and reset synced signal to false', async () => {
    const fakeRequest = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      result: {
        createObjectStore: vi.fn(),
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            get: vi.fn(() => ({ addEventListener: vi.fn() })),
            put: vi.fn(() => ({ addEventListener: vi.fn() })),
          })),
        })),
        onversionchange: null,
      },
    };

    vi.stubGlobal('indexedDB', {
      open: vi.fn(() => fakeRequest),
    });

    await runInInjectionContext(injector, async () => {
      const dbRef = injectYjsIndexeddb('test-db-clear', doc);
      const provider = dbRef.provider!;

      const clearDataSpy = vi.spyOn(provider, 'clearData').mockResolvedValue(undefined);

      // Set synced to true first
      provider.emit('synced', [{ synced: true }]);
      expect(dbRef.synced()).toBe(true);

      await dbRef.clearData();

      expect(clearDataSpy).toHaveBeenCalledTimes(1);
      expect(dbRef.synced()).toBe(false);
      expect(dbRef.isHydrated()).toBe(false);
    });
  });

  it('should clean up event listeners and destroy provider when injector is destroyed', () => {
    const fakeRequest = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      result: {
        createObjectStore: vi.fn(),
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            get: vi.fn(() => ({ addEventListener: vi.fn() })),
            put: vi.fn(() => ({ addEventListener: vi.fn() })),
          })),
        })),
        onversionchange: null,
      },
    };

    vi.stubGlobal('indexedDB', {
      open: vi.fn(() => fakeRequest),
    });

    let providerInstance: any;

    runInInjectionContext(injector, () => {
      const dbRef = injectYjsIndexeddb('test-db-destroy', doc);
      providerInstance = dbRef.provider;
    });

    const destroySpy = vi.spyOn(providerInstance, 'destroy');
    const offSpy = vi.spyOn(providerInstance, 'off');

    injector.destroy();

    expect(offSpy).toHaveBeenCalledWith('synced', expect.any(Function));
    expect(destroySpy).toHaveBeenCalledTimes(1);
  });
});
