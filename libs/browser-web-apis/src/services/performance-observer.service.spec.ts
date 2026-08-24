import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, take } from 'rxjs';
import { PerformanceObserverService } from './performance-observer.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('PerformanceObserverService', () => {
  let service: PerformanceObserverService;
  let mockPOInstance: any;
  let poCallback: any;

  beforeEach(() => {
    mockPOInstance = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };

    const MockPO = vi.fn(function (this: any, cb: any) {
      poCallback = cb;
      Object.assign(this, mockPOInstance);
      mockPOInstance = this;
      return this;
    }) as any;
    MockPO.supportedEntryTypes = ['resource', 'mark', 'measure', 'paint'];

    vi.stubGlobal('PerformanceObserver', MockPO);

    TestBed.configureTestingModule({
      providers: [PerformanceObserverService, BrowserCapabilityService],
    });
    service = TestBed.inject(PerformanceObserverService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should get supported entry types', () => {
    const types = service.getSupportedEntryTypes();
    expect(types).toEqual(['resource', 'mark', 'measure', 'paint']);
  });

  it('should observe performance entries by config type', async () => {
    const entries$ = service.observe({ type: 'resource', buffered: true });
    const promise = firstValueFrom(entries$.pipe(take(1)));

    expect(mockPOInstance.observe).toHaveBeenCalledWith({ type: 'resource', buffered: true });

    const mockList = {
      getEntries: () => [{ name: 'https://example.com/style.css', entryType: 'resource' }],
    };
    poCallback(mockList);

    const result = await promise;
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('https://example.com/style.css');
  });

  it('should observe performance entries by config entryTypes array', async () => {
    const entries$ = service.observe({ entryTypes: ['mark', 'measure'] });
    const promise = firstValueFrom(entries$.pipe(take(1)));

    expect(mockPOInstance.observe).toHaveBeenCalledWith({ entryTypes: ['mark', 'measure'] });

    const mockList = {
      getEntries: () => [{ name: 'my-mark', entryType: 'mark' }],
    };
    poCallback(mockList);

    const result = await promise;
    expect(result.length).toBe(1);
  });

  it('should observeByType convenience method', async () => {
    const entries$ = service.observeByType('paint');
    const promise = firstValueFrom(entries$.pipe(take(1)));

    expect(mockPOInstance.observe).toHaveBeenCalledWith({ type: 'paint', buffered: true });

    const mockList = {
      getEntries: () => [{ name: 'first-paint', entryType: 'paint' }],
    };
    poCallback(mockList);

    const result = await promise;
    expect(result.length).toBe(1);
  });

  it('should disconnect observer on unsubscribe', () => {
    const sub = service.observe({ type: 'resource' }).subscribe();
    sub.unsubscribe();
    expect(mockPOInstance.disconnect).toHaveBeenCalled();
  });

  it('should return error observable and empty supported types when unsupported', async () => {
    delete (window as any).PerformanceObserver;
    delete (globalThis as any).PerformanceObserver;
    expect(service.isSupported()).toBe(false);
    expect(service.getSupportedEntryTypes()).toEqual([]);

    await expect(firstValueFrom(service.observe({ type: 'mark' }))).rejects.toThrow(
      'PerformanceObserver API not supported',
    );
  });
});
