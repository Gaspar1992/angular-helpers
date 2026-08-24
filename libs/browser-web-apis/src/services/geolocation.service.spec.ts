import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GeolocationService } from './geolocation.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('GeolocationService', () => {
  let service: GeolocationService;
  let mockGeolocation: any;
  let mockPosition: any;

  beforeEach(() => {
    mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: 1234567890,
    };

    mockGeolocation = {
      getCurrentPosition: vi.fn((success) => success(mockPosition)),
      watchPosition: vi.fn((success) => {
        success(mockPosition);
        return 42;
      }),
      clearWatch: vi.fn(),
    };

    vi.stubGlobal('navigator', {
      geolocation: mockGeolocation,
    });

    TestBed.configureTestingModule({
      providers: [GeolocationService, BrowserCapabilityService],
    });
    service = TestBed.inject(GeolocationService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should get current position', async () => {
    const pos = await service.getCurrentPosition();
    expect(pos).toEqual(mockPosition);
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
  });

  it('should reject when getCurrentPosition errors', async () => {
    const geoError = new Error('User denied Geolocation');
    mockGeolocation.getCurrentPosition = vi.fn((success, error) => error(geoError));
    await expect(service.getCurrentPosition()).rejects.toThrow('User denied Geolocation');
  });

  it('should watch position and clean up on unsubscribe', async () => {
    const pos$ = service.watchPosition();
    const pos = await firstValueFrom(pos$);
    expect(pos).toEqual(mockPosition);

    const sub = pos$.subscribe();
    sub.unsubscribe();
    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(42);
  });

  it('should emit error on watchPosition error callback', async () => {
    const geoError = new Error('Position unavailable');
    mockGeolocation.watchPosition = vi.fn((success, error) => {
      error(geoError);
      return 99;
    });

    await expect(firstValueFrom(service.watchPosition())).rejects.toThrow('Position unavailable');
  });

  it('should clear watch by id', () => {
    service.clearWatch(123);
    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(123);
  });

  it('should get native geolocation', () => {
    expect(service.getNativeGeolocation()).toBe(mockGeolocation);
  });

  it('should throw when on server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        GeolocationService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(GeolocationService);
    expect(serverService.isSupported()).toBe(false);
    expect(() => serverService.getCurrentPosition()).toThrow(/server environment/);
    expect(() => serverService.getNativeGeolocation()).toThrow(/server environment/);
  });
});
