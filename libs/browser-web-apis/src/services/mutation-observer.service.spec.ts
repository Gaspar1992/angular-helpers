import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, take } from 'rxjs';
import { MutationObserverService } from './mutation-observer.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('MutationObserverService', () => {
  let service: MutationObserverService;
  let mockMOInstance: any;
  let moCallback: any;

  beforeEach(() => {
    mockMOInstance = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };

    const MockMO = vi.fn(function (this: any, cb: any) {
      moCallback = cb;
      Object.assign(this, mockMOInstance);
      mockMOInstance = this;
      return this;
    });

    vi.stubGlobal('MutationObserver', MockMO);

    TestBed.configureTestingModule({
      providers: [MutationObserverService, BrowserCapabilityService],
    });
    service = TestBed.inject(MutationObserverService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should observe target and emit mutation records', async () => {
    const el = document.createElement('div');
    const obs$ = service.observe(el, { childList: true });

    const promise = firstValueFrom(obs$.pipe(take(1)));
    expect(mockMOInstance.observe).toHaveBeenCalledWith(el, { childList: true });

    const mockRecords = [{ type: 'childList' }] as unknown as MutationRecord[];
    moCallback(mockRecords);

    const result = await promise;
    expect(result).toEqual(mockRecords);
  });

  it('should disconnect observer on unsubscribe', () => {
    const el = document.createElement('div');
    const sub = service.observe(el).subscribe();
    sub.unsubscribe();
    expect(mockMOInstance.disconnect).toHaveBeenCalled();
  });

  it('should return error observable when unsupported', async () => {
    delete (window as any).MutationObserver;
    delete (globalThis as any).MutationObserver;
    const el = document.createElement('div');
    expect(service.isSupported()).toBe(false);

    await expect(firstValueFrom(service.observe(el))).rejects.toThrow(
      'MutationObserver API not supported',
    );
  });
});
