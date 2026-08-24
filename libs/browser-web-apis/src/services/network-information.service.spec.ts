import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NetworkInformationService } from './network-information.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('NetworkInformationService', () => {
  let service: NetworkInformationService;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = {
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      downlinkMax: 100,
      rtt: 50,
      saveData: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.stubGlobal('navigator', {
      onLine: true,
      connection: mockConnection,
    });

    TestBed.configureTestingModule({
      providers: [NetworkInformationService, BrowserCapabilityService],
    });
    service = TestBed.inject(NetworkInformationService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
    expect(service.isOnline).toBe(true);
  });

  it('should return network snapshot', () => {
    const snapshot = service.getSnapshot();
    expect(snapshot).toEqual({
      online: true,
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      downlinkMax: 100,
      rtt: 50,
      saveData: false,
    });
  });

  it('should watch network information stream', async () => {
    const stream$ = service.watch();
    const val = await firstValueFrom(stream$);
    expect(val.online).toBe(true);
  });

  it('should handle server platform gracefully', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NetworkInformationService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(NetworkInformationService);
    expect(serverService.isSupported()).toBe(false);
    expect(serverService.isOnline).toBe(true);
    expect(serverService.getSnapshot()).toEqual({ online: true });
  });
});
