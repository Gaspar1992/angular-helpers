import { TestBed } from '@angular/core/testing';
import {
  PLATFORM_ID,
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { injectMousePosition } from './inject-mouse-position';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('injectMousePosition', () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw an error when called outside an injection context', () => {
    expect(() => injectMousePosition()).toThrow(/injectMousePosition/);
  });

  it('should return initial zeros on server platform', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const position = injectMousePosition();
      expect(position()).toEqual({
        x: 0,
        y: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        screenX: 0,
        screenY: 0,
      });
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });
  });

  it('should track mouse position reactively and use passive listener', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const position = injectMousePosition();
      expect(position()).toEqual({
        x: 0,
        y: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        screenX: 0,
        screenY: 0,
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function), {
        passive: true,
      });

      // Trigger mousemove event
      const mockEvent = {
        clientX: 10,
        clientY: 20,
        pageX: 15,
        pageY: 25,
        screenX: 100,
        screenY: 200,
      };

      eventListeners['mousemove']?.forEach((l) => l(mockEvent));

      expect(position()).toEqual({
        x: 10,
        y: 20,
        clientX: 10,
        clientY: 20,
        pageX: 15,
        pageY: 25,
        screenX: 100,
        screenY: 200,
      });
    });
  });

  it('should cleanup the listener on destroy', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector([], parentInjector);
    runInInjectionContext(childInjector, () => {
      const position = injectMousePosition();
      expect(position).toBeDefined();
    });

    expect(addEventListenerSpy).toHaveBeenCalled();
    expect(removeEventListenerSpy).not.toHaveBeenCalled();

    childInjector.destroy();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
  });
});
