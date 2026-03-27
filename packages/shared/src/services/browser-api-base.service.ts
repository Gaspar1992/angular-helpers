import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Base class for all Browser Web API services
 * Provides common functionality for:
 * - Support checking
 * - Permission management
 * - Error handling
 * - Lifecycle management with destroyRef
 * - Logging
 */
@Injectable()
export abstract class BrowserApiBaseService {
  protected destroyRef = inject(DestroyRef);

  /**
   * Abstract method that must be implemented by child services
   * Returns the API name for support checking
   */
  protected abstract getApiName(): string;

  /**
   * Optional: Override if the service needs specific initialization
   */
  protected async onInitialize(): Promise<void> {
    // Default implementation - can be overridden
  }

  /**
   * Optional: Override if the service needs specific cleanup
   */
  protected onDestroy(): void {
    // Default implementation - can be overridden
  }

  /**
   * Check if the browser API is supported
   */
  protected isSupported(): boolean {
    return typeof window !== 'undefined' && this.getApiName() in window;
  }

  /**
   * Create a standardized error message
   */
  protected createError(message: string, originalError?: any): Error {
    const fullMessage = `${this.getApiName()}: ${message}`;
    const error = new Error(fullMessage);

    if (originalError) {
      (error as any).originalError = originalError;
    }

    return error;
  }

  /**
   * Log API-specific warnings
   */
  protected logWarning(message: string, ...args: any[]): void {
    console.warn(`${this.getApiName()}: ${message}`, ...args);
  }

  /**
   * Log API-specific errors
   */
  protected logError(message: string, ...args: any[]): void {
    console.error(`${this.getApiName()}: ${message}`, ...args);
  }

  /**
   * Log API-specific info
   */
  protected logInfo(message: string, ...args: any[]): void {
    console.info(`${this.getApiName()}: ${message}`, ...args);
  }

  /**
   * Execute a function with error handling and support check
   */
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage?: string,
  ): Promise<T> {
    if (!this.isSupported()) {
      throw this.createError('API not supported');
    }

    try {
      return await operation();
    } catch (error) {
      const message = errorMessage || `Operation failed`;
      throw this.createError(message, error);
    }
  }

  /**
   * Execute a synchronous function with error handling and support check
   */
  protected executeSyncWithErrorHandling<T>(operation: () => T, errorMessage?: string): T {
    if (!this.isSupported()) {
      throw this.createError('API not supported');
    }

    try {
      return operation();
    } catch (error) {
      const message = errorMessage || `Operation failed`;
      throw this.createError(message, error);
    }
  }

  /**
   * Get takeUntilDestroyed operator for observables
   * This automatically handles cleanup when the service is destroyed
   */
  protected takeUntilDestroyed<T>() {
    return takeUntilDestroyed<T>(this.destroyRef);
  }

  /**
   * Check if the service has been destroyed
   */
  protected isDestroyed(): boolean {
    return this.destroyRef.destroyed;
  }
}
