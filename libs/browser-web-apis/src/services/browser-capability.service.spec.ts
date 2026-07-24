import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BrowserCapabilityService } from './browser-capability.service';

describe('BrowserCapabilityService - Device Orientation & Motion', () => {
  let service: BrowserCapabilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BrowserCapabilityService],
    });
    service = TestBed.inject(BrowserCapabilityService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should detect deviceOrientation as supported when DeviceOrientationEvent is present', () => {
    vi.stubGlobal('DeviceOrientationEvent', class {});
    expect(service.isSupported('deviceOrientation' as any)).toBe(true);
  });

  it('should detect deviceOrientation as unsupported when DeviceOrientationEvent is absent', () => {
    const original = (globalThis as any).DeviceOrientationEvent;
    delete (globalThis as any).DeviceOrientationEvent;
    if (typeof window !== 'undefined') {
      delete (window as any).DeviceOrientationEvent;
    }
    try {
      expect(service.isSupported('deviceOrientation' as any)).toBe(false);
    } finally {
      if (original !== undefined) {
        (globalThis as any).DeviceOrientationEvent = original;
        if (typeof window !== 'undefined') {
          (window as any).DeviceOrientationEvent = original;
        }
      }
    }
  });

  it('should detect deviceMotion as supported when DeviceMotionEvent is present', () => {
    vi.stubGlobal('DeviceMotionEvent', class {});
    expect(service.isSupported('deviceMotion' as any)).toBe(true);
  });

  it('should detect deviceMotion as unsupported when DeviceMotionEvent is absent', () => {
    const original = (globalThis as any).DeviceMotionEvent;
    delete (globalThis as any).DeviceMotionEvent;
    if (typeof window !== 'undefined') {
      delete (window as any).DeviceMotionEvent;
    }
    try {
      expect(service.isSupported('deviceMotion' as any)).toBe(false);
    } finally {
      if (original !== undefined) {
        (globalThis as any).DeviceMotionEvent = original;
        if (typeof window !== 'undefined') {
          (window as any).DeviceMotionEvent = original;
        }
      }
    }
  });
});
