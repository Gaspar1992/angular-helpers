import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isIntersectionObserverSupported,
  intersectionObserverStream,
  intersectionObserverEntriesStream,
} from './intersection-observer.utils';

describe('intersection-observer.utils', () => {
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockUnobserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;
  let observerCallback: (entries: Partial<IntersectionObserverEntry>[]) => void;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockUnobserve = vi.fn();
    mockDisconnect = vi.fn();

    class MockIntersectionObserver {
      constructor(callback: any) {
        observerCallback = callback;
      }
      observe = mockObserve;
      unobserve = mockUnobserve;
      disconnect = mockDisconnect;
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('isIntersectionObserverSupported returns true when IntersectionObserver is on window', () => {
    expect(isIntersectionObserverSupported()).toBe(true);
  });

  it('intersectionObserverStream observes element and emits isIntersecting boolean', () => {
    const el = document.createElement('div');
    const emitted: boolean[] = [];

    const sub = intersectionObserverStream(el).subscribe((val) => emitted.push(val));

    expect(mockObserve).toHaveBeenCalledWith(el);

    observerCallback([{ isIntersecting: true } as IntersectionObserverEntry]);
    observerCallback([{ isIntersecting: false } as IntersectionObserverEntry]);

    expect(emitted).toEqual([true, false]);

    sub.unsubscribe();
    expect(mockUnobserve).toHaveBeenCalledWith(el);
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('intersectionObserverEntriesStream observes element and emits full entries array', () => {
    const el = document.createElement('div');
    const emitted: IntersectionObserverEntry[][] = [];

    const sub = intersectionObserverEntriesStream(el).subscribe((entries) => emitted.push(entries));

    expect(mockObserve).toHaveBeenCalledWith(el);

    const mockEntries = [{ isIntersecting: true } as IntersectionObserverEntry];
    observerCallback(mockEntries);

    expect(emitted).toEqual([mockEntries]);

    sub.unsubscribe();
    expect(mockUnobserve).toHaveBeenCalledWith(el);
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
