import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { injectWindowScroll } from './inject-window-scroll';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('injectWindowScroll', () => {
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;
  let eventListeners: Record<string, Function[]> = {};

  beforeEach(() => {
    eventListeners = {};
    addEventListenerSpy = vi
      .spyOn(window, 'addEventListener')
      .mockImplementation((event, listener, options) => {
        if (!eventListeners[event]) {
          eventListeners[event] = [];
        }
        eventListeners[event].push(listener as Function);
      });

    removeEventListenerSpy = vi
      .spyOn(window, 'removeEventListener')
      .mockImplementation((event, listener, options) => {
        if (eventListeners[event]) {
          eventListeners[event] = eventListeners[event].filter((l) => l !== listener);
        }
      });

    // Mock scrollX and scrollY
    vi.stubGlobal('scrollX', 0);
    vi.stubGlobal('scrollY', 0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should throw an error when called outside an injection context', () => {
    expect(() => injectWindowScroll()).toThrow(/injectWindowScroll/);
  });

  it('should return initial zeros on server platform', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const scroll = injectWindowScroll();
      expect(scroll()).toEqual({ x: 0, y: 0 });
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });
  });

  it('should track scroll position reactively and use passive listener', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const scroll = injectWindowScroll();
      expect(scroll()).toEqual({ x: 0, y: 0 });

      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
        passive: true,
      });

      // Change mocked scroll coordinates
      vi.stubGlobal('scrollX', 50);
      vi.stubGlobal('scrollY', 150);

      // Trigger scroll event
      eventListeners['scroll']?.forEach((l) => l());

      expect(scroll()).toEqual({ x: 50, y: 150 });
    });
  });

  it('should cleanup the listener on destroy', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);
    runInInjectionContext(childInjector, () => {
      const scroll = injectWindowScroll();
      expect(scroll).toBeDefined();
    });

    expect(addEventListenerSpy).toHaveBeenCalled();
    expect(removeEventListenerSpy).not.toHaveBeenCalled();

    childInjector.destroy();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
