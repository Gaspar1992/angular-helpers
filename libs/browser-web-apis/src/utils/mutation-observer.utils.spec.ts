import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isMutationObserverSupported, mutationObserverStream } from './mutation-observer.utils';

describe('mutation-observer.utils', () => {
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;
  let observerCallback: (mutations: MutationRecord[]) => void;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();

    class MockMutationObserver {
      constructor(callback: (mutations: MutationRecord[]) => void) {
        observerCallback = callback;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
    }

    vi.stubGlobal('MutationObserver', MockMutationObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('isMutationObserverSupported returns true when MutationObserver exists', () => {
    expect(isMutationObserverSupported()).toBe(true);
  });

  it('mutationObserverStream observes node and emits mutation records', () => {
    const node = document.createElement('div');
    const emitted: MutationRecord[][] = [];

    const sub = mutationObserverStream(node, { childList: true }).subscribe((m) => emitted.push(m));

    expect(mockObserve).toHaveBeenCalledWith(node, { childList: true });

    const records = [{ type: 'childList' } as MutationRecord];
    observerCallback(records);

    expect(emitted).toEqual([records]);

    sub.unsubscribe();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
