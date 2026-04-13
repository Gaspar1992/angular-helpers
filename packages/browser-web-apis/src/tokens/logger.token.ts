import { InjectionToken } from '@angular/core';

export interface BrowserApiLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: unknown): void;
}

export const BROWSER_API_LOGGER = new InjectionToken<BrowserApiLogger>('BROWSER_API_LOGGER', {
  providedIn: 'root',
  factory: () => ({
    // oxlint-disable-next-line no-console
    info: (message: string) => console.info(message),
    // oxlint-disable-next-line no-console
    warn: (message: string) => console.warn(message),
    // oxlint-disable-next-line no-console
    error: (message: string, error?: unknown) => console.error(message, error),
  }),
});
