import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, ElementRef, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectResizeObserver } from './inject-resize-observer';

describe('injectResizeObserver', () => {
  let roCallback: any;

  beforeEach(() => {
    class MockResizeObserver {
      constructor(cb: any) {
        roCallback = cb;
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }

    vi.stubGlobal('ResizeObserver', MockResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    const el = document.createElement('div');
    expect(() => injectResizeObserver(el)).toThrow(/injectResizeObserver/);
  });

  it('should observe element size and expose computed signals', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.runInInjectionContext(() => {
      const el = document.createElement('div');
      const ref = injectResizeObserver(new ElementRef(el));

      expect(ref.size()).toBeNull();
      expect(ref.width()).toBe(0);
      expect(ref.height()).toBe(0);

      const entry = {
        contentRect: { width: 400, height: 200 },
        borderBoxSize: [{ inlineSize: 420, blockSize: 220 }],
      };
      roCallback([entry]);

      expect(ref.size()).toEqual({
        width: 400,
        height: 200,
        inlineSize: 420,
        blockSize: 220,
      });
      expect(ref.width()).toBe(400);
      expect(ref.height()).toBe(200);
      expect(ref.inlineSize()).toBe(420);
      expect(ref.blockSize()).toBe(220);
    });
  });

  it('should observe element signal', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.runInInjectionContext(() => {
      const elSignal = signal<HTMLElement | null>(null);
      const ref = injectResizeObserver(elSignal);

      const div = document.createElement('div');
      elSignal.set(div);
      TestBed.flushEffects();

      roCallback([{ contentRect: { width: 100, height: 50 } }]);
      expect(ref.width()).toBe(100);
    });
  });
});
