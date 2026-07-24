import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { EnvironmentInjector, createEnvironmentInjector } from '@angular/core';
import { firstValueFrom, take } from 'rxjs';
import { WebTransportService } from './web-transport.service';
import { WEB_TRANSPORT_SUPPORTED, WEB_TRANSPORT_TOKEN } from '../providers/web-transport';

class MockWebTransport {
  url: string;
  options?: any;
  ready: Promise<void>;
  closed: Promise<{ closeCode?: number; reason?: string }>;
  closeResolve!: () => void;
  readyResolve!: () => void;
  datagrams: any;
  incomingUnidirectionalStreams: any;
  incomingBidirectionalStreams: any;
  closeSpy = vi.fn();
  writeSpy = vi.fn().mockResolvedValue(undefined);

  constructor(url: string, options?: any) {
    this.url = url;
    this.options = options;

    this.ready = new Promise((resolve) => {
      this.readyResolve = resolve;
    });

    this.closed = new Promise((resolve) => {
      this.closeResolve = () => resolve({});
    });

    this.datagrams = {
      writable: {
        getWriter: () => ({
          write: this.writeSpy,
          releaseLock: vi.fn(),
        }),
      },
      readable: {
        getReader: () => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
        }),
      },
    };

    this.incomingUnidirectionalStreams = {
      getReader: () => ({
        read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
      }),
    };

    this.incomingBidirectionalStreams = {
      getReader: () => ({
        read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
      }),
    };
  }

  createUnidirectionalStream() {
    return Promise.resolve({ writable: true } as any);
  }

  createBidirectionalStream() {
    return Promise.resolve({ readable: {}, writable: {} } as any);
  }

  close(info?: any) {
    this.closeSpy(info);
    this.closeResolve();
  }
}

describe('WebTransportService', () => {
  let service: WebTransportService;
  let mockTransport: MockWebTransport;

  beforeEach(() => {
    vi.stubGlobal(
      'WebTransport',
      class extends MockWebTransport {
        constructor(url: string, options?: any) {
          super(url, options);
          mockTransport = this;
        }
      },
    );

    TestBed.configureTestingModule({
      providers: [
        WebTransportService,
        { provide: WEB_TRANSPORT_SUPPORTED, useValue: true },
        { provide: WEB_TRANSPORT_TOKEN, useValue: globalThis.WebTransport },
      ],
    });
    service = TestBed.inject(WebTransportService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created with initial status closed', () => {
    expect(service).toBeTruthy();
    expect(service.status()).toBe('closed');
    expect(service.error()).toBeNull();
    expect(service.isSupported()).toBe(true);
  });

  it('should fail to connect if WEB_TRANSPORT_SUPPORTED is false', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [WebTransportService, { provide: WEB_TRANSPORT_SUPPORTED, useValue: false }],
    });
    const unsupportedService = TestBed.inject(WebTransportService);
    expect(unsupportedService.isSupported()).toBe(false);

    await expect(unsupportedService.connect('https://example.com')).rejects.toThrow(
      'WebTransport is not supported in this environment',
    );
    expect(unsupportedService.status()).toBe('error');
    expect(unsupportedService.error()).not.toBeNull();
  });

  it('should connect and update state signal on ready resolution', async () => {
    const connectPromise = service.connect('https://example.com/webtransport');
    expect(service.status()).toBe('connecting');

    mockTransport.readyResolve();
    await connectPromise;

    expect(service.status()).toBe('connected');
    expect(service.transport).toBe(mockTransport);
  });

  it('should send datagrams when connected', async () => {
    const connectPromise = service.connect('https://example.com');
    mockTransport.readyResolve();
    await connectPromise;

    const data = new Uint8Array([1, 2, 3]);
    await service.sendDatagram(data);

    expect(mockTransport.writeSpy).toHaveBeenCalledWith(data);
  });

  it('should throw error when sending datagrams if disconnected', async () => {
    await expect(service.sendDatagram(new Uint8Array([1, 2, 3]))).rejects.toThrow(
      'WebTransport is not connected',
    );
  });

  it('should receive datagrams on datagrams$ stream', async () => {
    const testData = new Uint8Array([4, 5, 6]);
    let readCalled = false;

    vi.stubGlobal(
      'WebTransport',
      class extends MockWebTransport {
        constructor(url: string, options?: any) {
          super(url, options);
          this.datagrams.readable.getReader = () => ({
            read: () => {
              if (!readCalled) {
                readCalled = true;
                return Promise.resolve({ done: false, value: testData });
              }
              return Promise.resolve({ done: true, value: undefined });
            },
          });
          mockTransport = this;
        }
      },
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        WebTransportService,
        { provide: WEB_TRANSPORT_SUPPORTED, useValue: true },
        { provide: WEB_TRANSPORT_TOKEN, useValue: globalThis.WebTransport },
      ],
    });
    const datagramService = TestBed.inject(WebTransportService);

    const datagramPromise = firstValueFrom(datagramService.datagrams$.pipe(take(1)));
    const connectPromise = datagramService.connect('https://example.com');
    mockTransport.readyResolve();
    await connectPromise;

    const received = await datagramPromise;
    expect(received).toEqual(testData);
  });

  it('should create unidirectional stream when connected', async () => {
    const connectPromise = service.connect('https://example.com');
    mockTransport.readyResolve();
    await connectPromise;

    const stream = await service.createUnidirectionalStream();
    expect(stream).toEqual({ writable: true });
  });

  it('should create bidirectional stream when connected', async () => {
    const connectPromise = service.connect('https://example.com');
    mockTransport.readyResolve();
    await connectPromise;

    const stream = await service.createBidirectionalStream();
    expect(stream).toEqual({ readable: {}, writable: {} });
  });

  it('should throw error on stream creation when disconnected', async () => {
    await expect(service.createUnidirectionalStream()).rejects.toThrow(
      'WebTransport is not connected',
    );
    await expect(service.createBidirectionalStream()).rejects.toThrow(
      'WebTransport is not connected',
    );
  });

  it('should close connection explicitly and update status', async () => {
    const connectPromise = service.connect('https://example.com');
    mockTransport.readyResolve();
    await connectPromise;

    service.close({ closeCode: 1000, reason: 'Done' });

    expect(mockTransport.closeSpy).toHaveBeenCalledWith({ closeCode: 1000, reason: 'Done' });
    expect(service.status()).toBe('closed');
    expect(service.transport).toBeNull();
  });

  it('should cleanup connection on DestroyRef trigger', async () => {
    const parentInjector = TestBed.inject(EnvironmentInjector);
    const childInjector = createEnvironmentInjector(
      [
        WebTransportService,
        { provide: WEB_TRANSPORT_SUPPORTED, useValue: true },
        { provide: WEB_TRANSPORT_TOKEN, useValue: globalThis.WebTransport },
      ],
      parentInjector,
    );
    const childService = childInjector.get(WebTransportService);

    const connectPromise = childService.connect('https://example.com');
    mockTransport.readyResolve();
    await connectPromise;

    expect(childService.status()).toBe('connected');
    childInjector.destroy();
    expect(childService.status()).toBe('closed');
  });
});
