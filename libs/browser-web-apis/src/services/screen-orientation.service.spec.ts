import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ScreenOrientationService } from './screen-orientation.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('ScreenOrientationService', () => {
  let service: ScreenOrientationService;
  let mockOrientation: any;

  beforeEach(() => {
    mockOrientation = {
      type: 'portrait-primary',
      angle: 0,
      lock: vi.fn().mockResolvedValue(undefined),
      unlock: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.stubGlobal('screen', {
      orientation: mockOrientation,
    });
    vi.stubGlobal('isSecureContext', true);

    TestBed.configureTestingModule({
      providers: [ScreenOrientationService, BrowserCapabilityService],
    });
    service = TestBed.inject(ScreenOrientationService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should get snapshot and detect portrait / landscape', () => {
    const snap = service.getSnapshot();
    expect(snap).toEqual({ type: 'portrait-primary', angle: 0 });
    expect(service.isPortrait).toBe(true);
    expect(service.isLandscape).toBe(false);

    mockOrientation.type = 'landscape-primary';
    mockOrientation.angle = 90;
    expect(service.isPortrait).toBe(false);
    expect(service.isLandscape).toBe(true);
  });

  it('should lock screen orientation', async () => {
    await service.lock('landscape');
    expect(mockOrientation.lock).toHaveBeenCalledWith('landscape');
  });

  it('should throw when lock fails', async () => {
    mockOrientation.lock.mockRejectedValue(new Error('Lock not allowed'));
    await expect(service.lock('landscape')).rejects.toThrow('Lock not allowed');
  });

  it('should unlock screen orientation', () => {
    service.unlock();
    expect(mockOrientation.unlock).toHaveBeenCalled();
  });

  it('should watch screen orientation stream', async () => {
    const stream$ = service.watch();
    const val = await firstValueFrom(stream$);
    expect(val).toEqual({ type: 'portrait-primary', angle: 0 });
  });

  it('should handle server platform gracefully', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ScreenOrientationService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(ScreenOrientationService);
    expect(serverService.isSupported()).toBe(false);
    expect(serverService.getSnapshot()).toEqual({ type: 'portrait-primary', angle: 0 });
    await expect(serverService.lock('landscape')).rejects.toThrow(
      /Screen Orientation API not supported/,
    );
  });
});
