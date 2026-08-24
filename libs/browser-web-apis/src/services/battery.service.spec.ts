import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { BatteryService } from './battery.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('BatteryService', () => {
  let service: BatteryService;
  let mockBatteryManager: any;
  let eventListeners: Record<string, Set<() => void>>;

  beforeEach(() => {
    eventListeners = {
      chargingchange: new Set(),
      levelchange: new Set(),
      chargingtimechange: new Set(),
      dischargingtimechange: new Set(),
    };

    mockBatteryManager = {
      charging: true,
      chargingTime: 120,
      dischargingTime: Infinity,
      level: 0.85,
      addEventListener: vi.fn((event: string, cb: () => void) => {
        eventListeners[event]?.add(cb);
      }),
      removeEventListener: vi.fn((event: string, cb: () => void) => {
        eventListeners[event]?.delete(cb);
      }),
    };

    vi.stubGlobal('navigator', {
      getBattery: vi.fn().mockResolvedValue(mockBatteryManager),
    });

    TestBed.configureTestingModule({
      providers: [BatteryService, BrowserCapabilityService],
    });
    service = TestBed.inject(BatteryService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and check capability support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should throw error when querying battery before initialization', () => {
    expect(() => service.getBatteryInfo()).toThrow(/Battery service not initialized/);
    expect(() => service.isCharging()).toThrow(/Battery service not initialized/);
    expect(() => service.getLevel()).toThrow(/Battery service not initialized/);
    expect(() => service.getChargingTime()).toThrow(/Battery service not initialized/);
    expect(() => service.getDischargingTime()).toThrow(/Battery service not initialized/);
    expect(() => service.getNativeBatteryManager()).toThrow(/Battery service not initialized/);
    expect(() => service.watchBatteryInfo()).toThrow(/Battery service not initialized/);
  });

  it('should initialize and return battery info', async () => {
    const info = await service.initialize();
    expect(info).toEqual({
      charging: true,
      chargingTime: 120,
      dischargingTime: Infinity,
      level: 0.85,
    });
    expect(service.getBatteryInfo()).toEqual(info);
    expect(service.isCharging()).toBe(true);
    expect(service.getLevel()).toBe(0.85);
    expect(service.getChargingTime()).toBe(120);
    expect(service.getDischargingTime()).toBe(Infinity);
    expect(service.getNativeBatteryManager()).toBe(mockBatteryManager);
  });

  it('should handle initialization rejection', async () => {
    vi.stubGlobal('navigator', {
      getBattery: vi.fn().mockRejectedValue(new Error('Permission denied')),
    });
    await expect(service.initialize()).rejects.toThrow('Failed to initialize battery API');
  });

  it('should watch battery info and emit updates on events', async () => {
    await service.initialize();

    const emitted: any[] = [];
    const sub = service.watchBatteryInfo().subscribe((val) => emitted.push(val));

    expect(emitted.length).toBe(1);
    expect(emitted[0].level).toBe(0.85);

    // Update battery manager state and trigger event
    mockBatteryManager.level = 0.9;
    mockBatteryManager.charging = false;
    eventListeners['levelchange'].forEach((cb) => cb());

    expect(emitted.length).toBe(2);
    expect(emitted[1].level).toBe(0.9);
    expect(emitted[1].charging).toBe(false);

    sub.unsubscribe();
    expect(mockBatteryManager.removeEventListener).toHaveBeenCalledWith(
      'chargingchange',
      expect.any(Function),
    );
    expect(mockBatteryManager.removeEventListener).toHaveBeenCalledWith(
      'levelchange',
      expect.any(Function),
    );
  });

  it('should fail ensureSupported on server platform', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        BatteryService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(BatteryService);
    expect(serverService.isSupported()).toBe(false);
    await expect(serverService.initialize()).rejects.toThrow(/server environment/);
  });
});
