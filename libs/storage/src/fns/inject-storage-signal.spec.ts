import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { injectStorageSignal } from './inject-storage-signal';
import { StorageTransport } from '../services/storage-transport';
import { STORAGE_TRANSPORT } from '../tokens/storage.tokens';
import { LocalStorageTransport } from '../services/local-transport';

describe('injectStorageSignal', () => {
  let mockTransport: StorageTransport & { onChange?: any };

  beforeEach(() => {
    mockTransport = {
      read: vi.fn().mockResolvedValue(undefined),
      write: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      onChange: vi.fn().mockReturnValue(vi.fn()),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE_TRANSPORT, useValue: mockTransport }],
    });
  });

  it('should throw an error when called outside of an injection context', () => {
    const opts = { storageType: 'local', serializer: 'json' } as const;
    expect(() => injectStorageSignal('user-pref', 'light-mode', opts)).toThrow(
      /injectStorageSignal/,
    );
  });

  it('should fallback to LocalStorageTransport if STORAGE_TRANSPORT is not provided', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [LocalStorageTransport],
    });

    await TestBed.runInInjectionContext(async () => {
      const opts = { storageType: 'local', serializer: 'json' } as const;
      const sig = injectStorageSignal('fallback-sig', 'default', opts);

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(sig()).toBe('default');
    });
  });

  it('should initialize with default value if transport has no persisted data', async () => {
    await TestBed.runInInjectionContext(async () => {
      const opts = { storageType: 'local', serializer: 'json' } as const;
      const sig = injectStorageSignal('user-pref', 'light-mode', opts);

      expect(sig()).toBe('light-mode');
      expect(mockTransport.read).toHaveBeenCalledWith('user-pref', opts);
    });
  });

  it('should restore persisted value asynchronously from L2 transport', async () => {
    mockTransport.read = vi.fn().mockResolvedValue('dark-mode');

    await TestBed.runInInjectionContext(async () => {
      const sig = injectStorageSignal('user-pref', 'light-mode', {
        storageType: 'local',
        serializer: 'json',
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(sig()).toBe('dark-mode');
      expect(sig.loading()).toBe(false);
      expect(sig.error()).toBeNull();
    });
  });

  it('should set loading signal to true initially for async storage types (indexeddb/cacheapi)', async () => {
    let resolveRead: (val: any) => void;
    mockTransport.read = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        }),
    );

    await TestBed.runInInjectionContext(async () => {
      const sig = injectStorageSignal('async-key', 'init', {
        storageType: 'indexeddb',
        serializer: 'json',
      });

      // Initially loading should be true
      expect(sig.loading()).toBe(true);

      resolveRead!('persisted');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(sig()).toBe('persisted');
      expect(sig.loading()).toBe(false);
    });
  });

  it('should persist changes reactively when using set and clear error state', async () => {
    await TestBed.runInInjectionContext(async () => {
      const opts = { storageType: 'local', serializer: 'json' } as const;
      const sig = injectStorageSignal('user-pref', 'light-mode', opts);

      sig.set('dark-mode');

      expect(sig()).toBe('dark-mode');
      expect(mockTransport.write).toHaveBeenCalledWith('user-pref', 'dark-mode', opts);
      expect(sig.error()).toBeNull();
    });
  });

  it('should update signal value reactively using update method and clear error state', async () => {
    await TestBed.runInInjectionContext(async () => {
      const opts = { storageType: 'local', serializer: 'json' } as const;
      const sig = injectStorageSignal('counter', 10, opts);

      sig.update((val) => val + 5);

      expect(sig()).toBe(15);
      expect(mockTransport.write).toHaveBeenCalledWith('counter', 15, opts);
      expect(sig.error()).toBeNull();
    });
  });

  it('should handle transport write errors gracefully and log them', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockTransport.write = vi.fn().mockRejectedValue(new Error('Write failed'));

    await TestBed.runInInjectionContext(async () => {
      const opts = { storageType: 'local', serializer: 'json' } as const;
      const sig = injectStorageSignal('err-key', 'data', opts);

      sig.set('updated');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[injectStorageSignal] Error writing key: err-key'),
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle transport failures gracefully and maintain fallback', async () => {
    const error = new Error('IndexedDB blocked');
    mockTransport.read = vi.fn().mockRejectedValue(error);

    await TestBed.runInInjectionContext(async () => {
      const sig = injectStorageSignal('secure-data', 'default-value', {
        storageType: 'indexeddb',
        serializer: 'json',
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(sig()).toBe('default-value');
      expect(sig.loading()).toBe(false);
      expect(sig.error()).toEqual(error);
    });
  });

  it('should handle non-Error transport failures by wrapping them in Error', async () => {
    mockTransport.read = vi.fn().mockRejectedValue('string error');

    await TestBed.runInInjectionContext(async () => {
      const sig = injectStorageSignal('str-err-data', 'default', {
        storageType: 'local',
        serializer: 'json',
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(sig.error()).toBeInstanceOf(Error);
      expect(sig.error()?.message).toBe('string error');
    });
  });

  it('should log error when auto-repair write fails on schema drift', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockTransport.read = vi.fn().mockResolvedValue({ corrupt: true });
    mockTransport.write = vi.fn().mockRejectedValue(new Error('Repair write failed'));

    await TestBed.runInInjectionContext(async () => {
      injectStorageSignal(
        'repair-fail-key',
        { valid: true },
        {
          storageType: 'local',
          serializer: 'json',
          validator: (data: any): data is { valid: boolean } => data?.valid === true,
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '[injectStorageSignal] Error repairing storage key: repair-fail-key',
        ),
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('should handle multi-tab synchronization via crossTabSync and cleanup on DestroyRef', async () => {
    let changeHandler: ((val: any) => void) | null = null;
    const unsubSpy = vi.fn();
    mockTransport.onChange = vi.fn().mockImplementation((_key, cb) => {
      changeHandler = cb;
      return unsubSpy;
    });

    await TestBed.runInInjectionContext(async () => {
      const destroyRef = TestBed.inject(DestroyRef);
      const onDestroySpy = vi.spyOn(destroyRef, 'onDestroy');

      const sig = injectStorageSignal('sync-sig-key', 'initial', {
        storageType: 'local',
        serializer: 'json',
        crossTabSync: true,
      });

      expect(mockTransport.onChange).toHaveBeenCalledWith('sync-sig-key', expect.any(Function));
      expect(onDestroySpy).toHaveBeenCalled();

      // Trigger cross tab change
      changeHandler?.('cross-tab-val');
      expect(sig()).toBe('cross-tab-val');

      // Call destroy callbacks
      for (const call of onDestroySpy.mock.calls) {
        call[0]();
      }
      expect(unsubSpy).toHaveBeenCalled();
    });
  });
});
