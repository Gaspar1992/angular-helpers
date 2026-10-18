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

  it('should support custom transport option, reload(), and non-Error persistence failures', async () => {
    const customTransport: StorageTransport = {
      read: vi.fn().mockResolvedValue('custom-val'),
      write: vi.fn().mockRejectedValue('string-failure'),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.runInInjectionContext(async () => {
      const res = storageResource({
        key: () => 'custom-key',
        params: () => ({ id: 1 }),
        transport: customTransport,
      });

      await new Promise((r) => setTimeout(r, 15));
      expect(res.value()).toBe('custom-val');
      expect(res.status()).toBeDefined();
      expect(res.isLoading()).toBe(false);
      expect(res.resource).toBeDefined();

      await expect(res.set('bad')).rejects.toThrow('string-failure');
      expect(res.error()?.message).toBe('string-failure');

      expect(typeof res.reload()).toBe('boolean');
    });
  });

  it('should support network-first success and rethrow when cache is empty on network failure', async () => {
    const loaderSuccess = vi.fn().mockResolvedValue('network-fresh');
    await TestBed.runInInjectionContext(async () => {
      const res = storageResource({
        key: 'net-ok',
        strategy: 'network-first',
        loader: loaderSuccess,
      });

      await new Promise((r) => setTimeout(r, 15));
      expect(res.value()).toBe('network-fresh');
      expect(mockTransport.write).toHaveBeenCalledWith('net-ok', 'network-fresh', {
        serializer: 'json',
        storageType: 'local',
      });
    });

    mockTransport.read = vi.fn().mockResolvedValue(undefined);
    const loaderFail = vi.fn().mockRejectedValue(new Error('Fatal Net Error'));
    await TestBed.runInInjectionContext(async () => {
      const res = storageResource({
        key: 'net-fail',
        strategy: 'network-first',
        loader: loaderFail,
      });

      await new Promise((r) => setTimeout(r, 15));
      expect(res.status()).toBe('error');
    });
  });

  it('should handle stale-while-revalidate background error and cache-first with loader', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockTransport.read = vi.fn().mockResolvedValue('cached-swr');
    const failingBgLoader = vi.fn().mockRejectedValue(new Error('BG fail'));

    await TestBed.runInInjectionContext(async () => {
      const res = storageResource({
        key: 'swr-err',
        strategy: 'stale-while-revalidate',
        loader: failingBgLoader,
      });

      await new Promise((r) => setTimeout(r, 20));
      expect(res.value()).toBe('cached-swr');
      expect(warnSpy).toHaveBeenCalled();
    });
    warnSpy.mockRestore();

    // Cache-first with cache hit
    mockTransport.read = vi.fn().mockResolvedValue('cf-hit');
    const cfLoader = vi.fn().mockResolvedValue('cf-remote');
    await TestBed.runInInjectionContext(async () => {
      const res = storageResource({
        key: 'cf-key-hit',
        strategy: 'cache-first',
        loader: cfLoader,
      });

      await new Promise((r) => setTimeout(r, 15));
      expect(res.value()).toBe('cf-hit');
      expect(cfLoader).not.toHaveBeenCalled();
    });

    // Cache-first with cache miss
    mockTransport.read = vi.fn().mockResolvedValue(undefined);
    await TestBed.runInInjectionContext(async () => {
      const res = storageResource({
        key: 'cf-key-miss',
        strategy: 'cache-first',
        loader: cfLoader,
      });

      await new Promise((r) => setTimeout(r, 15));
      expect(res.value()).toBe('cf-remote');
      expect(cfLoader).toHaveBeenCalled();
    });
  });

  it('should auto-repair schema drift when validator returns false and support crossTabSync', async () => {
    mockTransport.read = vi.fn().mockResolvedValue('corrupted-data');
    let onChangeCallback: ((val: string | undefined) => void) | undefined;
    const unsubscribeSpy = vi.fn();
    mockTransport.onChange = vi.fn().mockImplementation((_key, cb) => {
      onChangeCallback = cb;
      return unsubscribeSpy;
    });

    await TestBed.runInInjectionContext(async () => {
      const res = storageResource<string, number>({
        params: () => 7,
        key: (id) => `validated-${id}`,
        defaultValue: 'repaired-default',
        storageOptions: {
          validator: (val): val is string => val === 'valid-data',
          crossTabSync: true,
        },
      });

      await new Promise((r) => setTimeout(r, 15));
      expect(res.value()).toBe('repaired-default');
      expect(mockTransport.write).toHaveBeenCalledWith(
        'validated-7',
        'repaired-default',
        expect.objectContaining({ crossTabSync: true }),
      );

      expect(mockTransport.onChange).toHaveBeenCalledWith('validated-7', expect.any(Function));
      onChangeCallback?.('synced-from-other-tab');
      expect(res.value()).toBe('synced-from-other-tab');
    });
  });
});
