import { Injectable } from '@angular/core';

export type BrowserCapabilityId =
  | 'permissions'
  | 'geolocation'
  | 'clipboard'
  | 'notification'
  | 'mediaDevices'
  | 'camera'
  | 'webWorker'
  | 'regexSecurity'
  | 'webStorage'
  | 'webShare'
  | 'battery'
  | 'webSocket';

const BROWSER_CAPABILITIES = [
  { id: 'permissions', label: 'Permissions API', requiresSecureContext: false },
  { id: 'geolocation', label: 'Geolocation API', requiresSecureContext: true },
  { id: 'clipboard', label: 'Clipboard API', requiresSecureContext: true },
  { id: 'notification', label: 'Notification API', requiresSecureContext: true },
  { id: 'mediaDevices', label: 'MediaDevices API', requiresSecureContext: true },
  { id: 'camera', label: 'Camera API', requiresSecureContext: true },
  { id: 'webWorker', label: 'Web Worker API', requiresSecureContext: false },
  { id: 'regexSecurity', label: 'Regex Security', requiresSecureContext: false },
  { id: 'webStorage', label: 'Web Storage', requiresSecureContext: false },
  { id: 'webShare', label: 'Web Share', requiresSecureContext: true },
  { id: 'battery', label: 'Battery API', requiresSecureContext: false },
  { id: 'webSocket', label: 'WebSocket API', requiresSecureContext: false },
] as const satisfies ReadonlyArray<{
  id: BrowserCapabilityId;
  label: string;
  requiresSecureContext: boolean;
}>;

@Injectable({ providedIn: 'root' })
export class BrowserCapabilityService {
  getCapabilities() {
    return BROWSER_CAPABILITIES;
  }

  isSecureContext(): boolean {
    return typeof window !== 'undefined' && window.isSecureContext;
  }

  isSupported(capability: BrowserCapabilityId): boolean {
    switch (capability) {
      case 'permissions':
        return typeof navigator !== 'undefined' && 'permissions' in navigator;
      case 'geolocation':
        return typeof navigator !== 'undefined' && 'geolocation' in navigator;
      case 'clipboard':
        return typeof navigator !== 'undefined' && 'clipboard' in navigator;
      case 'notification':
        return typeof window !== 'undefined' && 'Notification' in window;
      case 'mediaDevices':
      case 'camera':
        return typeof navigator !== 'undefined' && 'mediaDevices' in navigator;
      case 'webWorker':
      case 'regexSecurity':
        return typeof Worker !== 'undefined';
      case 'webStorage':
        return typeof Storage !== 'undefined';
      case 'webShare':
        return typeof navigator !== 'undefined' && 'share' in navigator;
      case 'battery':
        return typeof navigator !== 'undefined' && 'getBattery' in navigator;
      case 'webSocket':
        return typeof WebSocket !== 'undefined';
      default:
        return false;
    }
  }

  getAllStatuses() {
    const secureContext = this.isSecureContext();

    return this.getCapabilities().map((capability) => ({
      id: capability.id,
      label: capability.label,
      supported: this.isSupported(capability.id),
      secureContext,
      requiresSecureContext: capability.requiresSecureContext,
    }));
  }

  async getPermissionState(permission: PermissionName): Promise<PermissionState | 'unknown'> {
    if (typeof navigator === 'undefined' || !('permissions' in navigator)) {
      return 'unknown';
    }

    try {
      const status = await navigator.permissions.query({ name: permission as PermissionName });
      return status.state;
    } catch {
      return 'unknown';
    }
  }
}
