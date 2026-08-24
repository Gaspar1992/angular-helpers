import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FullscreenService } from './fullscreen.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('FullscreenService', () => {
  let service: FullscreenService;
  let mockElement: any;

  beforeEach(() => {
    mockElement = {
      requestFullscreen: vi.fn().mockResolvedValue(undefined),
    };

    Object.defineProperty(document, 'fullscreenEnabled', {
      value: true,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true,
      configurable: true,
    });

    (document as any).exitFullscreen = vi.fn().mockResolvedValue(undefined);
    (document.documentElement as any).requestFullscreen = vi.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [FullscreenService, BrowserCapabilityService],
    });
    service = TestBed.inject(FullscreenService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should return false for isSupported if fullscreenEnabled is false', () => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      value: false,
      writable: true,
      configurable: true,
    });
    expect(service.isSupported()).toBe(false);
  });

  it('should support webkit prefix fallback for fullscreenEnabled', () => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    (document as any).webkitFullscreenEnabled = true;
    expect(service.isSupported()).toBe(true);
    delete (document as any).webkitFullscreenEnabled;
  });

  it('should check isFullscreen and fullscreenElement', () => {
    expect(service.isFullscreen).toBe(false);
    expect(service.fullscreenElement).toBeNull();

    Object.defineProperty(document, 'fullscreenElement', {
      value: mockElement,
      writable: true,
      configurable: true,
    });
    expect(service.isFullscreen).toBe(true);
    expect(service.fullscreenElement).toBe(mockElement);
  });

  it('should request fullscreen on specified element or fallback to documentElement', async () => {
    await service.request(mockElement);
    expect(mockElement.requestFullscreen).toHaveBeenCalled();

    const docEl = document.documentElement;
    const docElSpy = vi.spyOn(docEl, 'requestFullscreen').mockResolvedValue(undefined);
    await service.request();
    expect(docElSpy).toHaveBeenCalled();
    docElSpy.mockRestore();
  });

  it('should request fullscreen with webkit prefix if standard is not present', async () => {
    const webkitElement = {
      webkitRequestFullscreen: vi.fn().mockResolvedValue(undefined),
    };
    await service.request(webkitElement as any);
    expect(webkitElement.webkitRequestFullscreen).toHaveBeenCalled();
  });

  it('should throw when request fails', async () => {
    mockElement.requestFullscreen.mockRejectedValue(new Error('Denied'));
    await expect(service.request(mockElement)).rejects.toThrow('Denied');
  });

  it('should exit fullscreen', async () => {
    const exitSpy = vi.spyOn(document, 'exitFullscreen').mockResolvedValue(undefined);
    Object.defineProperty(document, 'fullscreenElement', {
      value: mockElement,
      writable: true,
      configurable: true,
    });

    await service.exit();
    expect(exitSpy).toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it('should do nothing on exit if not currently in fullscreen', async () => {
    const exitSpy = vi.spyOn(document, 'exitFullscreen').mockResolvedValue(undefined);
    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true,
      configurable: true,
    });

    await service.exit();
    expect(exitSpy).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it('should exit fullscreen with webkit prefix if standard is not present', async () => {
    Object.defineProperty(document, 'fullscreenElement', {
      value: mockElement,
      writable: true,
      configurable: true,
    });
    const originalExit = document.exitFullscreen;
    delete (document as any).exitFullscreen;
    const webkitExit = vi.fn().mockResolvedValue(undefined);
    (document as any).webkitExitFullscreen = webkitExit;

    await service.exit();
    expect(webkitExit).toHaveBeenCalled();

    (document as any).exitFullscreen = originalExit;
    delete (document as any).webkitExitFullscreen;
  });

  it('should toggle fullscreen on and off', async () => {
    const reqSpy = vi.spyOn(service, 'request').mockResolvedValue(undefined);
    const exitSpy = vi.spyOn(service, 'exit').mockResolvedValue(undefined);

    // Currently false -> should call request
    await service.toggle(mockElement);
    expect(reqSpy).toHaveBeenCalledWith(mockElement);

    // Set to true -> should call exit
    Object.defineProperty(document, 'fullscreenElement', {
      value: mockElement,
      writable: true,
      configurable: true,
    });
    await service.toggle(mockElement);
    expect(exitSpy).toHaveBeenCalled();
  });

  it('should watch fullscreen state changes', async () => {
    const emitted: boolean[] = [];
    const sub = service.watch().subscribe((val) => emitted.push(val));

    expect(emitted).toEqual([false]);

    Object.defineProperty(document, 'fullscreenElement', {
      value: mockElement,
      writable: true,
      configurable: true,
    });
    document.dispatchEvent(new Event('fullscreenchange'));

    expect(emitted).toEqual([false, true]);
    sub.unsubscribe();
  });

  it('should handle server platform gracefully', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        FullscreenService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(FullscreenService);
    expect(serverService.isSupported()).toBe(false);
    expect(serverService.isFullscreen).toBe(false);
    expect(serverService.fullscreenElement).toBeNull();
    await expect(serverService.request()).rejects.toThrow(/Fullscreen API not supported/);

    const emitted = await firstValueFrom(serverService.watch());
    expect(emitted).toBe(false);
  });
});
