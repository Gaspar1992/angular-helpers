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

    vi.stubGlobal('DeviceMotionEvent', class {});
    vi.stubGlobal('isSecureContext', true);

    TestBed.configureTestingModule({
      providers: [
        DeviceMotionService,
        BrowserCapabilityService,
        { provide: NgZone, useValue: mockZone },
      ],
    });
    service = TestBed.inject(DeviceMotionService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and check isSupported', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
    expect(service.permissionState()).toBe('granted');
  });

  it('should initialize permissionState to prompt when requestPermission exists and request permission', async () => {
    const requestPermissionMock = vi.fn().mockResolvedValue('granted');
    vi.stubGlobal(
      'DeviceMotionEvent',
      Object.assign(class {}, { requestPermission: requestPermissionMock }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        DeviceMotionService,
        BrowserCapabilityService,
        { provide: NgZone, useValue: mockZone },
      ],
    });
    const promptService = TestBed.inject(DeviceMotionService);
    expect(promptService.permissionState()).toBe('prompt');

    const state = await promptService.requestPermission();
    expect(state).toBe('granted');
    expect(promptService.permissionState()).toBe('granted');
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

  it('should return denied permission and null stream in server environment', async () => {
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
    expect(ssrService.permissionState()).toBe('denied');
    expect(await ssrService.requestPermission()).toBe('denied');
    expect(await firstValueFrom(ssrService.watch())).toBeNull();
    expect(() => (ssrService as any).ensureSupported()).toThrow(/deviceMotion/);
  });
});
