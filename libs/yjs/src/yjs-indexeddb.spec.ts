import {
  createEnvironmentInjector,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as Y from 'yjs';
import { injectYjsIndexeddb } from './yjs-indexeddb';

describe('injectYjsIndexeddb', () => {
  let doc: Y.Doc;
  let injector: EnvironmentInjector;

  beforeEach(() => {
    doc = new Y.Doc();
    injector = createEnvironmentInjector([]);
  });

  it('should return fallback synced=true when indexedDB is unsupported', () => {
    vi.stubGlobal('indexedDB', undefined);

    runInInjectionContext(injector, () => {
      const dbRef = injectYjsIndexeddb('test-db', doc);

      expect(dbRef.synced()).toBe(true);
      expect(dbRef.provider).toBeNull();
    });

    vi.unstubAllGlobals();
  });

  it('should bind IndexeddbPersistence when indexedDB is supported', () => {
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
      expect(dbRef.provider).toBeDefined();
    });

    vi.unstubAllGlobals();
  });
});
