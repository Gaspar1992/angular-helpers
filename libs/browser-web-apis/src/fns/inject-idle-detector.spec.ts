import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectIdleDetector } from './inject-idle-detector';

describe('injectIdleDetector', () => {
  let mockDetectorInstance: any;

  beforeEach(() => {
    mockDetectorInstance = {
      userState: 'active',
      screenState: 'unlocked',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      start: vi.fn().mockResolvedValue(undefined),
    };

    class MockIdleDetector {
      constructor() {
        return mockDetectorInstance;
      }
      static requestPermission = vi.fn().mockResolvedValue('granted');
    }

    vi.stubGlobal('IdleDetector', MockIdleDetector);
    vi.stubGlobal('isSecureContext', true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectIdleDetector()).toThrow(/injectIdleDetector/);
  });

  it('should start and stop tracking idle state in browser', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectIdleDetector();
      await new Promise((resolve) => queueMicrotask(resolve));

      expect(ref.isSupported()).toBe(true);

      const perm = await ref.requestPermission();
      expect(perm).toBe('granted');

      await ref.start({ threshold: 60000 });
      expect(ref.isTracking()).toBe(true);
      expect(ref.isIdle()).toBe(false);

      ref.stop();
      expect(ref.isTracking()).toBe(false);
    });
  });

  it('should handle start error when unsupported', async () => {
    delete (window as any).IdleDetector;
    delete (globalThis as any).IdleDetector;

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectIdleDetector();
      await new Promise((resolve) => queueMicrotask(resolve));

      expect(ref.isSupported()).toBe(false);
      await ref.start({ threshold: 60000 });
      expect(ref.error()?.message).toContain('IdleDetector API is not supported');
    });
  });
});
