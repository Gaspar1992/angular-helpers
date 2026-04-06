import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';

import {
  type GamepadState,
  isGamepadSupported,
  gamepadSnapshot,
  gamepadConnectionStream,
  gamepadPollStream,
} from '../utils/gamepad.utils';

export type { GamepadState };

@Injectable()
export class GamepadService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'gamepad';
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && isGamepadSupported();
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
