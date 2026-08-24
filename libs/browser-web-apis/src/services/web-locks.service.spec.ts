import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { WebLocksService } from './web-locks.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('WebLocksService', () => {
  let service: WebLocksService;
  let mockLocks: any;

  beforeEach(() => {
    mockLocks = {
      request: vi.fn(async (name: string, optionsOrCallback: any, maybeCallback?: any) => {
        const callback =
          typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
        return callback({ name, mode: 'exclusive' });
      }),
      query: vi.fn().mockResolvedValue({
        held: [{ name: 'db-sync', mode: 'exclusive', clientId: 'c1' }],
        pending: [],
      }),
    };

    vi.stubGlobal('navigator', {
      locks: mockLocks,
    });

    TestBed.configureTestingModule({
      providers: [WebLocksService, BrowserCapabilityService],
    });
    service = TestBed.inject(WebLocksService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should acquire lock with no options', async () => {
    const result = await service.acquire('my-lock', async () => 'done');
    expect(result).toBe('done');
    expect(mockLocks.request).toHaveBeenCalledWith('my-lock', expect.any(Function));
  });

  it('should acquire lock with options', async () => {
    const result = await service.acquire('shared-lock', async () => 42, { mode: 'shared' });
    expect(result).toBe(42);
    expect(mockLocks.request).toHaveBeenCalledWith(
      'shared-lock',
      { mode: 'shared' },
      expect.any(Function),
    );
  });

  it('should query lock snapshot', async () => {
    const snapshot = await service.query();
    expect(snapshot.held.length).toBe(1);
    expect(snapshot.held[0].name).toBe('db-sync');
    expect(mockLocks.query).toHaveBeenCalled();
  });

  it('should throw error when Web Locks API is not supported', () => {
    vi.stubGlobal('navigator', {});
    expect(service.isSupported()).toBe(false);
    expect(() => service.acquire('test', () => {})).toThrow(
      'Web Locks API not supported in this browser',
    );
    expect(() => service.query()).toThrow('Web Locks API not supported in this browser');
  });

  it('should throw when on server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        WebLocksService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(WebLocksService);
    expect(serverService.isSupported()).toBe(false);
    expect(() => serverService.acquire('test', () => {})).toThrow(/server environment/);
  });
});
