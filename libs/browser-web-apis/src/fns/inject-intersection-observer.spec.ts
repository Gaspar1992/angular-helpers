import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, ElementRef, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectIntersectionObserver } from './inject-intersection-observer';

describe('injectIntersectionObserver', () => {
  let ioCallback: any;

  beforeEach(() => {
    class MockIntersectionObserver {
      constructor(cb: any) {
        ioCallback = cb;
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    const el = document.createElement('div');
    expect(() => injectIntersectionObserver(el)).toThrow(/injectIntersectionObserver/);
  });

  it('should observe standard element and ElementRef', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.runInInjectionContext(() => {
      const el = document.createElement('div');
      const ref = injectIntersectionObserver(new ElementRef(el));

      expect(ref.isIntersecting()).toBe(false);
      expect(ref.isVisible()).toBe(false);

      ioCallback([{ isIntersecting: true }]);
      expect(ref.isIntersecting()).toBe(true);
      expect(ref.isVisible()).toBe(true);
    });
  });

  it('should observe element passed as a signal', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const elSignal = signal<HTMLElement | null>(null);
      const ref = injectIntersectionObserver(elSignal);

      const div = document.createElement('div');
      elSignal.set(div);

      // Allow effect to run
      TestBed.flushEffects();

      ioCallback([{ isIntersecting: true }]);
      expect(ref.isIntersecting()).toBe(true);
    });
  });
});
