import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, take } from 'rxjs';
import { ResizeObserverService } from './resize-observer.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('ResizeObserverService', () => {
  let service: ResizeObserverService;
  let mockROInstance: any;
  let roCallback: any;

  beforeEach(() => {
    mockROInstance = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };

    const MockRO = vi.fn(function (this: any, cb: any) {
      roCallback = cb;
      Object.assign(this, mockROInstance);
      mockROInstance = this;
      return this;
    });

    vi.stubGlobal('ResizeObserver', MockRO);

    TestBed.configureTestingModule({
      providers: [ResizeObserverService, BrowserCapabilityService],
    });
    service = TestBed.inject(ResizeObserverService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should observe element and emit entries', async () => {
    const el = document.createElement('div');
    const entries$ = service.observe(el);

    const promise = firstValueFrom(entries$.pipe(take(1)));
    expect(mockROInstance.observe).toHaveBeenCalledWith(el, {});

    const mockEntries = [{ target: el }] as unknown as ResizeObserverEntry[];
    roCallback(mockEntries);

    const result = await promise;
    expect(result).toEqual(mockEntries);
  });

  it('should observe element size and emit ElementSize', async () => {
    const el = document.createElement('div');
    const size$ = service.observeSize(el);

    const promise = firstValueFrom(size$.pipe(take(1)));

    const mockEntry = {
      contentRect: { width: 300, height: 150 },
      borderBoxSize: [{ inlineSize: 320, blockSize: 170 }],
    } as unknown as ResizeObserverEntry;

    roCallback([mockEntry]);

    const result = await promise;
    expect(result).toEqual({
      width: 300,
      height: 150,
      inlineSize: 320,
      blockSize: 170,
    });
  });

  it('should fallback inlineSize/blockSize to contentRect dimensions if borderBoxSize is absent', async () => {
    const el = document.createElement('div');
    const size$ = service.observeSize(el);

    const promise = firstValueFrom(size$.pipe(take(1)));

    const mockEntry = {
      contentRect: { width: 200, height: 100 },
    } as unknown as ResizeObserverEntry;

    roCallback([mockEntry]);

    const result = await promise;
    expect(result).toEqual({
      width: 200,
      height: 100,
      inlineSize: 200,
      blockSize: 100,
    });
  });

  it('should unobserve and disconnect on unsubscribe', () => {
    const el = document.createElement('div');
    const sub = service.observe(el).subscribe();
    sub.unsubscribe();

    expect(mockROInstance.unobserve).toHaveBeenCalledWith(el);
    expect(mockROInstance.disconnect).toHaveBeenCalled();
  });

  it('should return error observable when unsupported', async () => {
    delete (window as any).ResizeObserver;
    delete (globalThis as any).ResizeObserver;
    const el = document.createElement('div');
    expect(service.isSupported()).toBe(false);

    await expect(firstValueFrom(service.observe(el))).rejects.toThrow(
      'ResizeObserver API not supported',
    );
    await expect(firstValueFrom(service.observeSize(el))).rejects.toThrow(
      'ResizeObserver API not supported',
    );
  });
});
