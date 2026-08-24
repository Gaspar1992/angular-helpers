import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { VibrationService } from './vibration.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('VibrationService', () => {
  let service: VibrationService;
  let vibrateMock: any;

  beforeEach(() => {
    vibrateMock = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', {
      vibrate: vibrateMock,
    });

    TestBed.configureTestingModule({
      providers: [VibrationService, BrowserCapabilityService],
    });
    service = TestBed.inject(VibrationService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and check isSupported', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should vibrate with default pattern when called with no arguments', () => {
    const result = service.vibrate();
    expect(result).toBe(true);
    expect(vibrateMock).toHaveBeenCalledWith(200);
  });

  it('should trigger presets correctly', () => {
    expect(service.success()).toBe(true);
    expect(vibrateMock).toHaveBeenCalledWith([50, 30, 50]);

    expect(service.error()).toBe(true);
    expect(vibrateMock).toHaveBeenCalledWith([100, 50, 100, 50, 100]);

    expect(service.notification()).toBe(true);
    expect(vibrateMock).toHaveBeenCalledWith([200]);

    expect(service.doubleTap()).toBe(true);
    expect(vibrateMock).toHaveBeenCalledWith([50, 100, 50]);

    expect(service.stop()).toBe(true);
    expect(vibrateMock).toHaveBeenCalledWith(0);
  });

  it('should return false if vibrate is not supported', () => {
    vi.stubGlobal('navigator', {});
    expect(service.isSupported()).toBe(false);
    expect(service.vibrate(100)).toBe(false);
  });

  it('should return false when on server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        VibrationService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(VibrationService);
    expect(serverService.isSupported()).toBe(false);
    expect(serverService.vibrate()).toBe(false);
  });
});
