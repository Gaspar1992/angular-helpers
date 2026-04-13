import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import { BrowserPermissions } from '../interfaces/permissions.interface';

@Injectable()
export class PermissionsService extends BrowserApiBaseService implements BrowserPermissions {
  protected override getApiName(): string {
    return 'permissions';
  }

  async query(descriptor: PermissionDescriptor): Promise<PermissionStatus> {
    if (!this.isSupported()) {
      throw new Error('Permissions API not supported in this environment');
    }

    try {
      return await navigator.permissions.query(descriptor);
    } catch (error) {
      // Firefox does not support querying 'camera', 'microphone', or 'speaker' via
      // the Permissions API and throws a TypeError. Return a synthetic 'prompt' status
      // so callers fall through to the native getUserMedia / requestPermission flow.
      if (error instanceof TypeError) {
        return { state: 'prompt', onchange: null } as unknown as PermissionStatus;
      }
      this.logError(`Error querying permission for ${descriptor.name}:`, error);
      throw error;
    }
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && 'permissions' in navigator;
  }
}
