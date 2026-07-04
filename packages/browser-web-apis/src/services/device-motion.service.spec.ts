import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, NgZone } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DeviceMotionService } from './device-motion.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('DeviceMotionService', () => {
  let service: DeviceMotionService;
  let mockZone: NgZone;

  beforeEach(() => {
    mockZone = {
      runOutsideAngular: vi.fn((fn) => fn()),
      run: vi.fn((fn) => fn()),
    } as unknown as NgZone;

    TestBed.configureTestingModule({
      providers: [
        DeviceMotionService,
        BrowserCapabilityService,
        { provide: NgZone, useValue: mockZone },
      ],
    });
    service = TestBed.inject(DeviceMotionService);

    vi.stubGlobal('DeviceMotionEvent', class {});
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
    const listeners: Record<string, EventListener> = {};
    const addEventListenerSpy = vi
      .spyOn(window, 'addEventListener')
      .mockImplementation((event, cb) => {
        listeners[event] = cb as EventListener;
      });

    const watch$ = service.watch();
    const promise = firstValueFrom(watch$);

    if (listeners['devicemotion']) {
      listeners['devicemotion']({
        acceleration: { x: 1, y: 2, z: 3 },
        accelerationIncludingGravity: { x: 4, y: 5, z: 6 },
        rotationRate: { alpha: 7, beta: 8, gamma: 9 },
        interval: 16,
      } as unknown as Event);
    }

    const val = await promise;
    expect(val).toEqual({
      acceleration: { x: 1, y: 2, z: 3 },
      accelerationIncludingGravity: { x: 4, y: 5, z: 6 },
      rotationRate: { alpha: 7, beta: 8, gamma: 9 },
      interval: 16,
    });

    addEventListenerSpy.mockRestore();
  });

  it('should return null in server environment', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        DeviceMotionService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const ssrService = TestBed.inject(DeviceMotionService);
    expect(ssrService.isSupported()).toBe(false);
  });
});
