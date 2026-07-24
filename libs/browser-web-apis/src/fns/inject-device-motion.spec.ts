import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { injectDeviceMotion } from './inject-device-motion';
import { DeviceMotionService } from '../services/device-motion.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { DeviceMotionData } from '../utils/device-orientation.utils';

describe('injectDeviceMotion', () => {
  let mockService: any;

  beforeEach(() => {
    mockService = {
      isSupported: vi.fn().mockReturnValue(true),
      watch: vi.fn().mockReturnValue(
        of({
          acceleration: null,
          accelerationIncludingGravity: null,
          rotationRate: null,
          interval: 16,
        }),
      ),
      requestPermission: vi.fn().mockResolvedValue('granted'),
      permissionState: { asReadonly: () => {} },
    };
  });

  it('should throw an error when called outside an injection context', () => {
    expect(() => injectDeviceMotion()).toThrow(/injectDeviceMotion/);
  });

  it('should report isSupported as false when on server platform', async () => {
    mockService.isSupported.mockReturnValue(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: DeviceMotionService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectDeviceMotion();
      expect(ref.isSupported()).toBe(false);
    });
  });

  it('should report isSupported as true when supported in browser', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DeviceMotionService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectDeviceMotion();
      await new Promise((resolve) => queueMicrotask(resolve));
      expect(ref.isSupported()).toBe(true);
    });
  });

  it('should start and stop watching motion events', async () => {
    const mockData: DeviceMotionData = {
      acceleration: { x: 0, y: 0, z: 0 },
      accelerationIncludingGravity: { x: 0, y: 9.8, z: 0 },
      rotationRate: { alpha: 0, beta: 0, gamma: 0 },
      interval: 16,
    };
    mockService.watch.mockReturnValue(of(mockData));

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DeviceMotionService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectDeviceMotion();
      await new Promise((resolve) => queueMicrotask(resolve));

      ref.start();
      expect(ref.data()).toEqual(mockData);

      ref.stop();
    });
  });

  it('should request permissions and call service', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DeviceMotionService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectDeviceMotion();
      await new Promise((resolve) => queueMicrotask(resolve));

      const res = await ref.requestPermission();
      expect(res).toBe('granted');
      expect(mockService.requestPermission).toHaveBeenCalled();
    });
  });
});
