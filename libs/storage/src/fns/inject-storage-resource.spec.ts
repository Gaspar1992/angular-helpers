import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { injectStorageResource } from './inject-storage-resource';
import { StorageTransport } from '../services/storage-transport';
import { STORAGE_TRANSPORT } from '../tokens/storage.tokens';

describe('injectStorageResource', () => {
  let mockTransport: StorageTransport;

  beforeEach(() => {
    mockTransport = {
      read: vi.fn().mockResolvedValue(undefined),
      write: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
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

      // Wait for the read promise microtask to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(resource.value()).toBe('dark-mode');
      expect(resource.error()).toBeUndefined();
    });
  });

  it('should persist changes reactively when writing to the resource', async () => {
    await TestBed.runInInjectionContext(async () => {
      const opts = { storageType: 'local', serializer: 'json' } as const;
      const { resource, set } = injectStorageResource('user-pref', 'light-mode', opts);

      // Direct data set
      set('dark-mode');

      expect(resource.value()).toBe('dark-mode');
      expect(mockTransport.write).toHaveBeenCalledWith('user-pref', 'dark-mode', opts);
    });
  });

  it('should handle transport failures gracefully', async () => {
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
});
