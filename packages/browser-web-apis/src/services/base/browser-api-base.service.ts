import { Injectable, signal, inject, OnDestroy, DestroyRef, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { BrowserSupportUtil } from '../../utils/browser-support.util';
import { PermissionsService } from '../permissions.service';

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
  protected permissionsService = inject(PermissionsService);
  protected destroyRef = inject(DestroyRef);
  protected platformId = inject(PLATFORM_ID);
  
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
    return BrowserSupportUtil.isSupported(this.getApiName());
  }

  /**
   * Check if running in browser environment using Angular's platform detection
   */
  protected isBrowserEnvironment(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Check if running in server environment using Angular's platform detection
   */
  protected isServerEnvironment(): boolean {
    return isPlatformServer(this.platformId);
  }
  
  /**
   * Check if a permission is granted
   */
  protected async checkPermission(permission: string): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }
    
    try {
      return await this.permissionsService.isGranted(permission as any);
    } catch (error) {
      this.logWarning(`Could not check permission for ${permission}:`, error);
      return false;
    }
  }
  
  /**
   * Request a permission
   */
  protected async requestPermission(permission: string): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error(`${this.getApiName()} API not supported`);
    }
    
    try {
      const status = await this.permissionsService.request({ name: permission as any });
      return status.state === 'granted';
    } catch (error) {
      this.logError(`Error requesting permission for ${permission}:`, error);
      return false;
    }
  }
  
  /**
   * Initialize the service with support check
   */
  protected async initialize(): Promise<void> {
    if (this.isServerEnvironment()) {
      this.logWarning(`${this.getApiName()} API not available in server environment`);
      return;
    }

    if (!this.isSupported()) {
      this.logWarning(`${this.getApiName()} API not supported in this browser`);
      return;
    }
    
    try {
      await this.onInitialize();
    } catch (error) {
      this.logError(`Error initializing ${this.getApiName()} service:`, error);
    }
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
    if (this.isBrowserEnvironment()) {
      console.warn(`${this.getApiName()}: ${message}`, ...args);
    }
  }
  
  /**
   * Log API-specific errors
   */
  protected logError(message: string, ...args: any[]): void {
    if (this.isBrowserEnvironment()) {
      console.error(`${this.getApiName()}: ${message}`, ...args);
    }
  }
  
  /**
   * Log API-specific info
   */
  protected logInfo(message: string, ...args: any[]): void {
    if (this.isBrowserEnvironment()) {
      console.info(`${this.getApiName()}: ${message}`, ...args);
    }
  }
  
  /**
   * Execute a function with error handling and support check
   */
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T> {
    if (this.isServerEnvironment() || !this.isSupported()) {
      throw this.createError('API not supported or not available in current environment');
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
  protected executeSyncWithErrorHandling<T>(
    operation: () => T,
    errorMessage?: string
  ): T {
    if (this.isServerEnvironment() || !this.isSupported()) {
      throw this.createError('API not supported or not available in current environment');
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
