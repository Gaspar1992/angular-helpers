import { TestBed } from '@angular/core/testing';
import { EnvironmentInjector, PLATFORM_ID } from '@angular/core';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { injectWebTransportResource, injectWebTransport } from './inject-web-transport-resource';

describe('injectWebTransportResource', () => {
  const originalWebTransport = (globalThis as any).WebTransport;

  afterEach(() => {
    if (originalWebTransport) {
      (globalThis as any).WebTransport = originalWebTransport;
    } else {
      delete (globalThis as any).WebTransport;
    }
  });

  it('should return isSupported() === false when platform is not browser', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const injector = TestBed.inject(EnvironmentInjector);

    injector.runInContext(() => {
      const wt = injectWebTransportResource('https://example.com/wt');
      expect(wt.isSupported()).toBe(false);
      expect(wt.status()).toBe('error');
    });
  });

  it('should return isSupported() === false when WebTransport is undefined in browser', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    delete (globalThis as any).WebTransport;
    const injector = TestBed.inject(EnvironmentInjector);

    injector.runInContext(() => {
      const wt = injectWebTransportResource('https://example.com/wt');
      expect(wt.isSupported()).toBe(false);
      expect(wt.status()).toBe('error');
    });
  });

  it('should handle connection lifecycle and status transitions', async () => {
    let readyResolve: () => void;
    const readyPromise = new Promise<void>((res) => {
      readyResolve = res;
    });

    const closeFn = vi.fn();
    class MockWebTransport {
      ready = readyPromise;
      closed = new Promise<void>(() => {});
      datagrams = {
        readable: {
          getReader: () => ({
            read: () => new Promise(() => {}),
          }),
        },
        writable: {
          getWriter: () => ({
            write: vi.fn().mockResolvedValue(undefined),
            releaseLock: vi.fn(),
          }),
        },
      };
      close = closeFn;
    }

    (globalThis as any).WebTransport = MockWebTransport;

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const injector = TestBed.inject(EnvironmentInjector);

    let wtRef: ReturnType<typeof injectWebTransportResource> | undefined;

    injector.runInContext(() => {
      wtRef = injectWebTransportResource('https://example.com/wt');
    });

    expect(wtRef?.isSupported()).toBe(true);
    expect(wtRef?.status()).toBe('connecting');

    readyResolve!();
    await readyPromise;
    await new Promise((r) => setTimeout(r, 0));

    expect(wtRef?.status()).toBe('connected');

    wtRef?.close();
    expect(wtRef?.status()).toBe('closed');
    expect(closeFn).toHaveBeenCalled();
  });

  it('should handle connection errors gracefully', async () => {
    let readyReject: (err: Error) => void;
    const readyPromise = new Promise<void>((_, rej) => {
      readyReject = rej;
    });

    class MockWebTransport {
      ready = readyPromise;
      closed = new Promise<void>(() => {});
      close = vi.fn();
    }

    (globalThis as any).WebTransport = MockWebTransport;

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const injector = TestBed.inject(EnvironmentInjector);

    let wtRef: ReturnType<typeof injectWebTransportResource> | undefined;

    injector.runInContext(() => {
      wtRef = injectWebTransportResource('https://example.com/wt');
    });

    expect(wtRef?.status()).toBe('connecting');

    const err = new Error('Connection failed');
    readyReject!(err);

    try {
      await readyPromise;
    } catch {
      // Expected rejection
    }
    await new Promise((r) => setTimeout(r, 0));

    expect(wtRef?.status()).toBe('error');
  });

  it('should emit incoming datagrams and support sendDatagram', async () => {
    let hasEmitted = false;
    const readCallback = () => {
      if (!hasEmitted) {
        hasEmitted = true;
        return Promise.resolve({ value: new Uint8Array([1, 2, 3]), done: false });
      }
      return new Promise<{ value?: Uint8Array; done: boolean }>(() => {});
    };

    const writeFn = vi.fn().mockResolvedValue(undefined);
    const releaseLockFn = vi.fn();

    class MockWebTransport {
      ready = Promise.resolve();
      closed = new Promise<void>(() => {});
      datagrams = {
        readable: {
          getReader: () => ({
            read: () => readCallback(),
          }),
        },
        writable: {
          getWriter: () => ({
            write: writeFn,
            releaseLock: releaseLockFn,
          }),
        },
      };
      close = vi.fn();
    }

    (globalThis as any).WebTransport = MockWebTransport;

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const injector = TestBed.inject(EnvironmentInjector);

    let wtRef: ReturnType<typeof injectWebTransportResource> | undefined;

    injector.runInContext(() => {
      wtRef = injectWebTransportResource('https://example.com/wt');
    });

    // Touch status to evaluate resource loader
    expect(wtRef?.status()).toBe('connecting');

    await new Promise((r) => setTimeout(r, 0));

    expect(wtRef?.status()).toBe('connected');
    expect(wtRef?.datagram()).toEqual(new Uint8Array([1, 2, 3]));

    const payload = new Uint8Array([4, 5, 6]);
    await wtRef?.sendDatagram(payload);
    expect(writeFn).toHaveBeenCalledWith(payload);
    expect(releaseLockFn).toHaveBeenCalled();
  });

  it('should delegate unidirectional and bidirectional stream creation', async () => {
    const uniStream = {} as WritableStream<Uint8Array>;
    const biStream = {} as any;
    const createUniFn = vi.fn().mockResolvedValue(uniStream);
    const createBiFn = vi.fn().mockResolvedValue(biStream);

    const dummyUniStream = {} as any;
    const dummyBiStream = {} as any;

    class MockWebTransport {
      ready = Promise.resolve();
      closed = new Promise<void>(() => {});
      createUnidirectionalStream = createUniFn;
      createBidirectionalStream = createBiFn;
      incomingUnidirectionalStreams = dummyUniStream;
      incomingBidirectionalStreams = dummyBiStream;
      close = vi.fn();
    }

    (globalThis as any).WebTransport = MockWebTransport;

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const injector = TestBed.inject(EnvironmentInjector);

    let wtRef: ReturnType<typeof injectWebTransportResource> | undefined;

    injector.runInContext(() => {
      wtRef = injectWebTransportResource('https://example.com/wt');
    });

    expect(wtRef?.status()).toBe('connecting');

    await new Promise((r) => setTimeout(r, 0));

    expect(wtRef?.status()).toBe('connected');

    const createdUni = await wtRef?.createUnidirectionalStream();
    expect(createUniFn).toHaveBeenCalled();
    expect(createdUni).toBe(uniStream);

    const createdBi = await wtRef?.createBidirectionalStream();
    expect(createBiFn).toHaveBeenCalled();
    expect(createdBi).toBe(biStream);

    expect(wtRef?.incomingUnidirectionalStreams).toBe(dummyUniStream);
    expect(wtRef?.incomingBidirectionalStreams).toBe(dummyBiStream);
  });

  it('should invoke DestroyRef cleanup on context destruction', async () => {
    const closeFn = vi.fn();
    class MockWebTransport {
      ready = Promise.resolve();
      closed = new Promise<void>(() => {});
      close = closeFn;
    }

    (globalThis as any).WebTransport = MockWebTransport;

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const injector = TestBed.inject(EnvironmentInjector);

    let wtRef: ReturnType<typeof injectWebTransportResource> | undefined;

    injector.runInContext(() => {
      wtRef = injectWebTransportResource('https://example.com/wt');
    });

    expect(wtRef?.status()).toBe('connecting');

    await new Promise((r) => setTimeout(r, 0));

    TestBed.resetTestingModule();

    expect(closeFn).toHaveBeenCalled();
  });

  it('should work using injectWebTransport alias', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const injector = TestBed.inject(EnvironmentInjector);

    injector.runInContext(() => {
      const wt = injectWebTransport('https://example.com/wt');
      expect(wt.isSupported()).toBe(false);
    });
  });
});
