import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NgZone } from '@angular/core';
import {
  isDeviceOrientationSupported,
  isDeviceMotionSupported,
  createDeviceOrientationStream,
  createDeviceMotionStream,
  requestDeviceOrientationPermission,
  requestDeviceMotionPermission,
} from './device-orientation.utils';

describe('device-orientation.utils', () => {
  let mockZone: NgZone;

  beforeEach(() => {
    mockZone = {
      runOutsideAngular: vi.fn((fn) => fn()),
      run: vi.fn((fn) => fn()),
    } as unknown as NgZone;

    vi.stubGlobal('isSecureContext', true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isDeviceOrientationSupported', () => {
    it('should return true when DeviceOrientationEvent is present', () => {
      vi.stubGlobal('DeviceOrientationEvent', class {});
      expect(isDeviceOrientationSupported()).toBe(true);
    });

    it('should return false when DeviceOrientationEvent is absent', () => {
      const original = (globalThis as any).DeviceOrientationEvent;
      delete (globalThis as any).DeviceOrientationEvent;
      if (typeof window !== 'undefined') {
        delete (window as any).DeviceOrientationEvent;
      }
      try {
        expect(isDeviceOrientationSupported()).toBe(false);
      } finally {
        if (original !== undefined) {
          (globalThis as any).DeviceOrientationEvent = original;
        }
      }
    });
  });

  describe('isDeviceMotionSupported', () => {
    it('should return true when DeviceMotionEvent is present', () => {
      vi.stubGlobal('DeviceMotionEvent', class {});
      expect(isDeviceMotionSupported()).toBe(true);
    });

    it('should return false when DeviceMotionEvent is absent', () => {
      const original = (globalThis as any).DeviceMotionEvent;
      delete (globalThis as any).DeviceMotionEvent;
      if (typeof window !== 'undefined') {
        delete (window as any).DeviceMotionEvent;
      }
      try {
        expect(isDeviceMotionSupported()).toBe(false);
      } finally {
        if (original !== undefined) {
          (globalThis as any).DeviceMotionEvent = original;
        }
      }
    });
  });

  describe('createDeviceOrientationStream', () => {
    it('should run outside angular by default', () => {
      vi.stubGlobal('DeviceOrientationEvent', class {});
      const stream$ = createDeviceOrientationStream({}, mockZone);
      const sub = stream$.subscribe();
      expect(mockZone.runOutsideAngular).toHaveBeenCalled();
      sub.unsubscribe();
    });

    it('should run inside angular if runOutsideAngular is false', () => {
      vi.stubGlobal('DeviceOrientationEvent', class {});
      const stream$ = createDeviceOrientationStream({ runOutsideAngular: false }, mockZone);
      const sub = stream$.subscribe();
      expect(mockZone.runOutsideAngular).not.toHaveBeenCalled();
      sub.unsubscribe();
    });

    it('should throttle emissions when throttleTime is configured', () => {
      vi.useFakeTimers();
      vi.stubGlobal('DeviceOrientationEvent', class {});
      const listeners: Record<string, EventListener> = {};
      const addEventListenerSpy = vi
        .spyOn(window, 'addEventListener')
        .mockImplementation((event, cb) => {
          listeners[event] = cb as EventListener;
        });

      const emitted: any[] = [];
      const stream$ = createDeviceOrientationStream({ throttleTime: 100 }, mockZone);
      const sub = stream$.subscribe((val) => emitted.push(val));

      const handler = listeners['deviceorientation'];
      expect(handler).toBeDefined();

      handler({ alpha: 1, beta: 2, gamma: 3, absolute: true } as unknown as Event);
      expect(emitted).toEqual([{ alpha: 1, beta: 2, gamma: 3, absolute: true }]);

      vi.advanceTimersByTime(50);
      handler({ alpha: 10, beta: 20, gamma: 30, absolute: true } as unknown as Event);
      expect(emitted).toHaveLength(1);

      vi.advanceTimersByTime(50);
      handler({ alpha: 100, beta: 200, gamma: 300, absolute: true } as unknown as Event);
      expect(emitted).toHaveLength(2);
      expect(emitted[1]).toEqual({ alpha: 100, beta: 200, gamma: 300, absolute: true });

      sub.unsubscribe();
      addEventListenerSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe('createDeviceMotionStream', () => {
    it('should run outside angular by default', () => {
      vi.stubGlobal('DeviceMotionEvent', class {});
      const stream$ = createDeviceMotionStream({}, mockZone);
      const sub = stream$.subscribe();
      expect(mockZone.runOutsideAngular).toHaveBeenCalled();
      sub.unsubscribe();
    });

    it('should run inside angular if runOutsideAngular is false', () => {
      vi.stubGlobal('DeviceMotionEvent', class {});
      const stream$ = createDeviceMotionStream({ runOutsideAngular: false }, mockZone);
      const sub = stream$.subscribe();
      expect(mockZone.runOutsideAngular).not.toHaveBeenCalled();
      sub.unsubscribe();
    });

    it('should throttle emissions when throttleTime is configured', () => {
      vi.useFakeTimers();
      vi.stubGlobal('DeviceMotionEvent', class {});
      const listeners: Record<string, EventListener> = {};
      const addEventListenerSpy = vi
        .spyOn(window, 'addEventListener')
        .mockImplementation((event, cb) => {
          listeners[event] = cb as EventListener;
        });

      const emitted: any[] = [];
      const stream$ = createDeviceMotionStream({ throttleTime: 100 }, mockZone);
      const sub = stream$.subscribe((val) => emitted.push(val));

      const handler = listeners['devicemotion'];
      expect(handler).toBeDefined();

      handler({
        acceleration: { x: 1, y: 2, z: 3 },
        accelerationIncludingGravity: null,
        rotationRate: null,
        interval: 16,
      } as unknown as Event);
      expect(emitted).toEqual([
        {
          acceleration: { x: 1, y: 2, z: 3 },
          accelerationIncludingGravity: null,
          rotationRate: null,
          interval: 16,
        },
      ]);

      vi.advanceTimersByTime(50);
      handler({
        acceleration: { x: 10, y: 20, z: 30 },
        accelerationIncludingGravity: null,
        rotationRate: null,
        interval: 16,
      } as unknown as Event);
      expect(emitted).toHaveLength(1);

      vi.advanceTimersByTime(50);
      handler({
        acceleration: { x: 100, y: 200, z: 300 },
        accelerationIncludingGravity: null,
        rotationRate: null,
        interval: 16,
      } as unknown as Event);
      expect(emitted).toHaveLength(2);
      expect(emitted[1]).toEqual({
        acceleration: { x: 100, y: 200, z: 300 },
        accelerationIncludingGravity: null,
        rotationRate: null,
        interval: 16,
      });

      sub.unsubscribe();
      addEventListenerSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe('requestDeviceOrientationPermission', () => {
    it('should resolve to granted immediately when requestPermission is not a function', async () => {
      vi.stubGlobal('DeviceOrientationEvent', class {});
      const res = await requestDeviceOrientationPermission();
      expect(res).toBe('granted');
    });

    it('should call static requestPermission on DeviceOrientationEvent when present', async () => {
      const requestPermissionMock = vi.fn().mockResolvedValue('granted');
      vi.stubGlobal('DeviceOrientationEvent', {
        requestPermission: requestPermissionMock,
      });

      const res = await requestDeviceOrientationPermission();
      expect(requestPermissionMock).toHaveBeenCalled();
      expect(res).toBe('granted');
    });
  });

  describe('requestDeviceMotionPermission', () => {
    it('should resolve to granted immediately when requestPermission is not a function', async () => {
      vi.stubGlobal('DeviceMotionEvent', class {});
      const res = await requestDeviceMotionPermission();
      expect(res).toBe('granted');
    });

    it('should call static requestPermission on DeviceMotionEvent when present', async () => {
      const requestPermissionMock = vi.fn().mockResolvedValue('denied');
      vi.stubGlobal('DeviceMotionEvent', {
        requestPermission: requestPermissionMock,
      });

      const res = await requestDeviceMotionPermission();
      expect(requestPermissionMock).toHaveBeenCalled();
      expect(res).toBe('denied');
    });
  });
});
