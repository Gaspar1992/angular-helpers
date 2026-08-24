import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
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

  it('should create resource and load position', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const geoResource = injectGeolocationResource();
      expect(geoResource.isSupported()).toBe(true);

      const pos = await geoResource.getCurrent();
      expect(pos).toEqual(mockPosition);

      geoResource.watch();
      expect(geoResource.watching()).toBe(true);

      geoResource.stop();
      expect(geoResource.watching()).toBe(false);
    });
  });

  it('should throw on getCurrent when unsupported on server', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const geoResource = injectGeolocationResource();
      expect(geoResource.isSupported()).toBe(false);
      await expect(geoResource.getCurrent()).rejects.toThrow(/Geolocation API not supported/);
    });
  });
});
