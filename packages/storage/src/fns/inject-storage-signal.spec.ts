import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { injectStorageSignal } from './inject-storage-signal';
import { StorageTransport } from '../services/storage-transport';
import { STORAGE_TRANSPORT } from '../tokens/storage.tokens';

describe('injectStorageSignal', () => {
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

  it('should initialize with default value if transport has no persisted data', async () => {
    await TestBed.runInInjectionContext(async () => {
      const opts = { storageType: 'local', serializer: 'json' } as const;
      const sig = injectStorageSignal('user-pref', 'light-mode', opts);

      // Initially, returns data directly
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

      // Wait for the read promise microtask to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(sig()).toBe('dark-mode');
      expect(sig.loading()).toBe(false);
      expect(sig.error()).toBeNull();
    });
  });

  it('should persist changes reactively when writing to the Signal', async () => {
    await TestBed.runInInjectionContext(async () => {
      const opts = { storageType: 'local', serializer: 'json' } as const;
      const sig = injectStorageSignal('user-pref', 'light-mode', opts);

      // Direct data set
      sig.set('dark-mode');

      expect(sig()).toBe('dark-mode');
      expect(mockTransport.write).toHaveBeenCalledWith('user-pref', 'dark-mode', opts);
    });
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
});
