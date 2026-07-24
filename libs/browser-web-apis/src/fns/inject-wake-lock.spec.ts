import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { injectWakeLock } from './inject-wake-lock';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('injectWakeLock', () => {
  let originalNavigator: any;

  beforeEach(() => {
    originalNavigator = globalThis.navigator;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('should throw an error when called outside an injection context', () => {
    expect(() => injectWakeLock()).toThrow(/injectWakeLock/);
  });

  it('should report isSupported as false when on server platform', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const wakeLockRef = injectWakeLock();
      expect(wakeLockRef.isSupported()).toBe(false);
    });
  });

  it('should report isSupported as false when wakeLock is not in navigator', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      writable: true,
      configurable: true,
    });

    await TestBed.runInInjectionContext(async () => {
      const wakeLockRef = injectWakeLock();
      await new Promise((resolve) => queueMicrotask(resolve));
      expect(wakeLockRef.isSupported()).toBe(false);
    });
  });

  it('should request and release wake lock successfully in browser', async () => {
    const releaseSpy = vi.fn().mockResolvedValue(undefined);
    const mockSentinel = {
      released: false,
      type: 'screen',
      release: releaseSpy,
      addEventListener: vi.fn((event, handler) => {
        mockSentinel._handler = handler;
      }),
      removeEventListener: vi.fn(),
      _handler: null as any,
    };

    const requestSpy = vi.fn().mockResolvedValue(mockSentinel);

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        wakeLock: {
          request: requestSpy,
        },
      },
      writable: true,
      configurable: true,
    });

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const wakeLockRef = injectWakeLock();

      await new Promise((resolve) => queueMicrotask(resolve));
      expect(wakeLockRef.isSupported()).toBe(true);
      expect(wakeLockRef.active()).toBe(false);

      const success = await wakeLockRef.request();
      expect(success).toBe(true);
      expect(requestSpy).toHaveBeenCalledWith('screen');
      expect(wakeLockRef.active()).toBe(true);

      await wakeLockRef.release();
      expect(releaseSpy).toHaveBeenCalled();
      expect(wakeLockRef.active()).toBe(false);
    });
  });

  it('should handle request rejection and set error signal', async () => {
    const requestSpy = vi.fn().mockRejectedValue(new Error('Permission Denied'));

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        wakeLock: {
          request: requestSpy,
        },
      },
      writable: true,
      configurable: true,
    });

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const wakeLockRef = injectWakeLock();
      await new Promise((resolve) => queueMicrotask(resolve));

      const success = await wakeLockRef.request();
      expect(success).toBe(false);
      expect(wakeLockRef.active()).toBe(false);
      expect(wakeLockRef.error()).toBe('Permission Denied');
    });
  });

  it('should release wake lock on DestroyRef onDestroy', async () => {
    const releaseSpy = vi.fn().mockResolvedValue(undefined);
    const mockSentinel = {
      released: false,
      type: 'screen',
      release: releaseSpy,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        wakeLock: {
          request: vi.fn().mockResolvedValue(mockSentinel),
        },
      },
      writable: true,
      configurable: true,
    });

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);
    let wakeLockRef: any;

    runInInjectionContext(childInjector, () => {
      wakeLockRef = injectWakeLock();
    });

    await new Promise((resolve) => queueMicrotask(resolve));
    await wakeLockRef.request();
    expect(wakeLockRef.active()).toBe(true);

    childInjector.destroy();
    expect(releaseSpy).toHaveBeenCalled();
  });
});
