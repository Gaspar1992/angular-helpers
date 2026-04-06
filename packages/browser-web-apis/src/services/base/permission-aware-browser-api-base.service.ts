import { Injectable, inject } from '@angular/core';
import { BrowserApiBaseService } from './browser-api-base.service';
import { PermissionsService } from '../permissions.service';
import { PermissionNameExt } from '../../interfaces/permissions.interface';

/**
 * Extension of `BrowserApiBaseService` for services that need to query
 * browser permissions via the Permissions API.
 *
 * Only services that actively call `requestPermission()` should extend this
 * class. All other services should extend `BrowserApiBaseService` directly
 * to avoid carrying an unnecessary PermissionsService dependency.
 */
@Injectable()
export abstract class PermissionAwareBrowserApiBaseService extends BrowserApiBaseService {
  protected permissionsService = inject(PermissionsService);

  /**
   * Query the Permissions API for the given permission name.
   * Returns `true` if the permission state is `'granted'`.
   */
  protected async requestPermission(permission: PermissionNameExt): Promise<boolean> {
    if (this.isServerEnvironment()) {
      throw new Error(`${this.getApiName()} API not available in server environment`);
    }

    try {
      const status = await this.permissionsService.query({ name: permission as PermissionName });
      return status.state === 'granted';
    } catch (error) {
      this.logError(`Error requesting permission for ${permission}:`, error);
      return false;
    }
  }
}
