import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { injectBatteryResource } from './inject-battery-resource';
import { vi } from 'vitest';

describe('injectBatteryResource', () => {
  it('should create and return un-supported when not browser', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    TestBed.runInInjectionContext(() => {
      const battery = injectBatteryResource();
      expect(battery.isSupported()).toBe(false);
    });
  });

  it('should create and return resource in browser context', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    // Mock navigator.getBattery
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        getBattery: () =>
          Promise.resolve({
            charging: true,
            level: 1,
            chargingTime: 0,
            dischargingTime: Infinity,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          }),
      },
      writable: true,
      configurable: true,
    });

    TestBed.runInInjectionContext(() => {
      const battery = injectBatteryResource();
      expect(battery.isSupported()).toBe(true);
      expect(battery.resource.status()).toBeDefined();
    });
  });
});
