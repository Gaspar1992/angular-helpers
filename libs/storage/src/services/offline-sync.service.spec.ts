import { TestBed } from '@angular/core/testing';
import { HttpBackend, HttpRequest, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { OfflineSyncService } from './offline-sync.service';
import { OFFLINE_SYNC_SERVICE_DEFAULTS } from './offline-sync.constants';
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

    // Mock Navigator using Object.defineProperty to override modern read-only properties
    originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      configurable: true,
      writable: true,
    });

    // Mock HttpBackend for synthetic requests
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

    // Mock IndexedDB
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

    // Allow pending count promise to resolve
    await new Promise((resolve) => queueMicrotask(resolve));
    expect(service.pendingSyncsCount()).toBe(0);
  });

  it('should react to window online event and trigger sync', async () => {
    const triggerSyncSpy = vi.spyOn(service, 'triggerSync');

    // Simulate going offline first
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: false },
      configurable: true,
      writable: true,
    });
    window.dispatchEvent(new Event('offline'));
    expect(service.isOnline()).toBe(false);

    // Simulate going online
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      configurable: true,
      writable: true,
    });
    window.dispatchEvent(new Event('online'));

    expect(service.isOnline()).toBe(true);
    expect(triggerSyncSpy).toHaveBeenCalled();
  });

  it('should trigger sync and call HttpBackend to drain queue', async () => {
    mockHttpBackend.handle.mockClear();

    service.triggerSync();

    expect(mockHttpBackend.handle).toHaveBeenCalled();
    const req = mockHttpBackend.handle.mock.calls[0][0] as HttpRequest<any>;
    expect(req.method).toBe(OFFLINE_SYNC_SERVICE_DEFAULTS.HTTP_METHOD_GET);
    expect(req.url).toBe(OFFLINE_SYNC_SERVICE_DEFAULTS.URL_DRAIN);

    // Allow promises to flush
    await new Promise((resolve) => queueMicrotask(resolve));
    expect(service.pendingSyncsCount()).toBe(0);
  });

  it('should handle sync errors gracefully and check pending count', async () => {
    mockHttpBackend.handle.mockReturnValue(throwError(() => new Error('Sync failed')));

    dbStore.set('1', { id: '1' }); // Mock 1 item in db
    const checkPendingSpy = vi.spyOn(service, 'checkPendingCount');

    service.triggerSync();

    // Allow promises to flush
    await new Promise((resolve) => queueMicrotask(resolve));
    expect(checkPendingSpy).toHaveBeenCalled();
    expect(service.pendingSyncsCount()).toBe(1);
  });
});
