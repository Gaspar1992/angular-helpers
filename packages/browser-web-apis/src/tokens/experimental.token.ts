import { InjectionToken } from '@angular/core';

/**
 * When set to `true`, suppresses the one-time runtime warning that experimental
 * services emit on first use. Default is `false` (warnings emitted).
 */
export const BROWSER_API_EXPERIMENTAL_SILENT = new InjectionToken<boolean>(
  'BROWSER_API_EXPERIMENTAL_SILENT',
  {
    providedIn: 'root',
    factory: () => false,
  },
);

const warned = new Set<string>();

export interface ExperimentalWarnContext {
  silent: boolean;
  // oxlint-disable-next-line no-explicit-any
  logger: { warn: (message: string) => void };
}

/**
 * Emit a one-time runtime warning explaining that the API is experimental and
 * subject to breaking changes. No-op after the first call for a given key, or if
 * the consumer has provided `BROWSER_API_EXPERIMENTAL_SILENT` as `true`.
 */
export function warnExperimental(key: string, context: ExperimentalWarnContext): void {
  if (context.silent) return;
  if (warned.has(key)) return;
  warned.add(key);
  context.logger.warn(
    `[browser-web-apis:experimental] "${key}" is part of the experimental surface ` +
      'and may change without a major bump. Provide BROWSER_API_EXPERIMENTAL_SILENT=true ' +
      'to suppress this warning.',
  );
}

/** Test-only: reset the in-memory dedup set. */
export function resetExperimentalWarnings(): void {
  warned.clear();
}
