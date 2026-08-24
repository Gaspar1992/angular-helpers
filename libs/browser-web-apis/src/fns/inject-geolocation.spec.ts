import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectGeolocation } from './inject-geolocation';

describe('injectGeolocation', () => {
  let mockPosition: any;
  let mockGeolocation: any;

  beforeEach(() => {
    mockPosition = {
      coords: { latitude: 51.5074, longitude: -0.1278 },
      timestamp: 1000,
    };

    mockGeolocation = {
      getCurrentPosition: vi.fn((success) => success(mockPosition)),
      watchPosition: vi.fn((success) => {
        success(mockPosition);
        return 999;
      }),
      clearWatch: vi.fn(),
    };

    vi.stubGlobal('navigator', {
      geolocation: mockGeolocation,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectGeolocation()).toThrow(/injectGeolocation/);
  });

  it('should get current position and watch position', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectGeolocation();
      await new Promise((resolve) => queueMicrotask(resolve));

      expect(ref.isSupported()).toBe(true);

      const pos = await ref.getCurrent();
      expect(pos).toEqual(mockPosition);
      expect(ref.position()).toEqual(mockPosition);

      ref.watch();
      expect(ref.watching()).toBe(true);
      expect(mockGeolocation.watchPosition).toHaveBeenCalled();

      ref.stop();
      expect(ref.watching()).toBe(false);
      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(999);
    });
  });

  it('should auto-watch when opts.watch is true', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectGeolocation({ watch: true });
      await new Promise((resolve) => queueMicrotask(resolve));

      expect(ref.watching()).toBe(true);
      expect(mockGeolocation.watchPosition).toHaveBeenCalled();
    });
  });

  it('should handle errors on getCurrent and watch', async () => {
    const errorObj = { code: 1, message: 'User denied' } as GeolocationPositionError;
    mockGeolocation.getCurrentPosition = vi.fn((_, error) => error(errorObj));
    mockGeolocation.watchPosition = vi.fn((_, error) => error(errorObj));

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectGeolocation();
      await new Promise((resolve) => queueMicrotask(resolve));

      await expect(ref.getCurrent()).rejects.toEqual(errorObj);
      expect(ref.error()).toEqual(errorObj);

      ref.watch();
      expect(ref.error()).toEqual(errorObj);
    });
  });

  it('should handle server platform gracefully', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectGeolocation();
      expect(ref.isSupported()).toBe(false);
      await expect(ref.getCurrent()).rejects.toThrow(/Geolocation API not supported/);
    });
  });
});
