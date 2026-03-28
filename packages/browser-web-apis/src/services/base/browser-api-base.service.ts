import { Injectable, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { PermissionsService } from '../permissions.service';
import { PermissionNameExt } from '../../public-api';

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
   * Request a permission
   */
  protected async requestPermission(permission: PermissionNameExt): Promise<boolean> {
    if (this.isServerEnvironment()) {
      throw new Error(`${this.getApiName()} API not available in server environment`);
    }

    try {
      const status = await this.permissionsService.query({ name: permission as PermissionName });
      return status.state === 'granted';
    } catch (error) {
      console.error(`[${this.getApiName()}] Error requesting permission for ${permission}:`, error);
      return false;
    }
  }

  /**
   * Create an error with proper cause chaining
   */
  protected createError(message: string, cause?: unknown): Error {
    const error = new Error(message);
    if (cause !== undefined) {
      (error as Error & { cause: unknown }).cause = cause;
    }
    return error;
  }
}
