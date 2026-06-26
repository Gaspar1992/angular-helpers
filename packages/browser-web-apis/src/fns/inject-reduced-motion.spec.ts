import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { injectReducedMotion } from './inject-reduced-motion';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('injectReducedMotion', () => {
  let listeners: Function[] = [];
  let matchesValue = false;

  beforeEach(() => {
    listeners = [];
    matchesValue = false;

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? matchesValue : false,
        media: query,
        onchange: null,
        addEventListener: vi.fn().mockImplementation((event, listener) => {
          listeners.push(listener);
        }),
        removeEventListener: vi.fn().mockImplementation((event, listener) => {
          listeners = listeners.filter((l) => l !== listener);
        }),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw an error when called outside an injection context', () => {
    expect(() => injectReducedMotion()).toThrow(/injectReducedMotion/);
  });

  it('should return default value on server platform', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const isReducedDefault = injectReducedMotion();
      const isReducedCustom = injectReducedMotion({ defaultValue: true });
      expect(isReducedDefault()).toBe(false);
      expect(isReducedCustom()).toBe(true);
    });
  });

  it('should track prefers-reduced-motion: reduce and update reactively', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      matchesValue = false;
      const isReduced = injectReducedMotion();
      expect(isReduced()).toBe(false);

      // Simulate system reduced motion change
      matchesValue = true;
      listeners.forEach((l) => l({ matches: true } as MediaQueryListEvent));
      expect(isReduced()).toBe(true);
    });
  });
});
