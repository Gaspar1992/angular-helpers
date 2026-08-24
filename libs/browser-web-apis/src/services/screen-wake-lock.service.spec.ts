import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  DestroyRef,
  EnvironmentInjector,
  createEnvironmentInjector,
} from '@angular/core';
import { ScreenWakeLockService } from './screen-wake-lock.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('ScreenWakeLockService', () => {
  let service: ScreenWakeLockService;
  let mockSentinel: any;
  let releaseListeners: Set<() => void>;

  beforeEach(() => {
    releaseListeners = new Set();
    mockSentinel = {
      released: false,
      type: 'screen',
      release: vi.fn().mockImplementation(async () => {
        mockSentinel.released = true;
        releaseListeners.forEach((cb) => cb());
      }),
      addEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === 'release') releaseListeners.add(cb);
      }),
    };

    vi.stubGlobal('navigator', {
      wakeLock: {
        request: vi.fn().mockResolvedValue(mockSentinel),
      },
    });
    vi.stubGlobal('isSecureContext', true);

    TestBed.configureTestingModule({
      providers: [ScreenWakeLockService, BrowserCapabilityService],
    });
    service = TestBed.inject(ScreenWakeLockService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and check isSupported', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
    expect(service.isActive).toBe(false);
  });

  it('should request screen wake lock and track status', async () => {
    const status = await service.request();
    expect(status).toEqual({ active: true, type: 'screen', released: false });
    expect(service.isActive).toBe(true);

    // Trigger release on sentinel
    await mockSentinel.release();
    expect(service.isActive).toBe(false);
  });

  it('should release wake lock', async () => {
    await service.request();
    expect(service.isActive).toBe(true);

    await service.release();
    expect(mockSentinel.release).toHaveBeenCalled();
    expect(service.isActive).toBe(false);
  });

  it('should not throw if release is called when inactive or already released', async () => {
    await expect(service.release()).resolves.toBeUndefined();
  });

  it('should throw error when not in secure context', async () => {
    vi.stubGlobal('isSecureContext', false);
    await expect(service.request()).rejects.toThrow(/secure context/);
  });

  it('should throw error when wake lock is not supported', async () => {
    vi.stubGlobal('navigator', {});
    await expect(service.request()).rejects.toThrow(/not supported in this browser/);
  });

  it('should log and rethrow when navigator.wakeLock.request fails', async () => {
    (navigator as any).wakeLock.request = vi.fn().mockRejectedValue(new Error('Low power mode'));
    await expect(service.request()).rejects.toThrow('Failed to acquire wake lock');
  });

  it('should watch wake lock status and re-acquire on visibilitychange to visible', async () => {
    const statuses: any[] = [];
    const sub = service.watchStatus().subscribe((s) => statuses.push(s));

    expect(statuses[0]).toEqual({ active: false, released: true });

    // Simulate becoming visible
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    // Wait a tick for async re-acquire
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(service.isActive).toBe(true);
    sub.unsubscribe();
  });

  it('should cleanup on destroy', async () => {
    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([ScreenWakeLockService], parentInjector);
    const childService = childInjector.get(ScreenWakeLockService);

    await childService.request();
    expect(childService.isActive).toBe(true);

    childInjector.destroy();
    expect(mockSentinel.release).toHaveBeenCalled();
  });
});
