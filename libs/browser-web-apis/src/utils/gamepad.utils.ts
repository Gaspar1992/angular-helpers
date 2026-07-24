import { Observable } from 'rxjs';

export interface GamepadState {
  id: string;
  index: number;
  connected: boolean;
  buttons: ReadonlyArray<{ pressed: boolean; value: number }>;
  axes: readonly number[];
  timestamp: number;
}

export function isGamepadSupported(): boolean {
  return typeof navigator !== 'undefined' && 'getGamepads' in navigator;
}

export function gamepadSnapshot(index: number): GamepadState | null {
  const gp = navigator.getGamepads()[index];
  if (!gp) return null;
  return {
    id: gp.id,
    index: gp.index,
    connected: gp.connected,
    buttons: gp.buttons.map((b) => ({ pressed: b.pressed, value: b.value })),
    axes: Array.from(gp.axes),
    timestamp: gp.timestamp,
  };
}

export function gamepadConnectionStream(): Observable<{
  gamepad: GamepadState;
  type: 'connected' | 'disconnected';
}> {
  return new Observable((subscriber) => {
    const onConnect = (e: GamepadEvent) => {
      const gp = e.gamepad;
      subscriber.next({
        type: 'connected',
        gamepad: {
          id: gp.id,
          index: gp.index,
          connected: true,
          buttons: gp.buttons.map((b) => ({ pressed: b.pressed, value: b.value })),
          axes: Array.from(gp.axes),
          timestamp: gp.timestamp,
        },
      });
    };

    const onDisconnect = (e: GamepadEvent) => {
      subscriber.next({
        type: 'disconnected',
        gamepad: {
          id: e.gamepad.id,
          index: e.gamepad.index,
          connected: false,
          buttons: [],
          axes: [],
          timestamp: e.gamepad.timestamp,
        },
      });
    };

    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);

    return () => {
      window.removeEventListener('gamepadconnected', onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
    };
  });
}

export function gamepadPollStream(index: number, intervalMs = 16): Observable<GamepadState> {
  return new Observable<GamepadState>((subscriber) => {
    let rafId: number;

    const poll = () => {
      const state = gamepadSnapshot(index);
      if (state) {
        subscriber.next(state);
      }
      rafId = requestAnimationFrame(poll);
    };

    if (intervalMs <= 16) {
      rafId = requestAnimationFrame(poll);
      return () => cancelAnimationFrame(rafId);
    }

    const intervalId = setInterval(() => {
      const state = gamepadSnapshot(index);
      if (state) subscriber.next(state);
    }, intervalMs);

    return () => clearInterval(intervalId);
  });
}
