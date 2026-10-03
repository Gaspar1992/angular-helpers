import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isScreenOrientationSupported,
  getOrientationSnapshot,
  screenOrientationStream,
} from './screen-orientation.utils';

describe('screen-orientation.utils', () => {
  let originalScreen: any;

  beforeEach(() => {
    originalScreen = (globalThis as any).screen;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).screen = originalScreen;
  });

  it('isScreenOrientationSupported checks screen.orientation existence', () => {
    (globalThis as any).screen = { orientation: { type: 'portrait-primary', angle: 0 } };
    expect(isScreenOrientationSupported()).toBe(true);
  });

  it('getOrientationSnapshot returns default fallback if unsupported', () => {
    (globalThis as any).screen = {};
    expect(getOrientationSnapshot()).toEqual({ type: 'portrait-primary', angle: 0 });
  });

  it('getOrientationSnapshot returns current orientation when supported', () => {
    (globalThis as any).screen = {
      orientation: {
        type: 'landscape-primary',
        angle: 90,
      },
    };
    expect(getOrientationSnapshot()).toEqual({ type: 'landscape-primary', angle: 90 });
  });

  it('screenOrientationStream emits orientation and updates on change event', () => {
    let changeHandler: (() => void) | null = null;
    (globalThis as any).screen = {
      orientation: {
        type: 'portrait-primary',
        angle: 0,
        addEventListener: vi.fn((event: string, handler: () => void) => {
          if (event === 'change') changeHandler = handler;
        }),
        removeEventListener: vi.fn(),
      },
    };

    const emitted: any[] = [];
    const sub = screenOrientationStream().subscribe((val) => emitted.push(val));

    expect(emitted[0]).toEqual({ type: 'portrait-primary', angle: 0 });

    (globalThis as any).screen.orientation.type = 'landscape-secondary';
    (globalThis as any).screen.orientation.angle = 270;
    changeHandler?.();

    expect(emitted[1]).toEqual({ type: 'landscape-secondary', angle: 270 });

    sub.unsubscribe();
    expect((globalThis as any).screen.orientation.removeEventListener).toHaveBeenCalled();
  });
});
