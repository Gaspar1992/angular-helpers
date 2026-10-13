import { webcrypto } from 'node:crypto';

/**
 * Options for configuring headless browser mocks in test environments.
 */
export interface HeadlessMocksOptions {
  resizeObserver?: boolean;
  intersectionObserver?: boolean;
  broadcastChannel?: boolean;
  webCrypto?: boolean;
  canvas2D?: boolean;
  indexedDB?: boolean;
}

/**
 * Lightweight mock for ResizeObserver.
 */
export class MockResizeObserver implements ResizeObserver {
  private static readonly instances = new Set<MockResizeObserver>();
  readonly elements = new Set<Element>();

  constructor(public readonly callback: ResizeObserverCallback) {
    MockResizeObserver.instances.add(this);
  }

  observe(target: Element): void {
    this.elements.add(target);
  }

  unobserve(target: Element): void {
    this.elements.delete(target);
  }

  disconnect(): void {
    this.elements.clear();
    MockResizeObserver.instances.delete(this);
  }

  /**
   * Triggers resize event on this observer instance.
   */
  trigger(entries: Partial<ResizeObserverEntry>[] = []): void {
    this.callback(entries as ResizeObserverEntry[], this);
  }

  /**
   * Triggers resize on all active observer instances.
   */
  static triggerAll(entries: Partial<ResizeObserverEntry>[] = []): void {
    for (const instance of MockResizeObserver.instances) {
      instance.trigger(entries);
    }
  }

  static clearInstances(): void {
    MockResizeObserver.instances.clear();
  }
}

/**
 * Lightweight mock for IntersectionObserver.
 */
export class MockIntersectionObserver implements IntersectionObserver {
  private static readonly instances = new Set<MockIntersectionObserver>();
  readonly elements = new Set<Element>();
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '0px';
  readonly scrollMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  constructor(
    public readonly callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    if (options?.root) this.root = options.root;
    if (options?.rootMargin) this.rootMargin = options.rootMargin;
    if (options?.threshold) {
      this.thresholds = Array.isArray(options.threshold) ? options.threshold : [options.threshold];
    }
    MockIntersectionObserver.instances.add(this);
  }

  observe(target: Element): void {
    this.elements.add(target);
  }

  unobserve(target: Element): void {
    this.elements.delete(target);
  }

  disconnect(): void {
    this.elements.clear();
    MockIntersectionObserver.instances.delete(this);
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(entries: Partial<IntersectionObserverEntry>[] = []): void {
    this.callback(entries as IntersectionObserverEntry[], this);
  }

  static triggerAll(entries: Partial<IntersectionObserverEntry>[] = []): void {
    for (const instance of MockIntersectionObserver.instances) {
      instance.trigger(entries);
    }
  }

  static clearInstances(): void {
    MockIntersectionObserver.instances.clear();
  }
}

/**
 * In-memory BroadcastChannel mock facilitating cross-channel communication in headless tests.
 */
export class MockBroadcastChannel implements EventTarget {
  private static readonly channels = new Map<string, Set<MockBroadcastChannel>>();

  readonly name: string;
  onmessage: ((this: BroadcastChannel, ev: MessageEvent) => unknown) | null = null;
  onmessageerror: ((this: BroadcastChannel, ev: MessageEvent) => unknown) | null = null;
  private readonly listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  private closed = false;

  constructor(name: string) {
    this.name = name;
    let set = MockBroadcastChannel.channels.get(name);
    if (!set) {
      set = new Set<MockBroadcastChannel>();
      MockBroadcastChannel.channels.set(name, set);
    }
    set.add(this);
  }

  postMessage(message: unknown): void {
    if (this.closed) {
      throw new DOMException(
        'Cannot post message on a closed BroadcastChannel',
        'InvalidStateError',
      );
    }
    const siblings = MockBroadcastChannel.channels.get(this.name);
    if (!siblings) return;

    for (const target of siblings) {
      if (target === this || target.closed) continue;
      const event = new MessageEvent('message', { data: message });
      if (typeof target.onmessage === 'function') {
        target.onmessage.call(target as unknown as BroadcastChannel, event);
      }
      target.dispatchEvent(event);
    }
  }

