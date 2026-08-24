import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { PermissionsService } from './permissions.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let mockPermissions: any;

  beforeEach(() => {
    mockPermissions = {
      query: vi.fn().mockResolvedValue({ state: 'granted', onchange: null }),
    };

    vi.stubGlobal('navigator', {
      permissions: mockPermissions,
    });

    TestBed.configureTestingModule({
      providers: [PermissionsService, BrowserCapabilityService],
    });
    service = TestBed.inject(PermissionsService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should query permission status', async () => {
    const status = await service.query({ name: 'geolocation' } as any);
    expect(status.state).toBe('granted');
    expect(mockPermissions.query).toHaveBeenCalledWith({ name: 'geolocation' });
  });

  it('should fallback to prompt state when browser throws TypeError (e.g. Firefox camera/mic query)', async () => {
    mockPermissions.query.mockRejectedValueOnce(new TypeError('Not supported name'));
    const status = await service.query({ name: 'camera' } as any);
    expect(status.state).toBe('prompt');
  });

  it('should rethrow non-TypeError errors', async () => {
    mockPermissions.query.mockRejectedValueOnce(new Error('Permission service failure'));
    await expect(service.query({ name: 'geolocation' } as any)).rejects.toThrow(
      'Permission service failure',
    );
  });

  it('should throw when unsupported or on server platform', async () => {
    vi.stubGlobal('navigator', {});
    expect(service.isSupported()).toBe(false);
    await expect(service.query({ name: 'geolocation' } as any)).rejects.toThrow(
      /Permissions API not supported/,
    );
  });
});
