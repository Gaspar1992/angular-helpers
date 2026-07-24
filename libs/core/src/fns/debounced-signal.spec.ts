import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { debouncedSignal } from './debounced-signal';

describe('debouncedSignal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should throw an error when called outside an injection context and no injector is provided', () => {
    const source = signal('initial');
    expect(() => debouncedSignal(source, 100)).toThrow();
  });

  it('should debounce value updates', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.runInInjectionContext(() => {
      const source = signal('initial');
      const debounced = debouncedSignal(source, 100);

      expect(debounced()).toBe('initial');

      // Update source
      source.set('update1');
      TestBed.flushEffects();
      // Should still be initial before timer runs
      expect(debounced()).toBe('initial');

      // Advance time by 50ms
      vi.advanceTimersByTime(50);
      expect(debounced()).toBe('initial');

      // Advance remaining time
      vi.advanceTimersByTime(50);
      expect(debounced()).toBe('update1');
    });
  });

  it('should only emit the latest value after multiple rapid changes (debouncing)', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.runInInjectionContext(() => {
      const source = signal('initial');
      const debounced = debouncedSignal(source, 100);

      source.set('change1');
      TestBed.flushEffects();
      vi.advanceTimersByTime(50);

      source.set('change2');
      TestBed.flushEffects();
      vi.advanceTimersByTime(50); // total 100ms since start, but only 50ms since change2
      expect(debounced()).toBe('initial');

      vi.advanceTimersByTime(50); // total 100ms since change2
      expect(debounced()).toBe('change2');
    });
  });

  it('should support a custom injector', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const injector = TestBed.inject(EnvironmentInjector);
    const source = signal('initial');
    // Call outside injection context but passing custom injector
    const debounced = debouncedSignal(source, 100, { injector });

    expect(debounced()).toBe('initial');
  });

  it('should bypass scheduling timers in SSR context', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    TestBed.runInInjectionContext(() => {
      const source = signal('initial');
      const debounced = debouncedSignal(source, 100);

      expect(debounced()).toBe('initial');

      // SSR shouldn't schedule timeouts, so even if we update source, it should update synchronously or not at all depending on SSR policy.
      // Usually, in SSR we just return the initial value or follow the source immediately.
      // Let's check: the design says: "Fake injectPlatform().isBrowser to false and assert timers are skipped, returning initial value immediately."
      source.set('ssr-update');
      TestBed.flushEffects();
      // Since timers are bypassed, the value should not change or it changes immediately without timers. Let's design it to either keep initial value or track immediately.
      // Let's assert that no timers were scheduled.
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
    let debounced;

    runInInjectionContext(childInjector, () => {
      debounced = debouncedSignal(source, 100);
    });

    source.set('changed');
    TestBed.flushEffects();
    expect(vi.getTimerCount()).toBe(1);

    childInjector.destroy();
    expect(vi.getTimerCount()).toBe(0);
    expect(debounced()).toBe('initial');
  });
});
