import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { firstValueFrom, take } from 'rxjs';
import {
  isGamepadSupported,
  gamepadSnapshot,
  gamepadConnectionStream,
  gamepadPollStream,
} from './gamepad.utils';

describe('gamepad.utils', () => {
  let mockGamepad: any;

  beforeEach(() => {
    mockGamepad = {
      id: 'Pad1',
      index: 0,
      connected: true,
      buttons: [{ pressed: true, value: 1 }],
      axes: [0.5, -0.5],
      timestamp: 1000,
    };

    vi.stubGlobal('navigator', {
      getGamepads: vi.fn().mockReturnValue([mockGamepad]),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should check isGamepadSupported', () => {
    expect(isGamepadSupported()).toBe(true);
    vi.stubGlobal('navigator', {});
    expect(isGamepadSupported()).toBe(false);
  });

  it('should take gamepadSnapshot', () => {
    const snap = gamepadSnapshot(0);
    expect(snap).toEqual({
      id: 'Pad1',
      index: 0,
      connected: true,
      buttons: [{ pressed: true, value: 1 }],
      axes: [0.5, -0.5],
      timestamp: 1000,
    });

    expect(gamepadSnapshot(1)).toBeNull();
  });

  it('should handle gamepadConnectionStream events', async () => {
    const stream$ = gamepadConnectionStream();
    const emitted: any[] = [];
    const sub = stream$.subscribe((val) => emitted.push(val));

    const connectEvent = new Event('gamepadconnected') as any;
    connectEvent.gamepad = mockGamepad;
    window.dispatchEvent(connectEvent);

    const disconnectEvent = new Event('gamepaddisconnected') as any;
    disconnectEvent.gamepad = { id: 'Pad1', index: 0, timestamp: 2000 };
    window.dispatchEvent(disconnectEvent);

    expect(emitted.length).toBe(2);
    expect(emitted[0].type).toBe('connected');
    expect(emitted[1].type).toBe('disconnected');

    sub.unsubscribe();
  });

  it('should poll using interval when intervalMs > 16', async () => {
    const poll$ = gamepadPollStream(0, 50);
    const snap = await firstValueFrom(poll$.pipe(take(1)));
    expect(snap.id).toBe('Pad1');
  });

  it('should poll using requestAnimationFrame when intervalMs <= 16', async () => {
    let rafCb: any = null;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb) => {
        rafCb = cb;
        return 123;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const poll$ = gamepadPollStream(0, 16);
    const emitted: any[] = [];
    const sub = poll$.subscribe((s) => emitted.push(s));

    if (rafCb) rafCb();
    expect(emitted.length).toBeGreaterThanOrEqual(1);

    sub.unsubscribe();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(123);
  });
});
