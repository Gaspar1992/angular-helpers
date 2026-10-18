import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { WINDOW, NAVIGATOR, createBrowserSignal } from './ssr.token';

describe('ssr.token', () => {
  describe('browser platform', () => {
    it('should provide native window and navigator in browser', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });

      expect(TestBed.inject(WINDOW)).toBe(window);
      expect(TestBed.inject(NAVIGATOR)).toBe(navigator);
    });

    it('should evaluate browserValueFn in createBrowserSignal when in browser', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });

      const browserFn = vi.fn(() => 'browser-val');
      TestBed.runInInjectionContext(() => {
        const sig = createBrowserSignal(browserFn, 'ssr-fallback');
        expect(sig()).toBe('browser-val');
        expect(browserFn).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('server platform (SSR)', () => {
    it('should provide empty mock objects for WINDOW and NAVIGATOR in SSR', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });

      const win = TestBed.inject(WINDOW);
      const nav = TestBed.inject(NAVIGATOR);
      expect(win).toEqual({});
      expect(nav).toEqual({});
    });

    it('should return ssrFallbackValue without calling browserValueFn in SSR', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });

      const browserFn = vi.fn(() => 'browser-val');
      TestBed.runInInjectionContext(() => {
        const sig = createBrowserSignal(browserFn, 'ssr-fallback');
        expect(sig()).toBe('ssr-fallback');
        expect(browserFn).not.toHaveBeenCalled();
      });
    });
  });
});
