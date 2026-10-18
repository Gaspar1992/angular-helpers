import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { injectBatteryResource } from './inject-battery-resource';

describe('injectBatteryResource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectBatteryResource()).toThrow(/injectBatteryResource/);
  });

  it('should create and return unsupported when not browser, setting error on resource', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const battery = TestBed.runInInjectionContext(() => injectBatteryResource());
    expect(battery.isSupported()).toBe(false);
    TestBed.tick();
    await new Promise((r) => setTimeout(r, 0));
    expect(battery.resource.error()).toBeInstanceOf(Error);
  });

  it('should load battery info, listen to events, and cleanup on refresh or destroy', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const listeners: Record<string, () => void> = {};
    const mockManager = {
      charging: true,
      level: 0.8,
      chargingTime: 100,
      dischargingTime: Infinity,
      addEventListener: vi.fn((ev: string, cb: () => void) => {
        listeners[ev] = cb;
      }),
      removeEventListener: vi.fn(),
    };

    vi.stubGlobal('navigator', {
      getBattery: vi.fn(() => Promise.resolve(mockManager)),
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);
    const battery = runInInjectionContext(childInjector, () => injectBatteryResource());

    expect(battery.isSupported()).toBe(true);
    TestBed.tick();
    await new Promise((r) => setTimeout(r, 0));
    TestBed.tick();

    expect(battery.info()).toEqual({
      charging: true,
      level: 0.8,
      chargingTime: 100,
      dischargingTime: Infinity,
    });
    expect(mockManager.addEventListener).toHaveBeenCalledTimes(4);

    // Trigger event update
    mockManager.level = 0.5;
    mockManager.charging = false;
    listeners['levelchange']?.();
    TestBed.tick();

    expect(battery.info()).toEqual({
      charging: false,
      level: 0.5,
      chargingTime: 100,
      dischargingTime: Infinity,
    });

    // Trigger refresh (aborts previous stream and starts new one)
    battery.refresh();
    TestBed.tick();
    await new Promise((r) => setTimeout(r, 0));
    expect(mockManager.removeEventListener).toHaveBeenCalled();

    // Destroy injector to trigger teardown cleanup
    childInjector.destroy();
  });

  it('should handle getBattery rejection', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    vi.stubGlobal('navigator', {
      getBattery: vi.fn(() => Promise.reject(new Error('Battery access denied'))),
    });

    const battery = TestBed.runInInjectionContext(() => injectBatteryResource());
    TestBed.tick();
    await new Promise((r) => setTimeout(r, 0));
    TestBed.tick();

    expect(battery.resource.error()).toBeInstanceOf(Error);
  });
});
