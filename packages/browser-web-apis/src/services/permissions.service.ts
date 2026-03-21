import { Injectable } from '@angular/core';
import { 
  BrowserPermissions 
} from '../interfaces/permissions.interface';

@Injectable()
export class PermissionsService implements BrowserPermissions {

  async query(descriptor: PermissionDescriptor): Promise<PermissionStatus> {
    if (!this.isSupported()) {
      throw new Error('Permissions API not supported');
    }

    try {
      return await navigator.permissions.query(descriptor as PermissionDescriptor);
    } catch (error) {
      console.error('Error querying permission:', error);
      throw error;
    }
  }

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'permissions' in navigator;
  }
}
