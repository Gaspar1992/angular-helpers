import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { storageResource, persistedResource } from './storage-resource';
import type { StorageTransport } from '../services/storage-transport';
import { STORAGE_TRANSPORT } from '../tokens/storage.tokens';

describe('storageResource', () => {
  let mockTransport: StorageTransport & { onChange?: any };

  beforeEach(() => {
    mockTransport = {
      read: vi.fn().mockResolvedValue(undefined),
      write: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      onChange: vi.fn().mockReturnValue(vi.fn()),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: STORAGE_TRANSPORT, useValue: mockTransport },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
  });

  it('should throw an error when called outside of an injection context', () => {
    expect(() => storageResource({ key: 'user-pref', defaultValue: 'dark' })).toThrow(
      /storageResource/,
    );
  });

  it('should initialize with default value if storage transport has no data', async () => {
    await TestBed.runInInjectionContext(async () => {
      const res = storageResource({
        key: 'theme',
        defaultValue: 'light',
      });

      await new Promise((r) => setTimeout(r, 10));
      expect(mockTransport.read).toHaveBeenCalledWith('theme', {
        serializer: 'json',
        storageType: 'local',
      });
      expect(res.value()).toBe('light');
    });
  });

  it('should hydrate from storage when cached value exists', async () => {
    mockTransport.read = vi.fn().mockResolvedValue('persisted-theme');

    await TestBed.runInInjectionContext(async () => {
      const res = storageResource({
        key: 'theme',
        defaultValue: 'light',
      });

      await new Promise((r) => setTimeout(r, 10));
      expect(res.value()).toBe('persisted-theme');
    });
  });

  it('should perform optimistic updates and persist to transport', async () => {
    await TestBed.runInInjectionContext(async () => {
      const res = storageResource({
        key: 'theme',
        defaultValue: 'light',
      });

      await new Promise((r) => setTimeout(r, 10));
      expect(res.value()).toBe('light');

      await res.set('dark');
      expect(res.value()).toBe('dark');
      expect(mockTransport.write).toHaveBeenCalledWith('theme', 'dark', {
        serializer: 'json',
        storageType: 'local',
      });

      await res.update((curr) => `${curr}-mode`);
      expect(res.value()).toBe('dark-mode');
      expect(mockTransport.write).toHaveBeenCalledWith('theme', 'dark-mode', {
        serializer: 'json',
        storageType: 'local',
      });
    });
  });

  it('should automatically rollback optimistic update if transport.write fails', async () => {
    mockTransport.read = vi.fn().mockResolvedValue('original-value');
    mockTransport.write = vi.fn().mockRejectedValue(new Error('Quota exceeded'));

    await TestBed.runInInjectionContext(async () => {
      const res = storageResource({
        key: 'settings',
        defaultValue: 'initial',
      });

      await new Promise((r) => setTimeout(r, 10));
      expect(res.value()).toBe('original-value');

      await expect(res.set('failed-value')).rejects.toThrow('Quota exceeded');
      // Verifies linkedSignal rolled back to original-value!
      expect(res.value()).toBe('original-value');
    });
  });

  it('should support stale-while-revalidate strategy with loader and background update', async () => {
    mockTransport.read = vi.fn().mockResolvedValue('cached-profile');
    const loaderFn = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('fresh-profile-from-api'), 25)),
      );

    await TestBed.runInInjectionContext(async () => {
      const res = storageResource({
        key: 'profile',
        strategy: 'stale-while-revalidate',
        loader: loaderFn,
      });

      // Immediate hydration from cache
      await new Promise((r) => setTimeout(r, 10));
      expect(res.value()).toBe('cached-profile');
      expect(loaderFn).toHaveBeenCalled();

      // Wait for background revalidation
      await new Promise((r) => setTimeout(r, 35));
      expect(res.value()).toBe('fresh-profile-from-api');
      expect(mockTransport.write).toHaveBeenCalledWith('profile', 'fresh-profile-from-api', {
        serializer: 'json',
        storageType: 'local',
      });
    });
  });

  it('should support network-first strategy with cache fallback on network failure', async () => {
    mockTransport.read = vi.fn().mockResolvedValue('cached-backup');
    const loaderFn = vi.fn().mockRejectedValue(new Error('Network Offline'));

    await TestBed.runInInjectionContext(async () => {
      const res = storageResource({
        key: 'dashboard',
        strategy: 'network-first',
        loader: loaderFn,
      });

      await new Promise((r) => setTimeout(r, 20));
      expect(loaderFn).toHaveBeenCalled();
      expect(res.value()).toBe('cached-backup');
    });
  });

  it('should compute storage key dynamically when request signal changes', async () => {
    const userId = signal(1);

    await TestBed.runInInjectionContext(async () => {
      const res = storageResource({
        request: () => userId(),
        key: (id) => `user-data-${id}`,
        defaultValue: 'none',
      });

      await new Promise((r) => setTimeout(r, 10));
      expect(mockTransport.read).toHaveBeenCalledWith('user-data-1', {
        serializer: 'json',
        storageType: 'local',
      });

      userId.set(2);
      await new Promise((r) => setTimeout(r, 10));
      expect(mockTransport.read).toHaveBeenCalledWith('user-data-2', {
        serializer: 'json',
        storageType: 'local',
      });
    });
  });

  it('should degrade cleanly to InMemoryStorageTransport in SSR without touching browser globals', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const res = storageResource({
        key: 'ssr-key',
        defaultValue: 'ssr-default',
      });

      await new Promise((r) => setTimeout(r, 10));
      expect(res.value()).toBe('ssr-default');

      await res.set('ssr-modified');
      expect(res.value()).toBe('ssr-modified');
    });
  });

  it('should expose persistedResource as an alias', () => {
    expect(persistedResource).toBe(storageResource);
  });
});
