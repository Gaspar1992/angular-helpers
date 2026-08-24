import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectScreenOrientation } from './inject-screen-orientation';

describe('injectScreenOrientation', () => {
  let mockOrientation: any;

  beforeEach(() => {
    mockOrientation = {
      type: 'portrait-primary',
      angle: 0,
      lock: vi.fn().mockResolvedValue(undefined),
      unlock: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.stubGlobal('screen', {
      orientation: mockOrientation,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectScreenOrientation()).toThrow(/injectScreenOrientation/);
  });

  it('should track orientation state and expose lock/unlock', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectScreenOrientation();
      await new Promise((resolve) => queueMicrotask(resolve));

      expect(ref.type()).toBe('portrait-primary');
      expect(ref.angle()).toBe(0);
      expect(ref.isPortrait()).toBe(true);
      expect(ref.isLandscape()).toBe(false);

      await ref.lock('landscape');
      expect(mockOrientation.lock).toHaveBeenCalledWith('landscape');

      ref.unlock();
      expect(mockOrientation.unlock).toHaveBeenCalled();
    });
  });
});
