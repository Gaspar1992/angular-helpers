import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isPerformanceObserverSupported,
  performanceObserverStream,
} from './performance-observer.utils';

describe('performance-observer.utils', () => {
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;
  let observerCallback: (list: { getEntries: () => PerformanceEntry[] }) => void;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();

    class MockPerformanceObserver {
      constructor(callback: any) {
        observerCallback = callback;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
    }

    vi.stubGlobal('PerformanceObserver', MockPerformanceObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('isPerformanceObserverSupported returns true when PerformanceObserver exists', () => {
    expect(isPerformanceObserverSupported()).toBe(true);
  });

  it('performanceObserverStream observes single type and emits entries', () => {
    const emitted: any[] = [];
    const sub = performanceObserverStream({ type: 'paint', buffered: true }).subscribe((e) =>
      emitted.push(e),
    );

    expect(mockObserve).toHaveBeenCalledWith({ type: 'paint', buffered: true });

    const mockEntries = [{ name: 'first-paint', entryType: 'paint', startTime: 120 }];
    observerCallback({ getEntries: () => mockEntries as any });

    expect(emitted).toEqual([mockEntries]);

    sub.unsubscribe();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('performanceObserverStream observes multiple entryTypes', () => {
    const sub = performanceObserverStream({ entryTypes: ['mark', 'measure'] }).subscribe();
    expect(mockObserve).toHaveBeenCalledWith({ entryTypes: ['mark', 'measure'] });
    sub.unsubscribe();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
