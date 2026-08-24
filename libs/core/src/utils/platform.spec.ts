import { describe, it, expect, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  runInInjectionContext,
  createEnvironmentInjector,
  EnvironmentInjector,
} from '@angular/core';
import * as coreUtils from '@angular-helpers/core/utils';
import { injectPlatform, isPlatformBrowser, isPlatformServer, getGlobalWindow } from './platform';

describe('injectPlatform', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fall back to pure platform detection outside of injection context (browser)', () => {
    const platform = injectPlatform();
    expect(platform).toBeDefined();
    expect(typeof platform.isBrowser).toBe('boolean');
    expect(typeof platform.isServer).toBe('boolean');
    expect(platform.isBrowser).not.toBe(platform.isServer);
    expect(platform.window).toBe(window);
    expect(platform.document).toBe(document);
  });

  it('should fall back to pure platform detection outside of injection context (server fallback)', () => {
    vi.spyOn(coreUtils, 'isPlatformBrowser').mockReturnValue(false);

    const platform = injectPlatform();
    expect(platform.isBrowser).toBe(false);
    expect(platform.isServer).toBe(true);
    expect(platform.window).toBeNull();
    expect(platform.document).toBeNull();
  });

  it('should detect browser platform when inside injection context', () => {
    const parentInjector = TestBed.inject(EnvironmentInjector);
    const envInjector = createEnvironmentInjector(
      [{ provide: PLATFORM_ID, useValue: 'browser' }],
      parentInjector,
    );

    runInInjectionContext(envInjector, () => {
      const platform = injectPlatform();
      expect(platform.isBrowser).toBe(true);
      expect(platform.isServer).toBe(false);
      expect(platform.window).toBeDefined();
      expect(platform.document).toBeDefined();
    });
  });

  it('should detect server platform when inside injection context', () => {
    const parentInjector = TestBed.inject(EnvironmentInjector);
    const envInjector = createEnvironmentInjector(
      [{ provide: PLATFORM_ID, useValue: 'server' }],
      parentInjector,
    );

    runInInjectionContext(envInjector, () => {
      const platform = injectPlatform();
      expect(platform.isBrowser).toBe(false);
      expect(platform.isServer).toBe(true);
      expect(platform.window).toBeNull();
      expect(platform.document).toBeNull();
    });
  });

  it('should re-export platform helper utilities', () => {
    expect(isPlatformBrowser).toBeDefined();
    expect(isPlatformServer).toBeDefined();
    expect(getGlobalWindow).toBeDefined();
  });
});
