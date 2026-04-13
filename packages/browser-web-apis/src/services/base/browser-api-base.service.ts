import { Injectable, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { BROWSER_API_LOGGER } from '../../tokens/logger.token';

/**
 * Base class for all Browser Web API services.
 * Provides common functionality for:
 * - Platform detection (browser vs server)
 * - Support assertion via Template Method
 * - Error creation with cause chaining
 * - Structured logging via injectable BROWSER_API_LOGGER token
 * - Lifecycle management with destroyRef
 *
 * Services that also need permission querying should extend
 * `PermissionAwareBrowserApiBaseService` instead.
 */
@Injectable()
export abstract class BrowserApiBaseService {
  protected destroyRef = inject(DestroyRef);
  protected platformId = inject(PLATFORM_ID);
  private readonly logger = inject(BROWSER_API_LOGGER);

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
   * Template Method: asserts the service can run in the current environment.
   * Subclasses must call super.ensureSupported() and then add their own API check.
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
   * Log an error through the injected BROWSER_API_LOGGER (default: console).
   */
  protected logError(message: string, error?: unknown): void {
    this.logger.error(`[${this.getApiName()}] ${message}`, error);
  }

  /**
   * Log a warning through the injected BROWSER_API_LOGGER (default: console).
   */
  protected logWarn(message: string): void {
    this.logger.warn(`[${this.getApiName()}] ${message}`);
  }

  /**
   * Log an informational message through the injected BROWSER_API_LOGGER (default: console).
   */
  protected logInfo(message: string): void {
    this.logger.info(`[${this.getApiName()}] ${message}`);
  }
}
