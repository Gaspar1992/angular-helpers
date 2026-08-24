import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom, take } from 'rxjs';
import { IntersectionObserverService } from './intersection-observer.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('IntersectionObserverService', () => {
  let service: IntersectionObserverService;
  let mockIOInstance: any;
  let ioCallback: any;

  beforeEach(() => {
    mockIOInstance = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };

    const MockIO = vi.fn(function (this: any, cb: any) {
      ioCallback = cb;
      Object.assign(this, mockIOInstance);
      mockIOInstance = this;
      return this;
    });

    vi.stubGlobal('IntersectionObserver', MockIO);

    TestBed.configureTestingModule({
      providers: [IntersectionObserverService, BrowserCapabilityService],
    });
    service = TestBed.inject(IntersectionObserverService);
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
    const entries$ = service.observe(el, { threshold: 0.5 });

    const promise = firstValueFrom(entries$.pipe(take(1)));
    expect(mockIOInstance.observe).toHaveBeenCalledWith(el);

    const mockEntries = [{ isIntersecting: true, target: el }] as IntersectionObserverEntry[];
    ioCallback(mockEntries);

    const result = await promise;
    expect(result).toEqual(mockEntries);
  });

  it('should observe visibility and emit boolean values', async () => {
    const el = document.createElement('div');
    const vis$ = service.observeVisibility(el);

    const promise = firstValueFrom(vis$.pipe(take(1)));
    ioCallback([{ isIntersecting: true }] as IntersectionObserverEntry[]);

    const result = await promise;
    expect(result).toBe(true);
  });

  it('should unobserve and disconnect on unsubscribe', () => {
    const el = document.createElement('div');
    const sub = service.observe(el).subscribe();
    sub.unsubscribe();

    expect(mockIOInstance.unobserve).toHaveBeenCalledWith(el);
    expect(mockIOInstance.disconnect).toHaveBeenCalled();
  });

  it('should return error observable when unsupported', async () => {
    delete (window as any).IntersectionObserver;
    delete (globalThis as any).IntersectionObserver;
    const el = document.createElement('div');
    expect(service.isSupported()).toBe(false);

    await expect(firstValueFrom(service.observe(el))).rejects.toThrow(
      'IntersectionObserver API not supported',
    );
    await expect(firstValueFrom(service.observeVisibility(el))).rejects.toThrow(
      'IntersectionObserver API not supported',
    );
  });
});
