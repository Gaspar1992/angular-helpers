import { assertInInjectionContext, ErrorHandler, inject, InjectionToken } from '@angular/core';

/**
 * Interface representing an ErrorBoundary handler or custom error-capturing provider.
 */
export interface ErrorBoundaryHandler {
  handleError(error: unknown): void;
  reportError?(error: unknown): void;
}

/**
 * Injection token for an explicit ErrorBoundary or boundary handler in Angular component hierarchies.
 */
export const ERROR_BOUNDARY = new InjectionToken<ErrorBoundaryHandler>('ERROR_BOUNDARY');

export interface ErrorBoundaryReporterOptions {
  /**
   * If true, errors reported will be rethrown after dispatching to boundary or ErrorHandler.
   * Default: false
   */
  rethrow?: boolean;
}

export type ErrorBoundaryReporter = (error: unknown) => void;

/**
 * Creates an error reporting function that declaratively propagates errors
 * to the nearest ErrorBoundary / boundary provider, falling back to Angular's ErrorHandler.
 */
export function injectErrorBoundaryReporter(
  options?: ErrorBoundaryReporterOptions,
): ErrorBoundaryReporter {
  assertInInjectionContext(injectErrorBoundaryReporter);

  const boundary = inject(ERROR_BOUNDARY, { optional: true });
  const errorHandler = inject(ErrorHandler, { optional: true });

  return (error: unknown): void => {
    if (boundary) {
      if (typeof boundary.reportError === 'function') {
        boundary.reportError(error);
      } else if (typeof boundary.handleError === 'function') {
        boundary.handleError(error);
      }
    } else if (errorHandler) {
      errorHandler.handleError(error);
    } else {
      // Fallback in environments without injector error handling
      // oxlint-disable-next-line no-console
      console.error('[ErrorBoundaryReporter] Unhandled error:', error);
    }

    if (options?.rethrow) {
      throw error;
    }
  };
}
