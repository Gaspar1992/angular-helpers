import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { throttledSignal } from './throttled-signal';

describe('throttledSignal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should throw an error when called outside an injection context and no injector is provided', () => {
    const source = signal('initial');
    expect(() => throttledSignal(source, 100)).toThrow();
  });

  it('should throttle value updates with leading: true, trailing: true (defaults)', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.runInInjectionContext(() => {
      const source = signal('initial');
      const throttled = throttledSignal(source, 100);

      expect(throttled()).toBe('initial');

      // Update source at t=0
      source.set('update1');
      TestBed.flushEffects();
      // Leading: true, so updates immediately
      expect(throttled()).toBe('update1');

      // Update source at t=50 (during cooldown)
      vi.advanceTimersByTime(50);
      source.set('update2');
      TestBed.flushEffects();
      expect(throttled()).toBe('update1'); // should not update yet

      // Advance to end of cooldown (t=100)
      vi.advanceTimersByTime(50);
      expect(throttled()).toBe('update2'); // trailing: true, so emits scheduled value

      // Update source at t=150 (during new cooldown starting at t=100)
      vi.advanceTimersByTime(50);
      source.set('update3');
      TestBed.flushEffects();
      expect(throttled()).toBe('update2');

      // Advance to t=200
      vi.advanceTimersByTime(50);
      expect(throttled()).toBe('update3');
    });
  });

  it('should throttle value updates with leading: true, trailing: false', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.runInInjectionContext(() => {
      const source = signal('initial');
      const throttled = throttledSignal(source, 100, { leading: true, trailing: false });

      expect(throttled()).toBe('initial');

      // Update source at t=0
      source.set('update1');
      TestBed.flushEffects();
      expect(throttled()).toBe('update1');

      // Update source at t=50 (during cooldown)
      vi.advanceTimersByTime(50);
      source.set('update2');
      TestBed.flushEffects();
      expect(throttled()).toBe('update1');

      // Advance to t=100 (cooldown ends, but trailing is false, so update2 is ignored)
      vi.advanceTimersByTime(50);
      expect(throttled()).toBe('update1');

      // Update source at t=120 (cooldown is over, so leading change triggers immediately)
      vi.advanceTimersByTime(20);
      source.set('update3');
      TestBed.flushEffects();
      expect(throttled()).toBe('update3');
    });
  });

  it('should throttle value updates with leading: false, trailing: true', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.runInInjectionContext(() => {
      const source = signal('initial');
      const throttled = throttledSignal(source, 100, { leading: false, trailing: true });

      expect(throttled()).toBe('initial');

      // Update source at t=0
      source.set('update1');
      TestBed.flushEffects();
      // leading: false, so it doesn't emit immediately
      expect(throttled()).toBe('initial');

      // Update source at t=50
      vi.advanceTimersByTime(50);
      source.set('update2');
      TestBed.flushEffects();
      expect(throttled()).toBe('initial');

      // Advance to t=100 (timer fires)
      vi.advanceTimersByTime(50);
      expect(throttled()).toBe('update2');
    });
  });

  it('should support a custom injector', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const injector = TestBed.inject(EnvironmentInjector);
    const source = signal('initial');
    const throttled = throttledSignal(source, 100, { injector });

    expect(throttled()).toBe('initial');
  });

  it('should bypass scheduling timers in SSR context', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    TestBed.runInInjectionContext(() => {
      const source = signal('initial');
      const throttled = throttledSignal(source, 100);

      expect(throttled()).toBe('initial');

      source.set('ssr-update');
      TestBed.flushEffects();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  it('should clean up timers on destroy to prevent memory leaks', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);

    const source = signal('initial');

    runInInjectionContext(childInjector, () => {
      throttledSignal(source, 100);
    });

    // Update at t=0 (leading emits, schedules trailing check)
    source.set('changed1');
    TestBed.flushEffects();

    // Trigger a change during cooldown so a timer is scheduled for the trailing value
    vi.advanceTimersByTime(50);
    source.set('changed2');
    TestBed.flushEffects();

    expect(vi.getTimerCount()).toBe(1);

    childInjector.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });
});
