import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectNetworkInformation } from './inject-network-information';

describe('injectNetworkInformation', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      onLine: true,
      connection: {
        type: 'wifi',
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectNetworkInformation()).toThrow(/injectNetworkInformation/);
  });

  it('should expose network signals in browser', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectNetworkInformation();
      await new Promise((resolve) => queueMicrotask(resolve));

      expect(ref.online()).toBe(true);
      expect(ref.type()).toBe('wifi');
      expect(ref.effectiveType()).toBe('4g');
      expect(ref.downlink()).toBe(10);
      expect(ref.rtt()).toBe(50);
      expect(ref.saveData()).toBe(false);
    });
  });

  it('should default on server platform', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    TestBed.runInInjectionContext(() => {
      const ref = injectNetworkInformation();
      expect(ref.online()).toBe(true);
      expect(ref.type()).toBeUndefined();
    });
  });
});
