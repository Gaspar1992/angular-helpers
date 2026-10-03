import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isResizeObserverSupported,
  resizeObserverStream,
  resizeObserverEntriesStream,
} from './resize-observer.utils';

describe('resize-observer.utils', () => {
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockUnobserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;
  let observerCallback: (entries: Partial<ResizeObserverEntry>[]) => void;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockUnobserve = vi.fn();
    mockDisconnect = vi.fn();

    class MockResizeObserver {
      constructor(callback: any) {
        observerCallback = callback;
      }
      observe = mockObserve;
      unobserve = mockUnobserve;
      disconnect = mockDisconnect;
    }

    vi.stubGlobal('ResizeObserver', MockResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('isResizeObserverSupported returns true when ResizeObserver is available', () => {
    expect(isResizeObserverSupported()).toBe(true);
  });

  it('resizeObserverStream maps entries to ElementSize', () => {
    const el = document.createElement('div');
    const emitted: any[] = [];

    const sub = resizeObserverStream(el).subscribe((size) => emitted.push(size));

    expect(mockObserve).toHaveBeenCalledWith(el, {});

    observerCallback([
      {
        contentRect: { width: 300, height: 150 } as DOMRectReadOnly,
        borderBoxSize: [{ inlineSize: 310, blockSize: 160 } as ResizeObserverSize],
      } as unknown as ResizeObserverEntry,
    ]);

    expect(emitted).toEqual([
      {
        width: 300,
        height: 150,
        inlineSize: 310,
        blockSize: 160,
      },
    ]);

    sub.unsubscribe();
    expect(mockUnobserve).toHaveBeenCalledWith(el);
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('resizeObserverEntriesStream emits raw ResizeObserverEntry array', () => {
    const el = document.createElement('div');
    const emitted: any[] = [];

    const sub = resizeObserverEntriesStream(el).subscribe((entries) => emitted.push(entries));

    expect(mockObserve).toHaveBeenCalledWith(el, {});

    const mockEntries = [{ contentRect: { width: 100, height: 50 } } as any];
    observerCallback(mockEntries);

    expect(emitted).toEqual([mockEntries]);

    sub.unsubscribe();
    expect(mockUnobserve).toHaveBeenCalledWith(el);
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
