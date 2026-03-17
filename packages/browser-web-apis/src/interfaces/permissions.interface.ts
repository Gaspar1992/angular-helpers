export type PermissionName = 
  | 'camera'
  | 'microphone'
  | 'geolocation'
  | 'notifications'
  | 'clipboard-read'
  | 'clipboard-write'
  | 'persistent-storage';

export type PermissionState = 'granted' | 'denied' | 'prompt';

export interface PermissionStatus {
  name: PermissionName;
  state: PermissionState;
}

export interface PermissionRequest {
  name: PermissionName;
  state: PermissionState;
}

export interface PermissionDescriptor {
  name: PermissionName;
}

export interface BrowserPermissions {
  query(descriptor: PermissionDescriptor): Promise<PermissionStatus>;
  request(descriptor: PermissionDescriptor): Promise<PermissionStatus>;
  requestAll(descriptors: PermissionDescriptor[]): Promise<PermissionRequest[]>;
  revoke(descriptor: PermissionDescriptor): Promise<void>;
  isSupported(): boolean;
}
