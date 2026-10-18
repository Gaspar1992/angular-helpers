import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BrowserCapabilityService, type BrowserCapabilityId } from './browser-capability.service';

describe('BrowserCapabilityService', () => {
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

  it('should return all capabilities and evaluate getAllStatuses()', () => {
    vi.stubGlobal('isSecureContext', true);
    const caps = service.getCapabilities();
    expect(caps.length).toBeGreaterThan(40);

    const statuses = service.getAllStatuses();
    expect(statuses.length).toBe(caps.length);
    for (const status of statuses) {
      expect(typeof status.supported).toBe('boolean');
      expect(status.secureContext).toBe(true);
      expect(typeof status.requiresSecureContext).toBe('boolean');
    }
  });

  it('should return false for unknown capability id', () => {
    expect(service.isSupported('nonExistentCapability' as BrowserCapabilityId)).toBe(false);
  });

  it('should detect deviceOrientation and deviceMotion support', () => {
    vi.stubGlobal('DeviceOrientationEvent', class {});
    vi.stubGlobal('DeviceMotionEvent', class {});
    expect(service.isSupported('deviceOrientation')).toBe(true);
    expect(service.isSupported('deviceMotion')).toBe(true);
  });

  it('should detect webBluetooth, webSerial, webHid, storageManager, compressionStreams, speechRecognition', () => {
    vi.stubGlobal('navigator', {
      bluetooth: {},
      serial: {},
      hid: {},
      storage: { estimate: vi.fn() },
    });
    vi.stubGlobal('CompressionStream', class {});
    vi.stubGlobal('DecompressionStream', class {});
    vi.stubGlobal('webkitSpeechRecognition', class {});

    expect(service.isSupported('webBluetooth')).toBe(true);
    expect(service.isSupported('webSerial')).toBe(true);
    expect(service.isSupported('webHid')).toBe(true);
    expect(service.isSupported('storageManager')).toBe(true);
    expect(service.isSupported('compressionStreams')).toBe(true);
    expect(service.isSupported('speechRecognition')).toBe(true);

    vi.stubGlobal('navigator', {});
    expect(service.isSupported('webBluetooth')).toBe(false);
    expect(service.isSupported('webSerial')).toBe(false);
    expect(service.isSupported('webHid')).toBe(false);
    expect(service.isSupported('storageManager')).toBe(false);
  });

  it('should query getPermissionState and handle missing or failing permissions API', async () => {
    vi.stubGlobal('navigator', {
      permissions: {
        query: vi.fn().mockResolvedValue({ state: 'granted' }),
      },
    });
    expect(await service.getPermissionState('geolocation' as PermissionName)).toBe('granted');

    vi.stubGlobal('navigator', {
      permissions: {
        query: vi.fn().mockRejectedValue(new Error('Unsupported permission')),
      },
    });
    expect(await service.getPermissionState('geolocation' as PermissionName)).toBe('unknown');

    vi.stubGlobal('navigator', {});
    expect(await service.getPermissionState('geolocation' as PermissionName)).toBe('unknown');
  });
});
