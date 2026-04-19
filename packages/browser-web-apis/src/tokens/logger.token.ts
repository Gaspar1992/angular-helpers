import { inject, InjectionToken, isDevMode } from '@angular/core';

export type BrowserApiLogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface BrowserApiLogger {
  debug?(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: unknown): void;
}

const LEVEL_RANK: Record<BrowserApiLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

/**
 * Global log level for `BROWSER_API_LOGGER`. Defaults to `'debug'` in dev mode and
 * `'warn'` in production. Override via `provideBrowserApiLogLevel('silent')` etc.
 */
export const BROWSER_API_LOG_LEVEL = new InjectionToken<BrowserApiLogLevel>(
  'BROWSER_API_LOG_LEVEL',
  {
    providedIn: 'root',
    factory: () => (isDevMode() ? 'debug' : 'warn'),
  },
);

export const BROWSER_API_LOGGER = new InjectionToken<BrowserApiLogger>('BROWSER_API_LOGGER', {
  providedIn: 'root',
  factory: () => {
    const level = inject(BROWSER_API_LOG_LEVEL);
    return createLevelGatedLogger(level);
  },
});

function createLevelGatedLogger(level: BrowserApiLogLevel): BrowserApiLogger {
  const min = LEVEL_RANK[level];
  return {
    debug: (message) => {
      if (LEVEL_RANK.debug < min) return;
      // oxlint-disable-next-line no-console
      console.debug(message);
    },
    info: (message) => {
      if (LEVEL_RANK.info < min) return;
      // oxlint-disable-next-line no-console
      console.info(message);
    },
    warn: (message) => {
      if (LEVEL_RANK.warn < min) return;
      // oxlint-disable-next-line no-console
      console.warn(message);
    },
    error: (message, error) => {
      if (LEVEL_RANK.error < min) return;
      // oxlint-disable-next-line no-console
      console.error(message, error);
    },
  };
}

/** Log level helper provider. Overrides the default `BROWSER_API_LOG_LEVEL`. */
export function provideBrowserApiLogLevel(level: BrowserApiLogLevel) {
  return { provide: BROWSER_API_LOG_LEVEL, useValue: level };
}
