import { describe, expect, it, beforeEach, vi } from 'vitest';
import { StorageNamespaceImpl, type StorageEvent } from './storage-namespace';
import type { BrowserApiLogger } from '../tokens/logger.token';
import { Subject } from 'rxjs';

const noopLogger: BrowserApiLogger = {
  info: () => {},
  warn: vi.fn(),
  error: vi.fn(),
};

class FakeStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

class ThrowingStorage implements Storage {
  length = 0;
  clear(): void {
    throw new DOMException('SecurityError', 'SecurityError');
  }
  getItem(): string | null {
    throw new DOMException('SecurityError', 'SecurityError');
  }
  key(): string | null {
    throw new DOMException('SecurityError', 'SecurityError');
  }
  removeItem(): void {
    throw new DOMException('SecurityError', 'SecurityError');
  }
  setItem(): void {
    throw new DOMException('SecurityError', 'SecurityError');
  }
}

function makeBus() {
  const subject = new Subject<StorageEvent>();
  return {
    emit: (e: StorageEvent) => subject.next(e),
    events$: subject.asObservable(),
  };
}

function setupWindow(localStore: Storage, sessionStore: Storage) {
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage: localStore, sessionStorage: sessionStore },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'Storage', {
    value: function Storage() {},
    writable: true,
    configurable: true,
  });
}

describe('StorageNamespaceImpl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('set/get round-trip with JSON serialization', () => {
    const store = new FakeStorage();
    setupWindow(store, store);
    const ns = new StorageNamespaceImpl('localStorage', makeBus(), noopLogger);
    expect(ns.set('user', { id: 1, name: 'a' })).toBe(true);
    expect(ns.get<{ id: number; name: string }>('user')).toEqual({ id: 1, name: 'a' });
  });

  it('returns default value when key missing', () => {
    setupWindow(new FakeStorage(), new FakeStorage());
    const ns = new StorageNamespaceImpl('localStorage', makeBus(), noopLogger);
    expect(ns.get('missing', 'fallback')).toBe('fallback');
  });

  it('falls back to default when storage throws SecurityError', () => {
    const throwing = new ThrowingStorage();
    setupWindow(throwing, throwing);
    const ns = new StorageNamespaceImpl('localStorage', makeBus(), noopLogger);
    expect(ns.isSupported()).toBe(false);
    expect(ns.get('k', 'fallback')).toBe('fallback');
    expect(ns.set('k', 'v')).toBe(false);
    expect(noopLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('access denied (SecurityError)'),
    );
  });

  it('caches isSupported result', () => {
    const store = new FakeStorage();
    const setItem = vi.spyOn(store, 'setItem');
    setupWindow(store, store);
    const ns = new StorageNamespaceImpl('localStorage', makeBus(), noopLogger);
    ns.isSupported();
    ns.isSupported();
    ns.isSupported();
    // Probe should run only once
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it('respects prefix on set/get/remove/size/clear', () => {
    const store = new FakeStorage();
    setupWindow(store, store);
    const ns = new StorageNamespaceImpl('localStorage', makeBus(), noopLogger);
    ns.set('a', 1, { prefix: 'app' });
    ns.set('b', 2, { prefix: 'app' });
    ns.set('c', 3); // no prefix
    expect(ns.get('a', null, { prefix: 'app' })).toBe(1);
    expect(ns.size({ prefix: 'app' })).toBeGreaterThan(0);
    ns.clear({ prefix: 'app' });
    expect(ns.get('a', null, { prefix: 'app' })).toBeNull();
    expect(ns.get('c')).toBe(3);
  });

  it('emits events on set / remove / clear', () => {
    const events: StorageEvent[] = [];
    const subject = new Subject<StorageEvent>();
    subject.subscribe((e) => events.push(e));
    const bus = { emit: (e: StorageEvent) => subject.next(e), events$: subject.asObservable() };
    setupWindow(new FakeStorage(), new FakeStorage());
    const ns = new StorageNamespaceImpl('localStorage', bus, noopLogger);
    ns.set('k', 'v1');
    ns.set('k', 'v2');
    ns.remove('k');
    expect(events.length).toBe(3);
    expect(events[0].newValue).toBe('v1');
    expect(events[1].oldValue).toBe('v1');
    expect(events[2].newValue).toBeNull();
  });

  it('deserialize falls back to raw string when JSON.parse fails', () => {
    const store = new FakeStorage();
    store.setItem('raw', 'not-json{{');
    setupWindow(store, store);
    const ns = new StorageNamespaceImpl('localStorage', makeBus(), noopLogger);
    expect(ns.get('raw')).toBe('not-json{{');
  });
});
