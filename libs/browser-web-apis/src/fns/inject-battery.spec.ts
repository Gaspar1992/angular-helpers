import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectBattery } from './inject-battery';

describe('injectBattery', () => {
  let mockBattery: any;
  let eventListeners: Record<string, Set<() => void>>;

  beforeEach(() => {
    eventListeners = {
      chargingchange: new Set(),
      levelchange: new Set(),
      chargingtimechange: new Set(),
      dischargingtimechange: new Set(),
    };

    mockBattery = {
      charging: false,
      level: 0.5,
      chargingTime: 0,
      dischargingTime: 3600,
      addEventListener: vi.fn((event: string, cb: () => void) => {
        eventListeners[event]?.add(cb);
      }),
      removeEventListener: vi.fn((event: string, cb: () => void) => {
        eventListeners[event]?.delete(cb);
      }),
    };

    vi.stubGlobal('navigator', {
      getBattery: vi.fn().mockResolvedValue(mockBattery),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectBattery()).toThrow(/injectBattery/);
  });

  it('should get battery snapshot and handle events', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectBattery();
      await new Promise((resolve) => queueMicrotask(resolve));

      expect(ref.isSupported()).toBe(true);

      await ref.refresh();
      expect(ref.info()).toEqual({
        charging: false,
        level: 0.5,
        chargingTime: 0,
        dischargingTime: 3600,
      });

      // Update state and trigger levelchange
      mockBattery.level = 0.75;
      eventListeners['levelchange'].forEach((cb) => cb());

      expect(ref.info()?.level).toBe(0.75);
    });
  });

  it('should handle getBattery rejection', async () => {
    vi.stubGlobal('navigator', {
      getBattery: vi.fn().mockRejectedValue(new Error('Battery status access blocked')),
    });

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectBattery();
      await new Promise((resolve) => queueMicrotask(resolve));

      await ref.refresh();
      expect(ref.error()).toBe('Battery status access blocked');
    });
  });

  it('should handle server platform gracefully', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    TestBed.runInInjectionContext(() => {
      const ref = injectBattery();
      expect(ref.isSupported()).toBe(false);
      expect(ref.info()).toBeNull();
    });
  });
});
