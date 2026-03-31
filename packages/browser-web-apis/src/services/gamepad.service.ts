import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

import {
  type GamepadState,
  isGamepadSupported,
  gamepadSnapshot,
  gamepadConnectionStream,
  gamepadPollStream,
} from '../utils/gamepad.utils';

export type { GamepadState };

@Injectable()
export class GamepadService {
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && isGamepadSupported();
  }

  getSnapshot(index: number): GamepadState | null {
    if (!this.isSupported()) return null;
    return gamepadSnapshot(index);
  }

  getConnectedGamepads(): GamepadState[] {
    if (!this.isSupported()) return [];
    return navigator
      .getGamepads()
      .filter((gp): gp is Gamepad => gp !== null)
      .map((gp) => ({
        id: gp.id,
        index: gp.index,
        connected: gp.connected,
        buttons: gp.buttons.map((b) => ({ pressed: b.pressed, value: b.value })),
        axes: Array.from(gp.axes),
        timestamp: gp.timestamp,
      }));
  }

  watchConnections(): Observable<{ gamepad: GamepadState; type: 'connected' | 'disconnected' }> {
    if (!this.isSupported()) {
      return new Observable((o) => o.error(new Error('Gamepad API not supported')));
    }
    return gamepadConnectionStream();
  }

  poll(index: number, intervalMs = 16): Observable<GamepadState> {
    if (!this.isSupported()) {
      return new Observable((o) => o.error(new Error('Gamepad API not supported')));
    }
    return gamepadPollStream(index, intervalMs);
  }
}
