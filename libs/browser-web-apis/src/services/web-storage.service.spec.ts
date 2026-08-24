import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom, take } from 'rxjs';
import { WebStorageService } from './web-storage.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('WebStorageService', () => {
  let service: WebStorageService;

  beforeEach(() => {
    // In-memory mock storage
    const createMockStorage = () => {
      let store: Record<string, string> = {};
      return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, val: string) => {
          store[key] = val;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        }),
        key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
        get length() {
          return Object.keys(store).length;
        },
      };
    };

    const mockLocal = createMockStorage();
    const mockSession = createMockStorage();

    Object.defineProperty(window, 'localStorage', {
      value: mockLocal,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSession,
      writable: true,
      configurable: true,
    });

    TestBed.configureTestingModule({
      providers: [WebStorageService, BrowserCapabilityService],
    });
    service = TestBed.inject(WebStorageService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
    expect(service.local).toBeDefined();
    expect(service.session).toBeDefined();
  });

  it('should set, get, remove, and clear in local namespace', () => {
    service.local.set('name', 'Antigravity');
    expect(service.local.get<string>('name')).toBe('Antigravity');

    service.local.remove('name');
    expect(service.local.get('name')).toBeNull();

    service.local.set('k1', 1);
    service.local.set('k2', 2);
    expect(service.local.size()).toBeGreaterThan(0);
    service.local.clear();
    expect(service.local.size()).toBe(0);
  });

  it('should set, get, remove, and clear in session namespace', () => {
    service.session.set('session-token', 'xyz123');
    expect(service.session.get('session-token')).toBe('xyz123');

    service.session.remove('session-token');
    expect(service.session.get('session-token')).toBeNull();
  });

  it('should watch key changes in namespace', async () => {
    const watch$ = service.local.watch<string>('theme');
    const promise = firstValueFrom(watch$.pipe(take(1)));

    service.local.set('theme', 'dark');
    const val = await promise;
    expect(val).toBe('dark');
  });

  it('should emit global storage events via getStorageEvents()', async () => {
    const events$ = service.getStorageEvents();
    const promise = firstValueFrom(events$.pipe(take(1)));

    service.local.set('color', 'blue');
    const event = await promise;
    expect(event.key).toBe('color');
    expect(event.newValue).toBe('blue');
    expect(event.storageArea).toBe('localStorage');
  });

  it('should support legacy deprecated methods', () => {
    expect(service.setLocalStorage('legKey', 'val')).toBe(true);
    expect(service.getLocalStorage('legKey')).toBe('val');
    expect(service.getLocalStorageSize()).toBeGreaterThan(0);
    expect(service.removeLocalStorage('legKey')).toBe(true);
    expect(service.clearLocalStorage()).toBe(true);

    expect(service.setSessionStorage('legSess', 'val2')).toBe(true);
    expect(service.getSessionStorage('legSess')).toBe('val2');
    expect(service.getSessionStorageSize()).toBeGreaterThan(0);
    expect(service.removeSessionStorage('legSess')).toBe(true);
    expect(service.clearSessionStorage()).toBe(true);

    expect(service.getNativeLocalStorage()).toBe(window.localStorage);
    expect(service.getNativeSessionStorage()).toBe(window.sessionStorage);
  });

  it('should watch legacy methods', async () => {
    const watchLocal$ = service.watchLocalStorage('testWatch');
    const promise = firstValueFrom(watchLocal$.pipe(take(1)));
    service.setLocalStorage('testWatch', 'hello');
    expect(await promise).toBe('hello');

    const watchSess$ = service.watchSessionStorage('testWatchSess');
    const sessPromise = firstValueFrom(watchSess$.pipe(take(1)));
    service.setSessionStorage('testWatchSess', 'world');
    expect(await sessPromise).toBe('world');
  });
});
