import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, NgZone } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { DeviceOrientationService } from './device-orientation.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('DeviceOrientationService', () => {
  let service: DeviceOrientationService;
  let mockZone: NgZone;

  beforeEach(() => {
    mockZone = {
      runOutsideAngular: vi.fn((fn) => fn()),
      run: vi.fn((fn) => fn()),
    } as unknown as NgZone;

    TestBed.configureTestingModule({
      providers: [
        DeviceOrientationService,
        BrowserCapabilityService,
        { provide: NgZone, useValue: mockZone },
      ],
    });
    service = TestBed.inject(DeviceOrientationService);

    vi.stubGlobal('DeviceOrientationEvent', class {});
    vi.stubGlobal('isSecureContext', true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check isSupported', () => {
    expect(service.isSupported()).toBe(true);
  });

  it('should watch events and emit them', async () => {
    // We mock window.addEventListener
    const listeners: Record<string, EventListener> = {};
    const addEventListenerSpy = vi
      .spyOn(window, 'addEventListener')
      .mockImplementation((event, cb) => {
        listeners[event] = cb as EventListener;
      });

    const watch$ = service.watch();
    const promise = firstValueFrom(watch$);

    // trigger event
    if (listeners['deviceorientation']) {
      listeners['deviceorientation']({
        alpha: 90,
        beta: 45,
        gamma: 0,
        absolute: true,
      } as unknown as Event);
    }

    const val = await promise;
    expect(val).toEqual({
      alpha: 90,
      beta: 45,
      gamma: 0,
      absolute: true,
    });

    addEventListenerSpy.mockRestore();
  });

  it('should return null in server environment', () => {
    // Configure TestBed for SSR
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        DeviceOrientationService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const ssrService = TestBed.inject(DeviceOrientationService);
    expect(ssrService.isSupported()).toBe(false);
  });
});
