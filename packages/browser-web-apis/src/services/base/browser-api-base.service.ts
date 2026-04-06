import { Injectable, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

/**
 * Base class for all Browser Web API services.
 * Provides common functionality for:
 * - Platform detection (browser vs server)
 * - Support assertion via Template Method
 * - Error creation with cause chaining
 * - Structured logging
 * - Lifecycle management with destroyRef
 *
 * Services that also need permission querying should extend
 * `PermissionAwareBrowserApiBaseService` instead.
 */
@Injectable()
export abstract class BrowserApiBaseService {
  protected destroyRef = inject(DestroyRef);
  protected platformId = inject(PLATFORM_ID);

  /**
   * Abstract method that must be implemented by child services.
   * Returns the API name used in log messages and error strings.
   */
  protected abstract getApiName(): string;

  /**
   * Check if running in browser environment using Angular's platform detection.
   */
  protected isBrowserEnvironment(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Check if running in server environment using Angular's platform detection.
   */
  protected isServerEnvironment(): boolean {
    return isPlatformServer(this.platformId);
  }

  /**
   * Template Method: throws a standard error when the API is not available.
   * Uses getApiName() to produce consistent error messages.
   */
  protected ensureSupported(): void {
    if (!this.isBrowserEnvironment()) {
      throw new Error(`${this.getApiName()} API not available in server environment`);
    }
  }

  /**
   * Create an error with proper cause chaining.
   */
  protected createError(message: string, cause?: unknown): Error {
    const error = new Error(message);
    if (cause !== undefined) {
      (error as Error & { cause: unknown }).cause = cause;
    }
    return error;
  }

  /**
   * Log an error with the service name as prefix.
   */
  protected logError(message: string, error?: unknown): void {
    console.error(`[${this.getApiName()}] ${message}`, error);
  }

  /**
   * Log an informational message with the service name as prefix.
   */
  protected logInfo(message: string): void {
    console.info(`[${this.getApiName()}] ${message}`);
  }
}
