import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { injectPermissionState } from './inject-permission-state';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('injectPermissionState', () => {
  let mockPermissions: any;
  let mockStatus: any;
  let changeListeners: Function[] = [];

  beforeEach(() => {
    changeListeners = [];
    mockStatus = {
      state: 'granted',
      addEventListener: vi.fn((event, listener) => {
        changeListeners.push(listener);
      }),
      removeEventListener: vi.fn((event, listener) => {
        changeListeners = changeListeners.filter((l) => l !== listener);
      }),
    };

    mockPermissions = {
      query: vi.fn().mockResolvedValue(mockStatus),
    };

    vi.stubGlobal('navigator', {
      permissions: mockPermissions,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw an error when called outside an injection context', () => {
    expect(() => injectPermissionState('camera' as PermissionName)).toThrow(
      /injectPermissionState/,
    );
  });

  it('should be SSR safe and report unsupported', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectPermissionState('camera' as PermissionName);
      expect(ref.isSupported()).toBe(false);
      expect(ref.state()).toBe('unsupported');
    });
  });

  it('should report unsupported if navigator.permissions is undefined', async () => {
    vi.stubGlobal('navigator', {});

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectPermissionState('camera' as PermissionName);
      expect(ref.isSupported()).toBe(false);
      expect(ref.state()).toBe('unsupported');
    });
  });

  it('should query state successfully and update reactively', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectPermissionState('camera' as PermissionName);
      expect(ref.isSupported()).toBe(true);
      expect(ref.state()).toBe('loading');

      // Wait for promise resolution
      await new Promise((resolve) => queueMicrotask(resolve));
      expect(ref.state()).toBe('granted');

      // Simulate permission change
      mockStatus.state = 'denied';
      changeListeners.forEach((l) => l());
      expect(ref.state()).toBe('denied');
    });
  });

  it('should fall back to prompt if query throws a TypeError (Firefox)', async () => {
    mockPermissions.query.mockRejectedValue(new TypeError('Unsupported permission'));

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectPermissionState('camera' as PermissionName);
      expect(ref.isSupported()).toBe(true);
      expect(ref.state()).toBe('loading');

      await new Promise((resolve) => queueMicrotask(resolve));
      expect(ref.state()).toBe('prompt');
    });
  });

  it('should cleanup event listener on destroy', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);
    let ref: any;

    runInInjectionContext(childInjector, () => {
      ref = injectPermissionState('camera' as PermissionName);
    });

    await new Promise((resolve) => queueMicrotask(resolve));
    expect(mockStatus.addEventListener).toHaveBeenCalled();
    expect(mockStatus.removeEventListener).not.toHaveBeenCalled();

    childInjector.destroy();
    expect(mockStatus.removeEventListener).toHaveBeenCalled();
  });
});
