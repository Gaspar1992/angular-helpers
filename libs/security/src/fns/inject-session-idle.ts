import { DestroyRef, inject, type Signal } from '@angular/core';
import { SessionIdleService, type SessionIdleConfig } from '../services/session-idle.service';

export interface SessionIdleRef {
  readonly isIdle: Signal<boolean>;
  readonly isWarning: Signal<boolean>;
  readonly timeRemaining: Signal<number | null>;
  start: (config: SessionIdleConfig) => void;
  stop: () => void;
  reset: () => void;
}

/**
 * Signal-first injection primitive for {@link SessionIdleService}.
 * Optionally auto-starts monitoring when `initialConfig` is provided and stops on destroy.
 */
export function injectSessionIdle(initialConfig?: SessionIdleConfig): SessionIdleRef {
  const service = inject(SessionIdleService);
  const destroyRef = inject(DestroyRef);

  if (initialConfig) {
    service.start(initialConfig);
  }

  destroyRef.onDestroy(() => service.stop());

  return {
    isIdle: service.isIdle,
    isWarning: service.isWarning,
    timeRemaining: service.timeRemaining,
    start: (config) => service.start(config),
    stop: () => service.stop(),
    reset: () => service.reset(),
  };
}