  close(): void {
    this.closed = true;
    const siblings = MockBroadcastChannel.channels.get(this.name);
    if (siblings) {
      siblings.delete(this);
      if (siblings.size === 0) {
        MockBroadcastChannel.channels.delete(this.name);
      }
    }
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (!listener) return;
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (!listener) return;
    this.listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: Event): boolean {
    const set = this.listeners.get(event.type);
    if (!set) return true;
    for (const listener of set) {
      if (typeof listener === 'function') {
        listener.call(this, event);
      } else {
        listener.handleEvent(event);
      }
    }
    return !event.defaultPrevented;
  }

  static clearChannels(): void {
    MockBroadcastChannel.channels.clear();
  }
}

/**
 * Polyfills WebCrypto (`crypto.subtle`) using Node.js's built-in `webcrypto`.
 */
export function mockWebCrypto(): void {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      configurable: true,
      writable: true,
    });
  }
}

/**
 * Installs MockResizeObserver on `globalThis.ResizeObserver` if not already defined.
 */
export function mockResizeObserver(): () => void {
  const original = globalThis.ResizeObserver;
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  return () => {
    globalThis.ResizeObserver = original;
    MockResizeObserver.clearInstances();
  };
}

/**
 * Installs MockIntersectionObserver on `globalThis.IntersectionObserver` if not already defined.
 */
export function mockIntersectionObserver(): () => void {
  const original = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
  return () => {
    globalThis.IntersectionObserver = original;
    MockIntersectionObserver.clearInstances();
  };
}

/**
 * Installs MockBroadcastChannel on `globalThis.BroadcastChannel` if not already defined.
 */
export function mockBroadcastChannel(): () => void {
  const original = globalThis.BroadcastChannel;
  globalThis.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;
  return () => {
    globalThis.BroadcastChannel = original;
    MockBroadcastChannel.clearChannels();
  };
}

/**
 * Mocks HTMLCanvasElement 2D rendering context for headless tests.
 */
export function mockCanvas2D(): void {
  if (typeof HTMLCanvasElement === 'undefined') return;

  const mockContext = {
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
    createImageData: () => ({ data: new Uint8ClampedArray(4) }),
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    transform: () => {},
    rect: () => {},
    clip: () => {},
  };

  HTMLCanvasElement.prototype.getContext = function () {
    return mockContext as unknown as RenderingContext;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

/**
 * Mocks IndexedDB with a safe in-memory fallback factory for tests.
 */
export function mockIndexedDB(): () => void {
  const original = globalThis.indexedDB;
  if (typeof globalThis.indexedDB === 'undefined') {
    const mockFactory: Partial<IDBFactory> = {
      open: () => {
        const req: Record<string, unknown> = {
          result: null,
          error: null,
          readyState: 'done',
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        };
        return req as unknown as IDBOpenDBRequest;
      },
      deleteDatabase: () => {
        const req: Record<string, unknown> = {
          result: undefined,
          error: null,
          readyState: 'done',
        };
        return req as unknown as IDBOpenDBRequest;
      },
      cmp: (a: unknown, b: unknown) => (a === b ? 0 : String(a) > String(b) ? 1 : -1),
    };
    Object.defineProperty(globalThis, 'indexedDB', {
      value: mockFactory,
      configurable: true,
      writable: true,
    });
  }
  return () => {
    if (original !== undefined) {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: original,
        configurable: true,
        writable: true,
      });
    } else {
      // @ts-expect-error Safe deletion for mock restoration
      delete globalThis.indexedDB;
    }
  };
}

/**
 * Automatically sets up all common headless browser mocks (ResizeObserver,
 * IntersectionObserver, BroadcastChannel, WebCrypto, Canvas2D, IndexedDB).
 */
export function setupHeadlessBrowserMocks(options: HeadlessMocksOptions = {}): () => void {
  const cleanups: (() => void)[] = [];

  if (options.webCrypto ?? true) {
    mockWebCrypto();
  }
  if (options.resizeObserver ?? true) {
    cleanups.push(mockResizeObserver());
  }
  if (options.intersectionObserver ?? true) {
    cleanups.push(mockIntersectionObserver());
  }
  if (options.broadcastChannel ?? true) {
    cleanups.push(mockBroadcastChannel());
  }
  if (options.canvas2D ?? true) {
    mockCanvas2D();
  }
  if (options.indexedDB ?? true) {
    cleanups.push(mockIndexedDB());
  }

  return () => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  };
}
