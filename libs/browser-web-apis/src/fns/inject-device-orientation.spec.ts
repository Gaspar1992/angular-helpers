import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { injectDeviceOrientation } from './inject-device-orientation';
import { DeviceOrientationService } from '../services/device-orientation.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { DeviceOrientationData } from '../utils/device-orientation.utils';

describe('injectDeviceOrientation', () => {
  let mockService: any;

  beforeEach(() => {
    mockService = {
      isSupported: vi.fn().mockReturnValue(true),
      watch: vi.fn().mockReturnValue(of({ alpha: 1, beta: 2, gamma: 3, absolute: true })),
      requestPermission: vi.fn().mockResolvedValue('granted'),
      permissionState: { asReadonly: () => {} },
    };
  });

  it('should throw an error when called outside an injection context', () => {
    expect(() => injectDeviceOrientation()).toThrow(/injectDeviceOrientation/);
  });

  it('should report isSupported as false when on server platform', async () => {
    mockService.isSupported.mockReturnValue(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: DeviceOrientationService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectDeviceOrientation();
      expect(ref.isSupported()).toBe(false);
    });
  });

  it('should report isSupported as true when supported in browser', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DeviceOrientationService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectDeviceOrientation();
      await new Promise((resolve) => queueMicrotask(resolve));
      expect(ref.isSupported()).toBe(true);
    });
  });

  it('should start and stop watching orientation events', async () => {
    const mockData: DeviceOrientationData = { alpha: 10, beta: 20, gamma: 30, absolute: true };
    mockService.watch.mockReturnValue(of(mockData));

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DeviceOrientationService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectDeviceOrientation();
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
        { provide: DeviceOrientationService, useValue: mockService },
      ],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectDeviceOrientation();
      await new Promise((resolve) => queueMicrotask(resolve));

      const res = await ref.requestPermission();
      expect(res).toBe('granted');
      expect(mockService.requestPermission).toHaveBeenCalled();
    });
  });
});
