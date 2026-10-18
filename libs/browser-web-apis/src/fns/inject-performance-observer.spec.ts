import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectPerformanceObserver } from './inject-performance-observer';

describe('injectPerformanceObserver', () => {
  let poCallback: any;

  beforeEach(() => {
    class MockPerformanceObserver {
      constructor(cb: any) {
        poCallback = cb;
      }
      observe = vi.fn();
      disconnect = vi.fn();
    }

    vi.stubGlobal('PerformanceObserver', MockPerformanceObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectPerformanceObserver({ type: 'mark' })).toThrow(/injectPerformanceObserver/);
  });

  it('should track performance entries via signals', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.runInInjectionContext(() => {
      const ref = injectPerformanceObserver({ type: 'mark' });
      expect(ref.entries()).toEqual([]);
      expect(ref.entryCount()).toBe(0);
      expect(ref.latestEntry()).toBeUndefined();

      const mockEntries = [{ name: 'mark1' }, { name: 'mark2' }] as any;
      poCallback({ getEntries: () => mockEntries });

      expect(ref.entries()).toEqual(mockEntries);
      expect(ref.entryCount()).toBe(2);
      expect(ref.latestEntry()?.name).toBe('mark2');

      const nextBatch = [{ name: 'mark3' }] as any;
      poCallback({ getEntries: () => nextBatch });

      expect(ref.entries()).toEqual([...mockEntries, ...nextBatch]);
      expect(ref.entryCount()).toBe(3);
      expect(ref.latestEntry()?.name).toBe('mark3');
    });
  });

  it('should not throw when browser does not support an observed entry type', () => {
    class ThrowingPerformanceObserver {
      observe() {
        throw new TypeError('Unsupported entry type');
      }
      disconnect = vi.fn();
    }
    vi.stubGlobal('PerformanceObserver', ThrowingPerformanceObserver);

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.runInInjectionContext(() => {
      expect(() =>
        injectPerformanceObserver({ type: 'event', durationThreshold: 16 }),
      ).not.toThrow();
    });
  });
});
