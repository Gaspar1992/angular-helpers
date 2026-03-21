import { Injectable, signal } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  PermissionName, 
  PermissionState, 
  PermissionStatus, 
  PermissionDescriptor,
  BrowserPermissions 
} from '../interfaces/permissions.interface';
import { BrowserSupportUtil } from '../utils/browser-support.util';

@Injectable()
export class PermissionsService implements BrowserPermissions {
  private permissions = signal<Map<PermissionName, PermissionState>>(new Map());

  readonly permissionStates = this.permissions.asReadonly();

  constructor() {
    this.initializePermissions();
  }

  private async initializePermissions(): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Permissions API not supported in this browser');
      return;
    }

    const permissions: PermissionName[] = [
      'camera',
      'microphone', 
      'geolocation',
      'notifications',
      'clipboard-read',
      'clipboard-write',
      'persistent-storage'
    ];

    for (const permission of permissions) {
      try {
        const status = await this.query({ name: permission });
        this.permissions.update(map => map.set(permission, status.state));
      } catch (error) {
        console.warn(`Could not query permission for ${permission}:`, error);
      }
    }
  }

  async query(descriptor: PermissionDescriptor): Promise<PermissionStatus> {
    if (!this.isSupported()) {
      throw new Error('Permissions API not supported');
    }

    try {
      const status = await navigator.permissions.query(descriptor as any);
      const permissionStatus: PermissionStatus = {
        name: descriptor.name,
        state: status.state as PermissionState
      };
      this.permissions.update(map => map.set(descriptor.name, status.state as PermissionState));
      return permissionStatus;
    } catch (error) {
      console.error('Error querying permission:', error);
      throw error;
    }
  }

  async request(descriptor: PermissionDescriptor): Promise<PermissionStatus> {
    if (!this.isSupported()) {
      throw new Error('Permissions API not supported');
    }

    try {
      const status = await this.requestPermission(descriptor.name);
      this.permissions.update(map => map.set(descriptor.name, status.state));
      return status;
    } catch (error) {
      console.error('Error requesting permission:', error);
      throw error;
    }
  }

  async requestAll(descriptors: PermissionDescriptor[]): Promise<PermissionStatus[]> {
    const results: PermissionStatus[] = [];
    
    for (const descriptor of descriptors) {
      try {
        const status = await this.request(descriptor);
        results.push(status);
      } catch (error) {
        console.error(`Error requesting permission for ${descriptor.name}:`, error);
        results.push({
          name: descriptor.name,
          state: 'denied'
        });
      }
    }
    
    return results;
  }

  async revoke(descriptor: PermissionDescriptor): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Permissions API not supported');
    }

    try {
      // revoke() no está disponible en todos los navegadores
      if ('revoke' in navigator.permissions) {
        await (navigator.permissions as any).revoke(descriptor);
        this.permissions.update(map => map.set(descriptor.name, 'prompt'));
      } else {
        console.warn('Permission revocation not supported in this browser');
      }
    } catch (error) {
      console.error('Error revoking permission:', error);
      throw error;
    }
  }

  isSupported(): boolean {
    return BrowserSupportUtil.isSupported('permissions');
  }

  getPermissionState(permission: PermissionName): PermissionState | undefined {
    return this.permissions().get(permission);
  }

  isGranted(permission: PermissionName): boolean {
    return this.getPermissionState(permission) === 'granted';
  }

  isDenied(permission: PermissionName): boolean {
    return this.getPermissionState(permission) === 'denied';
  }

  needsPrompt(permission: PermissionName): boolean {
    return this.getPermissionState(permission) === 'prompt';
  }

  observePermission(permission: PermissionName): Observable<PermissionState> {
    if (!this.isSupported()) {
      return from([this.getPermissionState(permission) || 'prompt']);
    }

    return from(navigator.permissions.query({ name: permission as any })).pipe(
      map(status => status.state as PermissionState),
      catchError(() => from(['prompt' as PermissionState]))
    );
  }

  // Método para actualizar manualmente el estado de un permiso
  updatePermissionState(permission: PermissionName, state: PermissionState): void {
    this.permissions.update(map => map.set(permission, state));
  }

  private async requestPermission(permission: PermissionName): Promise<PermissionStatus> {
    switch (permission) {
      case 'camera':
        return this.requestMediaPermission('video');
      case 'microphone':
        return this.requestMediaPermission('audio');
      case 'notifications':
        return this.requestNotificationPermission();
      case 'geolocation':
        return this.requestGeolocationPermission();
      case 'clipboard-read':
      case 'clipboard-write':
        return this.requestClipboardPermission(permission);
      default:
        throw new Error(`Permission ${permission} cannot be requested directly`);
    }
  }

  private async requestMediaPermission(type: 'video' | 'audio'): Promise<PermissionStatus> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ [type]: true });
      stream.getTracks().forEach(track => track.stop());
      return { name: type === 'video' ? 'camera' : 'microphone', state: 'granted' };
    } catch {
      return { 
        name: type === 'video' ? 'camera' : 'microphone', 
        state: 'denied' 
      };
    }
  }

  private async requestNotificationPermission(): Promise<PermissionStatus> {
    try {
      const permission = await Notification.requestPermission();
      return { name: 'notifications', state: permission as PermissionState };
    } catch {
      return { name: 'notifications', state: 'denied' };
    }
  }

  private async requestGeolocationPermission(): Promise<PermissionStatus> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve({ name: 'geolocation', state: 'granted' }),
        () => resolve({ name: 'geolocation', state: 'denied' })
      );
    });
  }

  private async requestClipboardPermission(permission: PermissionName): Promise<PermissionStatus> {
    try {
      if (permission === 'clipboard-read') {
        await navigator.clipboard.readText();
      } else {
        await navigator.clipboard.writeText('');
      }
      return { name: permission, state: 'granted' };
    } catch {
      return { name: permission, state: 'denied' };
    }
  }
}
