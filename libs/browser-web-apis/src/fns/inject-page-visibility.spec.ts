import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectPageVisibility } from './inject-page-visibility';

describe('injectPageVisibility', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectPageVisibility()).toThrow(/injectPageVisibility/);
  });

  it('should expose visibility signals in browser', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectPageVisibility();
      await new Promise((resolve) => queueMicrotask(resolve));

      expect(ref.state()).toBe('visible');
      expect(ref.isVisible()).toBe(true);
      expect(ref.isHidden()).toBe(false);
    });
  });

  it('should handle server platform', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    TestBed.runInInjectionContext(() => {
      const ref = injectPageVisibility();
      expect(ref.state()).toBe('visible');
      expect(ref.isVisible()).toBe(true);
    });
  });
});
