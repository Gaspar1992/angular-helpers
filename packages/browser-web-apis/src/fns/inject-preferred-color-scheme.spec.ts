import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { injectPreferredColorScheme } from './inject-preferred-color-scheme';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('injectPreferredColorScheme', () => {
  let listeners: Function[] = [];
  let matchesValue = false;

  beforeEach(() => {
    listeners = [];
    matchesValue = false;

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)' ? matchesValue : false,
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
    expect(() => injectPreferredColorScheme()).toThrow(/injectPreferredColorScheme/);
  });

  it('should return default value on server platform', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const isDarkDefault = injectPreferredColorScheme();
      const isDarkCustom = injectPreferredColorScheme({ defaultValue: true });
      expect(isDarkDefault()).toBe(false);
      expect(isDarkCustom()).toBe(true);
    });
  });

  it('should track prefers-color-scheme: dark and update reactively', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      matchesValue = false;
      const isDark = injectPreferredColorScheme();
      expect(isDark()).toBe(false);

      // Simulate system color scheme change to dark
      matchesValue = true;
      listeners.forEach((l) => l({ matches: true } as MediaQueryListEvent));
      expect(isDark()).toBe(true);
    });
  });
});
