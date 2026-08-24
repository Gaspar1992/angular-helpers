import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectGamepad } from './inject-gamepad';

describe('injectGamepad', () => {
  let mockGamepad: any;

  beforeEach(() => {
    mockGamepad = {
      id: 'Pad1',
      index: 0,
      connected: true,
      buttons: [{ pressed: true, value: 1 }],
      axes: [0, 1],
      timestamp: 100,
    };

    vi.stubGlobal('navigator', {
      getGamepads: vi.fn().mockReturnValue([mockGamepad]),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw when called outside injection context', () => {
    expect(() => injectGamepad(0)).toThrow(/injectGamepad/);
  });

  it('should track gamepad state in browser', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.runInInjectionContext(async () => {
      const ref = injectGamepad(0, 50);
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(ref.state()).toEqual(mockGamepad);
      expect(ref.connected()).toBe(true);
      expect(ref.buttons().length).toBe(1);
      expect(ref.axes()).toEqual([0, 1]);
    });
  });

  it('should handle disconnected state on server', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    TestBed.runInInjectionContext(() => {
      const ref = injectGamepad(0);
      expect(ref.state()).toBeNull();
      expect(ref.connected()).toBe(false);
      expect(ref.buttons()).toEqual([]);
      expect(ref.axes()).toEqual([]);
    });
  });
});
