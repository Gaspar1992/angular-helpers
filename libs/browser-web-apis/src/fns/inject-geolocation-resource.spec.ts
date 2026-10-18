import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectGeolocationResource } from './inject-geolocation-resource';

describe('injectGeolocationResource', () => {
  let mockPosition: any;
  let mockGeolocation: any;

  beforeEach(() => {
    mockPosition = {
      coords: { latitude: 48.8566, longitude: 2.3522 },
      timestamp: 2000,
    };

    mockGeolocation = {
      getCurrentPosition: vi.fn((success) => success(mockPosition)),
      watchPosition: vi.fn((success) => {
        success(mockPosition);
        return 777;
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
    expect(() => injectGeolocationResource()).toThrow(/injectGeolocationResource/);
  });

  it('should create resource, execute stream in one-shot and watch modes, and cleanup', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);
    const geoResource = runInInjectionContext(childInjector, () =>
      injectGeolocationResource({ watch: false }),
    );

    expect(geoResource.isSupported()).toBe(true);

    // Trigger initial stream (watch: false -> getCurrentPosition)
    TestBed.tick();
    await new Promise((r) => setTimeout(r, 0));
    TestBed.tick();
    expect(geoResource.position()).toEqual(mockPosition);

    // Switch to watch mode
    geoResource.watch({ enableHighAccuracy: true });
    expect(geoResource.watching()).toBe(true);
    TestBed.tick();
    await new Promise((r) => setTimeout(r, 0));
    TestBed.tick();
    expect(mockGeolocation.watchPosition).toHaveBeenCalled();

    // Stop watching (aborts watch stream -> calls clearWatch)
    geoResource.stop();
    expect(geoResource.watching()).toBe(false);
    TestBed.tick();
    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(777);

    // One-shot getCurrent
    const pos = await geoResource.getCurrent({ timeout: 5000 });
    expect(pos).toEqual(mockPosition);

    childInjector.destroy();
  });

  it('should handle errors in watch, getCurrentPosition, and getCurrent with reportToBoundary', async () => {
    const geoError = new Error('Permission denied');
    mockGeolocation.getCurrentPosition = vi.fn((_success, error) => error(geoError));
    mockGeolocation.watchPosition = vi.fn((_success, error) => {
      error(geoError);
      return 888;
    });

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const geoResource = TestBed.runInInjectionContext(() =>
      injectGeolocationResource({ watch: false, reportToBoundary: true }),
    );

    TestBed.tick();
    await new Promise((r) => setTimeout(r, 0));
    TestBed.tick();
    expect(geoResource.error()).toBe(geoError);

    // Watch error
    geoResource.watch();
    TestBed.tick();
    await new Promise((r) => setTimeout(r, 0));
    TestBed.tick();
    expect(geoResource.error()).toBe(geoError);

    // getCurrent rejection
    await expect(geoResource.getCurrent()).rejects.toThrow('Permission denied');
  });

  it('should throw on getCurrent and report stream error when unsupported on server', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    const geoResource = TestBed.runInInjectionContext(() =>
      injectGeolocationResource({ reportToBoundary: true }),
    );
    expect(geoResource.isSupported()).toBe(false);
    TestBed.tick();
    await new Promise((r) => setTimeout(r, 0));
    expect(geoResource.error()).toBeInstanceOf(Error);
    await expect(geoResource.getCurrent()).rejects.toThrow(/Geolocation API not supported/);
  });
});
