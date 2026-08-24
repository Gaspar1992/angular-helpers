import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom, take } from 'rxjs';
import { GamepadService } from './gamepad.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('GamepadService', () => {
  let service: GamepadService;
  let mockGamepad: any;

  beforeEach(() => {
    mockGamepad = {
      id: 'Xbox Controller',
      index: 0,
      connected: true,
      buttons: [
        { pressed: true, value: 1.0 },
        { pressed: false, value: 0 },
      ],
      axes: [0.0, -1.0],
      timestamp: 12345,
    };

    vi.stubGlobal('navigator', {
      getGamepads: vi.fn().mockReturnValue([mockGamepad, null]),
    });

    TestBed.configureTestingModule({
      providers: [GamepadService, BrowserCapabilityService],
    });
    service = TestBed.inject(GamepadService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should get snapshot for a gamepad index', () => {
    const snap = service.getSnapshot(0);
    expect(snap).toEqual({
      id: 'Xbox Controller',
      index: 0,
      connected: true,
      buttons: [
        { pressed: true, value: 1.0 },
        { pressed: false, value: 0 },
      ],
      axes: [0.0, -1.0],
      timestamp: 12345,
    });
  });

  it('should return null for snapshot when gamepad index does not exist', () => {
    const snap = service.getSnapshot(1);
    expect(snap).toBeNull();
  });

  it('should get connected gamepads list', () => {
    const gamepads = service.getConnectedGamepads();
    expect(gamepads.length).toBe(1);
    expect(gamepads[0].id).toBe('Xbox Controller');
  });

  it('should return null/empty when not supported', () => {
    vi.stubGlobal('navigator', {});
    expect(service.isSupported()).toBe(false);
    expect(service.getSnapshot(0)).toBeNull();
    expect(service.getConnectedGamepads()).toEqual([]);
  });

  it('should watch connections or error if unsupported', async () => {
    // When supported
    const obs$ = service.watchConnections();
    expect(obs$).toBeDefined();

    // When unsupported
    vi.stubGlobal('navigator', {});
    const unsuppObs$ = service.watchConnections();
    await expect(firstValueFrom(unsuppObs$)).rejects.toThrow('Gamepad API not supported');
  });

  it('should poll gamepad state or error if unsupported', async () => {
    // When supported
    const poll$ = service.poll(0, 50);
    const val = await firstValueFrom(poll$.pipe(take(1)));
    expect(val.id).toBe('Xbox Controller');

    // When unsupported
    vi.stubGlobal('navigator', {});
    const unsuppPoll$ = service.poll(0);
    await expect(firstValueFrom(unsuppPoll$)).rejects.toThrow('Gamepad API not supported');
  });

  it('should handle server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        GamepadService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(GamepadService);
    expect(serverService.isSupported()).toBe(false);
    expect(serverService.getSnapshot(0)).toBeNull();
    expect(serverService.getConnectedGamepads()).toEqual([]);
  });
});
