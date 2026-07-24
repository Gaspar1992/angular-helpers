import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RateLimiterService } from './rate-limiter.service';
import { SecureStorageService } from './secure-storage.service';

describe('RateLimiterService', () => {
  let service: RateLimiterService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [RateLimiterService],
    });
    service = TestBed.inject(RateLimiterService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create correctly', () => {
    expect(service).toBeTruthy();
  });

  describe('Token Bucket Policy', () => {
    it('should consume tokens and update signals reactively', async () => {
      service.configure('tb-key', { type: 'token-bucket', capacity: 3, refillPerSecond: 1 });

      const canExec = service.canExecute('tb-key');
      const remaining = service.remaining('tb-key');

      expect(canExec()).toBe(true);
      expect(remaining()).toBe(3);

      await service.consume('tb-key', 2);
      expect(remaining()).toBe(1);
      expect(canExec()).toBe(true);

      await service.consume('tb-key', 1);
      expect(remaining()).toBe(0);
      expect(canExec()).toBe(false);
    });

    it('should reload tokens automatically over time and revive reactivity', async () => {
      service.configure('tb-key', { type: 'token-bucket', capacity: 3, refillPerSecond: 1 });

      const canExec = service.canExecute('tb-key');
      const remaining = service.remaining('tb-key');

      // Agotar la capacidad
      await service.consume('tb-key', 3);
      expect(remaining()).toBe(0);
      expect(canExec()).toBe(false);

      // Avanzar el tiempo 1050ms para permitir que se rellene 1 token completo (tasa = 1 por segundo)
      vi.advanceTimersByTime(1050);

      // The token bucket should have reloaded and the signal should have updated to 1 automatically
      expect(remaining()).toBe(1);
      expect(canExec()).toBe(true);

      // Avanzar otros 2000ms para llenar el bucket completamente
      vi.advanceTimersByTime(2000);
      expect(remaining()).toBe(3);
      expect(canExec()).toBe(true);
    });
  });

  describe('Sliding Window Policy', () => {
    it('should consume units and update signals reactively', async () => {
      service.configure('sw-key', { type: 'sliding-window', max: 2, windowMs: 2000 });

      const canExec = service.canExecute('sw-key');
      const remaining = service.remaining('sw-key');

      expect(canExec()).toBe(true);
      expect(remaining()).toBe(2);

      await service.consume('sw-key', 1);
      expect(remaining()).toBe(1);
      expect(canExec()).toBe(true);

      await service.consume('sw-key', 1);
      expect(remaining()).toBe(0);
      expect(canExec()).toBe(false);
    });

    it('should auto-release the sliding window lock when cooldown expires reactively', async () => {
      service.configure('sw-key', { type: 'sliding-window', max: 2, windowMs: 2000 });

      const canExec = service.canExecute('sw-key');
      const remaining = service.remaining('sw-key');

      // Agotar la capacidad
      await service.consume('sw-key', 2);
      expect(remaining()).toBe(0);
      expect(canExec()).toBe(false);

      // Avanzar el tiempo 2050ms para que expire el cooldown de la ventana de 2000ms
      vi.advanceTimersByTime(2050);

      // Los elementos de la ventana expiran y el signal se actualiza automáticamente a 2
      expect(remaining()).toBe(2);
      expect(canExec()).toBe(true);
    });
  });

  describe('Persistence Support', () => {
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
      vi.restoreAllMocks();
    });

    afterEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    it('should persist and load token-bucket state in localStorage', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

      await service.configure('local-tb', {
        type: 'token-bucket',
        capacity: 5,
        refillPerSecond: 1,
        storage: 'local',
      });

      // Initially, loads state (will be null/empty)
      expect(getItemSpy).toHaveBeenCalledWith('rate-limit:local-tb');

      await service.consume('local-tb', 2);

      // Should save state to localStorage
      expect(setItemSpy).toHaveBeenCalledWith(
        'rate-limit:local-tb',
        expect.stringContaining('"tokens":3'),
      );

      // Create a new service instance to simulate page reload / new service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [RateLimiterService],
      });
      const newService = TestBed.inject(RateLimiterService);

      await newService.configure('local-tb', {
        type: 'token-bucket',
        capacity: 5,
        refillPerSecond: 1,
        storage: 'local',
      });

      expect(newService.remaining('local-tb')()).toBe(3);
    });

    it('should persist and load sliding-window state in sessionStorage', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

      await service.configure('session-sw', {
        type: 'sliding-window',
        max: 3,
        windowMs: 10000,
        storage: 'session',
      });

      await service.consume('session-sw', 1);

      expect(setItemSpy).toHaveBeenCalledWith(
        'rate-limit:session-sw',
        expect.stringContaining('"timestamps"'),
      );

      // Reload state in a new configuration
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [RateLimiterService],
      });
      const newService = TestBed.inject(RateLimiterService);

      await newService.configure('session-sw', {
        type: 'sliding-window',
        max: 3,
        windowMs: 10000,
        storage: 'session',
      });

      expect(newService.remaining('session-sw')()).toBe(2);
    });

    it('should clear persisted state from storage on reset', async () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

      await service.configure('local-tb', {
        type: 'token-bucket',
        capacity: 5,
        refillPerSecond: 1,
        storage: 'local',
      });

      await service.consume('local-tb', 1);
      expect(localStorage.getItem('rate-limit:local-tb')).toBeTruthy();

      await service.reset('local-tb');
      expect(removeItemSpy).toHaveBeenCalledWith('rate-limit:local-tb');
      expect(localStorage.getItem('rate-limit:local-tb')).toBeNull();
    });

    it('should use SecureStorageService when storage is secure', async () => {
      const mockSecureStorage = {
        get: vi.fn().mockResolvedValue({ tokens: 2, lastRefillAt: Date.now() }),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          RateLimiterService,
          { provide: SecureStorageService, useValue: mockSecureStorage },
        ],
      });
      const secureService = TestBed.inject(RateLimiterService);

      await secureService.configure('secure-tb', {
        type: 'token-bucket',
        capacity: 5,
        refillPerSecond: 1,
        storage: 'secure',
      });

      expect(mockSecureStorage.get).toHaveBeenCalledWith('rate-limit:secure-tb');
      expect(secureService.remaining('secure-tb')()).toBe(2);

      await secureService.consume('secure-tb', 1);
      expect(mockSecureStorage.set).toHaveBeenCalledWith(
        'rate-limit:secure-tb',
        expect.objectContaining({ tokens: 1 }),
      );

      await secureService.reset('secure-tb');
      expect(mockSecureStorage.remove).toHaveBeenCalledWith('rate-limit:secure-tb');
    });
  });
});
