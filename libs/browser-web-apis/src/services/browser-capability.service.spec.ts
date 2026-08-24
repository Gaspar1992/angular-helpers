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

  it('should detect webBluetooth as supported when navigator.bluetooth is present', () => {
    vi.stubGlobal('navigator', { bluetooth: {} });
    expect(service.isSupported('webBluetooth')).toBe(true);
  });

  it('should detect webBluetooth as unsupported when navigator.bluetooth is absent', () => {
    vi.stubGlobal('navigator', {});
    expect(service.isSupported('webBluetooth')).toBe(false);
  });

  it('should detect webSerial as supported when navigator.serial is present', () => {
    vi.stubGlobal('navigator', { serial: {} });
    expect(service.isSupported('webSerial')).toBe(true);
  });

  it('should detect webSerial as unsupported when navigator.serial is absent', () => {
    vi.stubGlobal('navigator', {});
    expect(service.isSupported('webSerial')).toBe(false);
  });

  it('should detect webHid as supported when navigator.hid is present', () => {
    vi.stubGlobal('navigator', { hid: {} });
    expect(service.isSupported('webHid')).toBe(true);
  });

  it('should detect webHid as unsupported when navigator.hid is absent', () => {
    vi.stubGlobal('navigator', {});
    expect(service.isSupported('webHid')).toBe(false);
  });
});
