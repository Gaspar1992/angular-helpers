import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { injectBreakpoints } from './inject-breakpoints';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('injectBreakpoints', () => {
  let listeners: Record<string, Function[]> = {};
  let matchesValue: Record<string, boolean> = {};

  beforeEach(() => {
    listeners = {};
    matchesValue = {};

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query) => {
        if (!listeners[query]) {
          listeners[query] = [];
        }
        return {
          matches: matchesValue[query] ?? false,
          media: query,
          onchange: null,
          addEventListener: vi.fn().mockImplementation((event, listener) => {
            listeners[query].push(listener);
          }),
          removeEventListener: vi.fn().mockImplementation((event, listener) => {
            listeners[query] = listeners[query].filter((l) => l !== listener);
          }),
          dispatchEvent: vi.fn(),
        };
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw an error when called outside an injection context', () => {
    expect(() => injectBreakpoints({ xl: '(min-width: 1200px)' })).toThrow(/injectBreakpoints/);
  });

  it('should return default values on server platform', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const breakpoints = injectBreakpoints(
        { xl: '(min-width: 1200px)', md: '(min-width: 768px)' },
        { defaultValues: { xl: false, md: true } },
      );
      expect(breakpoints.xl()).toBe(false);
      expect(breakpoints.md()).toBe(true);
    });
  });

  it('should track multiple queries and update reactively', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      matchesValue['(min-width: 1200px)'] = false;
      matchesValue['(min-width: 768px)'] = true;

      const breakpoints = injectBreakpoints({
        xl: '(min-width: 1200px)',
        md: '(min-width: 768px)',
      });

      expect(breakpoints.xl()).toBe(false);
      expect(breakpoints.md()).toBe(true);

      // Change xl query to match
      matchesValue['(min-width: 1200px)'] = true;
      listeners['(min-width: 1200px)']?.forEach((l) => l({ matches: true } as MediaQueryListEvent));

      expect(breakpoints.xl()).toBe(true);
      expect(breakpoints.md()).toBe(true);
    });
  });
});
