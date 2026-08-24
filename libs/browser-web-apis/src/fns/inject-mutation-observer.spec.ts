import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, ElementRef, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectMutationObserver } from './inject-mutation-observer';

describe('injectMutationObserver', () => {
  let moCallback: any;

  beforeEach(() => {
    class MockMutationObserver {
      constructor(cb: any) {
        moCallback = cb;
      }
      observe = vi.fn();
      disconnect = vi.fn();
    }

    vi.stubGlobal('MutationObserver', MockMutationObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    const el = document.createElement('div');
    expect(() => injectMutationObserver(el)).toThrow(/injectMutationObserver/);
  });

  it('should observe element mutations', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.runInInjectionContext(() => {
      const el = document.createElement('div');
      const ref = injectMutationObserver(new ElementRef(el));

      expect(ref.mutations()).toEqual([]);
      expect(ref.mutationCount()).toBe(0);

      moCallback([{ type: 'childList' }, { type: 'attributes' }]);
      expect(ref.mutationCount()).toBe(2);
    });
  });

  it('should observe element signal', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    TestBed.runInInjectionContext(() => {
      const elSignal = signal<HTMLElement | null>(null);
      const ref = injectMutationObserver(elSignal);

      const div = document.createElement('div');
      elSignal.set(div);
      TestBed.flushEffects();

      moCallback([{ type: 'childList' }]);
      expect(ref.mutationCount()).toBe(1);
    });
  });
});
