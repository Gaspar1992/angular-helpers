import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RateLimiterService } from './rate-limiter.service';

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

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('Token Bucket Policy', () => {
    it('debe consumir tokens y actualizar señales de forma reactiva', async () => {
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

    it('debe recargar tokens automaticamente con el paso del tiempo y revivir la reactividad', async () => {
      service.configure('tb-key', { type: 'token-bucket', capacity: 3, refillPerSecond: 1 });

      const canExec = service.canExecute('tb-key');
      const remaining = service.remaining('tb-key');

      // Agotar la capacidad
      await service.consume('tb-key', 3);
      expect(remaining()).toBe(0);
      expect(canExec()).toBe(false);

      // Avanzar el tiempo 1050ms para permitir que se rellene 1 token completo (tasa = 1 por segundo)
      vi.advanceTimersByTime(1050);

      // El token bucket debe haberse recargado y el signal debe haberse actualizado a 1 automáticamente
      expect(remaining()).toBe(1);
      expect(canExec()).toBe(true);

      // Avanzar otros 2000ms para llenar el bucket completamente
      vi.advanceTimersByTime(2000);
      expect(remaining()).toBe(3);
      expect(canExec()).toBe(true);
    });
  });

  describe('Sliding Window Policy', () => {
    it('debe consumir unidades y actualizar señales de forma reactiva', async () => {
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

    it('debe autoliberar el bloqueo del sliding window al expirar el cooldown de forma reactiva', async () => {
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
});
