import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import {
  SensitiveClipboardService,
  ClipboardUnsupportedError,
} from './sensitive-clipboard.service';

describe('SensitiveClipboardService', () => {
  let service: SensitiveClipboardService;
  let mockClipboard: {
    writeText: ReturnType<typeof vi.fn>;
    readText: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();

    mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    };

    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      configurable: true,
      writable: true,
    });

    TestBed.configureTestingModule({
      providers: [SensitiveClipboardService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(SensitiveClipboardService);
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  describe('ClipboardUnsupportedError', () => {
    it('creates error with correct properties', () => {
      const err = new ClipboardUnsupportedError();
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('ClipboardUnsupportedError');
      expect(err.message).toBe('Clipboard API not available in this environment');
    });
  });

  describe('isSupported', () => {
    it('returns true when in browser with writeText available', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('returns false in server environment (SSR)', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [SensitiveClipboardService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const ssrService = TestBed.inject(SensitiveClipboardService);
      expect(ssrService.isSupported()).toBe(false);
    });

    it('returns false when navigator.clipboard is undefined', () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      });
      expect(service.isSupported()).toBe(false);
    });
  });

  describe('copy', () => {
    it('throws ClipboardUnsupportedError when not supported', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [SensitiveClipboardService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const ssrService = TestBed.inject(SensitiveClipboardService);

      await expect(ssrService.copy('secret')).rejects.toThrow(ClipboardUnsupportedError);
    });

    it('writes text to clipboard and schedules auto-clear after 15s by default', async () => {
      mockClipboard.readText.mockResolvedValue('secret-pwd');

      await service.copy('secret-pwd');
      expect(mockClipboard.writeText).toHaveBeenCalledWith('secret-pwd');

      // Fast forward before timeout -> clear should not happen yet
      vi.advanceTimersByTime(14_999);
      expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);

      // Fast forward past timeout -> auto-clears
      await vi.advanceTimersByTimeAsync(2);
      expect(mockClipboard.readText).toHaveBeenCalled();
      expect(mockClipboard.writeText).toHaveBeenCalledWith('');
    });

    it('does not schedule auto-clear when clearAfterMs is 0', async () => {
      await service.copy('secret-pwd', { clearAfterMs: 0 });
      expect(mockClipboard.writeText).toHaveBeenCalledWith('secret-pwd');

      await vi.advanceTimersByTimeAsync(30_000);
      expect(mockClipboard.readText).not.toHaveBeenCalled();
      expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
    });

    it('custom clearAfterMs clears after the specified time', async () => {
      mockClipboard.readText.mockResolvedValue('custom-pwd');

      await service.copy('custom-pwd', { clearAfterMs: 5000 });

      vi.advanceTimersByTime(4999);
      expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(2);
      expect(mockClipboard.writeText).toHaveBeenCalledWith('');
    });

    it('does not overwrite clipboard if user copied something else in the meantime', async () => {
      mockClipboard.readText.mockResolvedValue('unrelated user text');

      await service.copy('original secret', { clearAfterMs: 5000 });
      await vi.advanceTimersByTimeAsync(5001);

      expect(mockClipboard.readText).toHaveBeenCalled();
      // Should NOT clear
      expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
      expect(mockClipboard.writeText).not.toHaveBeenCalledWith('');
    });

    it('handles clipboard.readText rejection gracefully without throwing', async () => {
      mockClipboard.readText.mockRejectedValue(new Error('Permission denied'));

      await service.copy('secret', { clearAfterMs: 1000 });
      await vi.advanceTimersByTimeAsync(1001);

      expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
    });
  });

  describe('copy$ (Observable)', () => {
    it('errors when not supported', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [SensitiveClipboardService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const ssrService = TestBed.inject(SensitiveClipboardService);

      let caughtError: any;
      ssrService.copy$('secret').subscribe({
        error: (err) => (caughtError = err),
      });

      expect(caughtError).toBeInstanceOf(ClipboardUnsupportedError);
    });

    it('emits copied then cleared when auto-cleared successfully', async () => {
      mockClipboard.readText.mockResolvedValue('secret-123');

      const emissions: string[] = [];
      let completed = false;

      service.copy$('secret-123', { clearAfterMs: 2000 }).subscribe({
        next: (val) => emissions.push(val),
        complete: () => (completed = true),
      });

      // Microtask resolution of writeText
      await vi.advanceTimersByTimeAsync(0);
      expect(emissions).toEqual(['copied']);
      expect(completed).toBe(false);

      // Fast forward past clear timer
      await vi.advanceTimersByTimeAsync(2000);
      expect(emissions).toEqual(['copied', 'cleared']);
      expect(completed).toBe(true);
    });

    it('emits copied and completes immediately when clearAfterMs is 0', async () => {
      const emissions: string[] = [];
      let completed = false;

      service.copy$('secret', { clearAfterMs: 0 }).subscribe({
        next: (val) => emissions.push(val),
        complete: () => (completed = true),
      });

      await vi.advanceTimersByTimeAsync(0);
      expect(emissions).toEqual(['copied']);
      expect(completed).toBe(true);
    });

    it('emits copied then read-denied when clipboard content changed or permission denied', async () => {
      mockClipboard.readText.mockRejectedValue(new Error('Denied'));

      const emissions: string[] = [];
      let completed = false;

      service.copy$('secret', { clearAfterMs: 1000 }).subscribe({
        next: (val) => emissions.push(val),
        complete: () => (completed = true),
      });

      await vi.advanceTimersByTimeAsync(0);
      expect(emissions).toEqual(['copied']);

      await vi.advanceTimersByTimeAsync(1000);
      expect(emissions).toEqual(['copied', 'read-denied']);
      expect(completed).toBe(true);
    });

    it('emits error and completes when writeText fails', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Write failed'));

      const emissions: string[] = [];
      let completed = false;

      service.copy$('secret').subscribe({
        next: (val) => emissions.push(val),
        complete: () => (completed = true),
      });

      await vi.advanceTimersByTimeAsync(0);
      expect(emissions).toEqual(['error']);
      expect(completed).toBe(true);
    });

    it('cancels pending timer when unsubscribed', async () => {
      mockClipboard.readText.mockResolvedValue('secret');

      const emissions: string[] = [];
      const sub = service.copy$('secret', { clearAfterMs: 5000 }).subscribe({
        next: (val) => emissions.push(val),
      });

      await vi.advanceTimersByTimeAsync(0);
      expect(emissions).toEqual(['copied']);

      sub.unsubscribe();

      await vi.advanceTimersByTimeAsync(6000);
      expect(emissions).toEqual(['copied']);
      expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelPendingClear and clear', () => {
    it('cancels pending clear timer', async () => {
      mockClipboard.readText.mockResolvedValue('secret');

      await service.copy('secret', { clearAfterMs: 5000 });
      service.cancelPendingClear();

      await vi.advanceTimersByTimeAsync(10_000);
      expect(mockClipboard.readText).not.toHaveBeenCalled();
    });

    it('forcefully clears clipboard', async () => {
      await service.clear();
      expect(mockClipboard.writeText).toHaveBeenCalledWith('');
    });

    it('clear handles writeText rejection and unsupported environment gracefully', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Failed'));
      await expect(service.clear()).resolves.toBeUndefined();

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [SensitiveClipboardService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const ssrService = TestBed.inject(SensitiveClipboardService);
      await expect(ssrService.clear()).resolves.toBeUndefined();
    });
  });
});
