import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PageVisibilityService } from './page-visibility.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('PageVisibilityService', () => {
  let service: PageVisibilityService;

  beforeEach(() => {
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });

    TestBed.configureTestingModule({
      providers: [PageVisibilityService, BrowserCapabilityService],
    });
    service = TestBed.inject(PageVisibilityService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should get isHidden and visibilityState', () => {
    expect(service.isHidden).toBe(false);
    expect(service.visibilityState).toBe('visible');

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });

    expect(service.isHidden).toBe(true);
    expect(service.visibilityState).toBe('hidden');
  });

  it('should watch visibility state stream', async () => {
    const stream$ = service.watch();
    const val = await firstValueFrom(stream$);
    expect(val).toBe('visible');
  });

  it('should watch boolean visibility stream', async () => {
    const stream$ = service.watchVisibility();
    const val = await firstValueFrom(stream$);
    expect(val).toBe(true);
  });

  it('should handle server platform gracefully', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        PageVisibilityService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(PageVisibilityService);
    expect(serverService.isSupported()).toBe(false);
    expect(serverService.isHidden).toBe(false);
    expect(serverService.visibilityState).toBe('visible');
  });
});
