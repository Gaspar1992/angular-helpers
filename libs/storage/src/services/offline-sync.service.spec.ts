import { TestBed } from '@angular/core/testing';
import { HttpBackend, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { OfflineSyncService } from './offline-sync.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('OfflineSyncService', () => {
  let service: OfflineSyncService;
  let mockHttpBackend: any;
  let originalNavigator: any;
  let originalIndexedDB: any;
  let dbStore: Map<string, any>;

  beforeEach(() => {
    vi.useFakeTimers();
    dbStore = new Map();

    originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      configurable: true,
      writable: true,
    });

    mockHttpBackend = {
      handle: vi.fn().mockImplementation(() => {
        return of(
          new HttpResponse({
            status: 200,
            statusText: 'OK',
            body: { success: true, pendingCount: 0 },
          }),
        );
      }),
    };

    const mockIDBRequest = (result: any = null) => {
      const r: any = { onsuccess: null, onerror: null, result };
      return r;
    };

    const mockIDBTransaction = {
      objectStore: vi.fn().mockImplementation(() => {
        return {
          count: vi.fn().mockImplementation(() => {
            const r = mockIDBRequest(dbStore.size);
            queueMicrotask(() => r.onsuccess?.());
            return r;
          }),
        };
      }),
    };

    const mockDB = {
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(true),
      },
      transaction: vi.fn().mockReturnValue(mockIDBTransaction),
      close: vi.fn(),
    };

    const mockIDBOpenRequest = {
      result: mockDB,
      onsuccess: null,
      onerror: null,
    };

    const mockIndexedDB = {
      open: vi.fn().mockImplementation(() => {
        queueMicrotask(() => mockIDBOpenRequest.onsuccess?.());
        return mockIDBOpenRequest;
      }),
    };

    originalIndexedDB = (globalThis as any).indexedDB;
    (globalThis as any).indexedDB = mockIndexedDB;

    TestBed.configureTestingModule({
      providers: [OfflineSyncService, { provide: HttpBackend, useValue: mockHttpBackend }],
    });

    service = TestBed.inject(OfflineSyncService);
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalNavigator !== undefined) {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    } else {
      delete (globalThis as any).navigator;
    }
    if (originalIndexedDB !== undefined) {
      (globalThis as any).indexedDB = originalIndexedDB;
    } else {
      delete (globalThis as any).indexedDB;
    }
  });

  it('should initialize with correct online status and pending count', async () => {
    expect(service.isOnline()).toBe(true);

    await new Promise((resolve) => queueMicrotask(resolve));
    expect(service.pendingSyncsCount()).toBe(0);
  });

  it('should react to window online event and trigger sync', async () => {
    const triggerSyncSpy = vi.spyOn(service, 'triggerSync');

    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: false },
      configurable: true,
      writable: true,
    });
    window.dispatchEvent(new Event('offline'));
    expect(service.isOnline()).toBe(false);

    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      configurable: true,
      writable: true,
    });
    window.dispatchEvent(new Event('online'));

    expect(service.isOnline()).toBe(true);
    expect(triggerSyncSpy).toHaveBeenCalled();
  });

  it('should not trigger sync when offline', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: false },
      configurable: true,
      writable: true,
    });

    service.triggerSync();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[OfflineSyncService] Cannot trigger sync while offline.',
    );
    expect(mockHttpBackend.handle).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should trigger sync and update pendingSyncsCount from response body', async () => {
    mockHttpBackend.handle.mockReturnValue(
      of(
        new HttpResponse({
          status: 200,
          body: { success: true, pendingCount: 5 },
        }),
      ),
    );

    service.triggerSync();
    expect(mockHttpBackend.handle).toHaveBeenCalled();
    expect(service.pendingSyncsCount()).toBe(5);
  });

  it('should fallback to checkPendingCount if response body has no pendingCount', async () => {
    mockHttpBackend.handle.mockReturnValue(
      of(
        new HttpResponse({
          status: 200,
          body: { success: true },
        }),
      ),
    );
    const checkPendingSpy = vi.spyOn(service, 'checkPendingCount');

    service.triggerSync();
    expect(checkPendingSpy).toHaveBeenCalled();
  });

  it('should warn and check pending count when HttpBackend is not available', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const checkPendingSpy = vi.spyOn(service, 'checkPendingCount');

    // Simulate HttpBackend being absent
    (service as any).httpBackend = null;

    service.triggerSync();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[OfflineSyncService] HttpBackend not available'),
    );
    expect(checkPendingSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should handle sync errors gracefully and check pending count', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockHttpBackend.handle.mockReturnValue(throwError(() => new Error('Sync failed')));

    dbStore.set('1', { id: '1' });
    const checkPendingSpy = vi.spyOn(service, 'checkPendingCount');

    service.triggerSync();

    await new Promise((resolve) => queueMicrotask(resolve));
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[OfflineSyncService] Error draining offline queue:'),
      expect.any(Error),
    );
    expect(checkPendingSpy).toHaveBeenCalled();
    expect(service.pendingSyncsCount()).toBe(1);

    consoleErrorSpy.mockRestore();
  });

  describe('checkPendingCount edge cases', () => {
    it('should resolve to 0 when indexedDB is undefined', async () => {
      (globalThis as any).indexedDB = undefined;
      const count = await service.checkPendingCount();
      expect(count).toBe(0);
      expect(service.pendingSyncsCount()).toBe(0);
    });

    it('should resolve to 0 when store name does not exist in db', async () => {
      const closeSpy = vi.fn();
      const mockDBWithoutStore = {
        objectStoreNames: { contains: vi.fn().mockReturnValue(false) },
        close: closeSpy,
      };

      (globalThis as any).indexedDB = {
        open: vi.fn().mockReturnValue({
          result: mockDBWithoutStore,
          onsuccess: null,
          onerror: null,
        }),
      };

      const openReq = (globalThis as any).indexedDB.open();
      const promise = service.checkPendingCount();
      openReq.onsuccess();

      const count = await promise;
      expect(count).toBe(0);
      expect(closeSpy).toHaveBeenCalled();
    });

    it('should resolve to 0 when countRequest errors', async () => {
      const closeSpy = vi.fn();
      const countReq: any = { onsuccess: null, onerror: null };
      const mockDB = {
        objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
        transaction: vi.fn().mockReturnValue({
          objectStore: vi.fn().mockReturnValue({
            count: vi.fn().mockReturnValue(countReq),
          }),
        }),
        close: closeSpy,
      };

      const openReq: any = { result: mockDB, onsuccess: null, onerror: null };
      (globalThis as any).indexedDB = {
        open: vi.fn().mockReturnValue(openReq),
      };

      const promise = service.checkPendingCount();
      openReq.onsuccess();
      countReq.onerror();

      const count = await promise;
      expect(count).toBe(0);
      expect(closeSpy).toHaveBeenCalled();
    });

    it('should resolve to 0 when indexedDB.open errors', async () => {
      const openReq: any = { onsuccess: null, onerror: null };
      (globalThis as any).indexedDB = {
        open: vi.fn().mockReturnValue(openReq),
      };

      const promise = service.checkPendingCount();
      openReq.onerror();

      const count = await promise;
      expect(count).toBe(0);
    });

    it('should resolve to 0 and catch when indexedDB.open throws synchronously', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (globalThis as any).indexedDB = {
        open: vi.fn().mockImplementation(() => {
          throw new Error('Database locked');
        }),
      };

      const count = await service.checkPendingCount();
      expect(count).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OfflineSyncService] Error opening IndexedDB:'),
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('SSR / non-browser environment', () => {
    it('should initialize gracefully when running outside browser', () => {
      TestBed.runInInjectionContext(() => {
        const ssrService = new OfflineSyncService();
        (ssrService as any).platform = { isBrowser: false, window: null };
        expect(ssrService.isOnline()).toBe(true);
      });
    });
  });
});
