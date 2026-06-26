import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { timerSignal } from './timer-signal';

describe('timerSignal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should throw an error when called outside an injection context and no injector is provided', () => {
    expect(() => timerSignal(100)).toThrow();
  });

  it('should start with 0 and emit 1 after the specified delay', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.runInInjectionContext(() => {
      const timer = timerSignal(100);

      expect(timer()).toBe(0);

      // Advance time by 50ms
      vi.advanceTimersByTime(50);
      expect(timer()).toBe(0);

      // Advance remaining time
      vi.advanceTimersByTime(50);
      expect(timer()).toBe(1);

      // Advance more time (no interval, so should remain 1)
      vi.advanceTimersByTime(100);
      expect(timer()).toBe(1);
    });
  });

  it('should tick periodically if an interval is provided', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.runInInjectionContext(() => {
      const timer = timerSignal(100, 200);

      expect(timer()).toBe(0);

      // Advance to delay (t=100)
      vi.advanceTimersByTime(100);
      expect(timer()).toBe(1);

      // Advance to delay + interval (t=300)
      vi.advanceTimersByTime(200);
      expect(timer()).toBe(2);

      // Advance to delay + 2*interval (t=500)
      vi.advanceTimersByTime(200);
      expect(timer()).toBe(3);
    });
  });

  it('should support a custom injector', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const injector = TestBed.inject(EnvironmentInjector);
    const timer = timerSignal(100, undefined, { injector });

    expect(timer()).toBe(0);
  });

  it('should bypass scheduling timers in SSR context', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    TestBed.runInInjectionContext(() => {
      const timer = timerSignal(100, 200);

      expect(timer()).toBe(0);

      vi.advanceTimersByTime(500);
      expect(timer()).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  it('should clean up timers on destroy to prevent memory leaks', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);

    runInInjectionContext(childInjector, () => {
      timerSignal(100, 200);
    });

    expect(vi.getTimerCount()).toBe(1);

    // Destroy during delay
    childInjector.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('should clean up repeating interval timer on destroy', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);

    let timer;

    runInInjectionContext(childInjector, () => {
      timer = timerSignal(100, 200);
    });

    // Advance to delay (t=100), transitioning from timeout to interval
    vi.advanceTimersByTime(100);
    expect(timer()).toBe(1);
    expect(vi.getTimerCount()).toBe(1);

    // Destroy during interval
    childInjector.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });
});
