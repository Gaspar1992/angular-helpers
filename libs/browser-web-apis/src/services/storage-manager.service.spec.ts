import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { StorageManagerService } from './storage-manager.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('StorageManagerService', () => {
  let service: StorageManagerService;
  let mockStorage: any;

  beforeEach(() => {
    mockStorage = {
      estimate: vi.fn().mockResolvedValue({
        usage: 1024 * 1024,
        quota: 100 * 1024 * 1024,
        usageDetails: { indexedDB: 512 * 1024 },
      }),
      persist: vi.fn().mockResolvedValue(true),
      persisted: vi.fn().mockResolvedValue(false),
    };

    vi.stubGlobal('navigator', {
      storage: mockStorage,
    });

    TestBed.configureTestingModule({
      providers: [StorageManagerService, BrowserCapabilityService],
    });
    service = TestBed.inject(StorageManagerService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should estimate storage quota', async () => {
    const est = await service.estimate();
    expect(est).toEqual({
      usage: 1024 * 1024,
      quota: 100 * 1024 * 1024,
      usageDetails: { indexedDB: 512 * 1024 },
    });
  });

  it('should request persist', async () => {
    const persisted = await service.persist();
    expect(persisted).toBe(true);
    expect(mockStorage.persist).toHaveBeenCalled();
  });

  it('should check if persisted', async () => {
    const isPersisted = await service.persisted();
    expect(isPersisted).toBe(false);
    expect(mockStorage.persisted).toHaveBeenCalled();
  });

  it('should handle missing persist/persisted methods gracefully', async () => {
    delete mockStorage.persist;
    delete mockStorage.persisted;

    expect(await service.persist()).toBe(false);
    expect(await service.persisted()).toBe(false);
  });

  it('should throw error when StorageManager is unsupported', async () => {
    vi.stubGlobal('navigator', {});
    expect(service.isSupported()).toBe(false);
    await expect(service.estimate()).rejects.toThrow(
      'StorageManager API not supported in this browser',
    );
  });

  it('should throw when on server platform', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        StorageManagerService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(StorageManagerService);
    expect(serverService.isSupported()).toBe(false);
    await expect(serverService.estimate()).rejects.toThrow(/server environment/);
  });
});
