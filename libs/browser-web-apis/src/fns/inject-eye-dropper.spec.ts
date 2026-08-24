import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectEyeDropper } from './inject-eye-dropper';

describe('injectEyeDropper', () => {
  let mockDropperInstance: any;

  beforeEach(() => {
    mockDropperInstance = {
      open: vi.fn().mockResolvedValue({ sRGBHex: '#00ff00' }),
    };

    class MockEyeDropper {
      constructor() {
        return mockDropperInstance;
      }
    }

    vi.stubGlobal('EyeDropper', MockEyeDropper);
    vi.stubGlobal('isSecureContext', true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectEyeDropper()).toThrow(/injectEyeDropper/);
  });

  it('should open eye dropper and update color signal', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectEyeDropper();
      await new Promise((resolve) => queueMicrotask(resolve));

      expect(ref.isSupported()).toBe(true);

      const result = await ref.open();
      expect(result).toEqual({ sRGBHex: '#00ff00' });
      expect(ref.color()).toBe('#00ff00');
      expect(ref.isOpening()).toBe(false);
    });
  });

  it('should handle user cancellation (AbortError) gracefully', async () => {
    mockDropperInstance.open.mockRejectedValue(new DOMException('User canceled', 'AbortError'));

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectEyeDropper();
      await new Promise((resolve) => queueMicrotask(resolve));

      const result = await ref.open();
      expect(result).toBeNull();
      expect(ref.error()).toBeNull();
    });
  });

  it('should handle open errors', async () => {
    mockDropperInstance.open.mockRejectedValue(new Error('Hardware error'));

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectEyeDropper();
      await new Promise((resolve) => queueMicrotask(resolve));

      const result = await ref.open();
      expect(result).toBeNull();
      expect(ref.error()?.message).toBe('Hardware error');
    });
  });
});
