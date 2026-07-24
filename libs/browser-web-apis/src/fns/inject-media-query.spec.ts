import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { injectMediaQuery } from './inject-media-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('injectMediaQuery', () => {
  let listeners: Function[] = [];
  let matchesValue = false;
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;

  beforeEach(() => {
    listeners = [];
    matchesValue = false;
    addEventListenerSpy = vi.fn((event, listener) => {
      listeners.push(listener);
    });
    removeEventListenerSpy = vi.fn((event, listener) => {
      listeners = listeners.filter((l) => l !== listener);
    });

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query) => ({
        matches: matchesValue,
        media: query,
        onchange: null,
        addEventListener: addEventListenerSpy,
        removeEventListener: removeEventListenerSpy,
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw an error when called outside an injection context', () => {
    expect(() => injectMediaQuery('(min-width: 768px)')).toThrow(/injectMediaQuery/);
  });

  it('should return defaultValue on server platform', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const signalDefault = injectMediaQuery('(min-width: 768px)');
      const signalCustom = injectMediaQuery('(min-width: 768px)', { defaultValue: true });
      expect(signalDefault()).toBe(false);
      expect(signalCustom()).toBe(true);
    });
  });

  it('should evaluate media query and update signal when change is fired', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      matchesValue = false;
      const mediaSignal = injectMediaQuery('(min-width: 768px)');
      expect(mediaSignal()).toBe(false);
      expect(addEventListenerSpy).toHaveBeenCalled();

      // Simulate viewport change
      matchesValue = true;
      listeners.forEach((l) => l({ matches: true } as MediaQueryListEvent));
      expect(mediaSignal()).toBe(true);
    });
  });

  it('should cleanup the listener on destroy', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);
    runInInjectionContext(childInjector, () => {
      const mediaSignal = injectMediaQuery('(min-width: 768px)');
      expect(mediaSignal).toBeDefined();
    });

    expect(addEventListenerSpy).toHaveBeenCalled();
    expect(removeEventListenerSpy).not.toHaveBeenCalled();

    childInjector.destroy();
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});
