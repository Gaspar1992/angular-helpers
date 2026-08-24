import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { WebShareService } from './web-share.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('WebShareService', () => {
  let service: WebShareService;
  let shareMock: any;
  let canShareMock: any;

  beforeEach(() => {
    shareMock = vi.fn().mockResolvedValue(undefined);
    canShareMock = vi.fn().mockReturnValue(true);

    vi.stubGlobal('navigator', {
      share: shareMock,
      canShare: canShareMock,
    });

    TestBed.configureTestingModule({
      providers: [WebShareService, BrowserCapabilityService],
    });
    service = TestBed.inject(WebShareService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
    expect(service.canShare()).toBe(true);
  });

  it('should successfully share data', async () => {
    const data = { title: 'Test', text: 'Hello', url: 'https://example.com' };
    const res = await service.share(data);
    expect(res).toEqual({ shared: true });
    expect(shareMock).toHaveBeenCalledWith(data);
  });

  it('should return error object when share fails', async () => {
    shareMock.mockRejectedValue(new Error('AbortError: user canceled'));
    const res = await service.share({ title: 'Test' });
    expect(res).toEqual({ shared: false, error: 'AbortError: user canceled' });
  });

  it('should handle non-Error rejection in share', async () => {
    shareMock.mockRejectedValue('Unknown string error');
    const res = await service.share({ title: 'Test' });
    expect(res).toEqual({ shared: false, error: 'Share failed' });
  });

  it('should check canShareFiles properly', () => {
    expect(service.canShareFiles()).toBe(true);
    expect(canShareMock).toHaveBeenCalled();

    // When navigator doesn't have canShare
    vi.stubGlobal('navigator', { share: shareMock });
    expect(service.canShareFiles()).toBe(false);

    // When navigator doesn't have share at all
    vi.stubGlobal('navigator', {});
    expect(service.canShareFiles()).toBe(false);
    expect(service.canShare()).toBe(false);
  });

  it('should get native share function', () => {
    expect(service.getNativeShare()).toBe(shareMock);
  });

  it('should fail when on server platform', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        WebShareService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(WebShareService);
    expect(serverService.isSupported()).toBe(false);
    await expect(serverService.share({ title: 'test' })).rejects.toThrow(/server environment/);
    expect(() => serverService.getNativeShare()).toThrow(/server environment/);
  });
});
