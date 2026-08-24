import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { injectStorageResource } from './inject-storage-resource';
import { StorageTransport } from '../services/storage-transport';
import { STORAGE_TRANSPORT } from '../tokens/storage.tokens';
import { LocalStorageTransport } from '../services/local-transport';

describe('injectStorageResource', () => {
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
    expect(() => injectStorageResource('user-pref', 'light-mode', opts)).toThrow(
      /injectStorageResource/,
    );
  });

  it('should fallback to LocalStorageTransport if STORAGE_TRANSPORT is not provided', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [LocalStorageTransport],
    });

    await TestBed.runInInjectionContext(async () => {
      const opts = { storageType: 'local', serializer: 'json' } as const;
      const { resource } = injectStorageResource('fallback-key', 'default-val', opts);

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(resource.value()).toBe('default-val');
    });
  });

  it('should initialize with default value if transport has no persisted data', async () => {
    await TestBed.runInInjectionContext(async () => {
      const opts = { storageType: 'local', serializer: 'json' } as const;
      const { resource } = injectStorageResource('user-pref', 'light-mode', opts);

      // Wait for the resource to resolve the loader
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockTransport.read).toHaveBeenCalledWith('user-pref', opts);
      expect(resource.value()).toBe('light-mode');
    });
  });

  it('should restore persisted value asynchronously from L2 transport', async () => {
    mockTransport.read = vi.fn().mockResolvedValue('dark-mode');

    await TestBed.runInInjectionContext(async () => {
      const { resource } = injectStorageResource('user-pref', 'light-mode', {
        storageType: 'local',
        serializer: 'json',
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(resource.value()).toBe('dark-mode');
      expect(resource.error()).toBeUndefined();
    });
  });

  it('should validate restored data and auto-repair schema drift when validator fails', async () => {
    const invalidData = { corrupted: true };
    mockTransport.read = vi.fn().mockResolvedValue(invalidData);
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const defaultVal = { valid: true, version: 2 };
    const validator = (data: any): data is typeof defaultVal =>
      Boolean(data?.valid && data?.version === 2);

    await TestBed.runInInjectionContext(async () => {
      const opts = { storageType: 'local', serializer: 'json' as const, validator };
      const { resource } = injectStorageResource('drift-key', defaultVal, opts);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[injectStorageResource] Schema drift detected for key: drift-key'),
      );
      expect(mockTransport.write).toHaveBeenCalledWith('drift-key', defaultVal, opts);
      expect(resource.value()).toEqual(defaultVal);
    });

    consoleWarnSpy.mockRestore();
  });

  it('should persist changes reactively when using set and handle undefined values', async () => {
    await TestBed.runInInjectionContext(async () => {
      const opts = { storageType: 'local', serializer: 'json' } as const;
      const { resource, set } = injectStorageResource<string | undefined>(
        'user-pref',
        'light-mode',
        opts,
      );

      set('dark-mode');
      expect(resource.value()).toBe('dark-mode');
      expect(mockTransport.write).toHaveBeenCalledWith('user-pref', 'dark-mode', opts);

      // Set undefined
      set(undefined);
      expect(resource.value()).toBeUndefined();
      expect(mockTransport.write).toHaveBeenCalledWith('user-pref', undefined, opts);
    });
  });

  it('should update resource reactively using update function', async () => {
    await TestBed.runInInjectionContext(async () => {
      const opts = { storageType: 'local', serializer: 'json' } as const;
      const { resource, update } = injectStorageResource('counter', 10, opts);

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(resource.value()).toBe(10);

      update((curr) => (curr ? curr + 5 : 5));
      expect(resource.value()).toBe(15);
      expect(mockTransport.write).toHaveBeenCalledWith('counter', 15, opts);
    });
  });

  it('should catch and log errors if transport.write fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockTransport.write = vi.fn().mockRejectedValue(new Error('Disk write failed'));

    await TestBed.runInInjectionContext(async () => {
      const opts = { storageType: 'local', serializer: 'json' } as const;
      const { set } = injectStorageResource('write-err', 'val', opts);

      set('new-val');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[injectStorageResource] Error writing key: write-err'),
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle transport read failures gracefully', async () => {
    const error = new Error('IndexedDB blocked');
    mockTransport.read = vi.fn().mockRejectedValue(error);

    await TestBed.runInInjectionContext(async () => {
      const { resource } = injectStorageResource('secure-data', 'default-value', {
        storageType: 'indexeddb',
        serializer: 'json',
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(resource.error()).toEqual(error);
    });
  });

  it('should subscribe to multi-tab onChange and cleanup on DestroyRef destruction', async () => {
    let changeHandler: ((val: any) => void) | null = null;
    const unsubSpy = vi.fn();
    mockTransport.onChange = vi.fn().mockImplementation((_key, cb) => {
      changeHandler = cb;
      return unsubSpy;
    });

    await TestBed.runInInjectionContext(async () => {
      const destroyRef = TestBed.inject(DestroyRef);
      const onDestroySpy = vi.spyOn(destroyRef, 'onDestroy');

      const { resource } = injectStorageResource('sync-key', 'init', {
        storageType: 'local',
        serializer: 'json',
        crossTabSync: true,
      });

      expect(mockTransport.onChange).toHaveBeenCalledWith('sync-key', expect.any(Function));
      expect(onDestroySpy).toHaveBeenCalled();

      // Trigger change
      changeHandler?.('remotely-updated');
      expect(resource.value()).toBe('remotely-updated');

      // Call all registered destroy callbacks
      for (const call of onDestroySpy.mock.calls) {
        call[0]();
      }
      expect(unsubSpy).toHaveBeenCalled();
    });
  });
});
