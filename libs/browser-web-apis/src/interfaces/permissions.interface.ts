export type PermissionNameExt = PermissionName | 'clipboard-read' | 'clipboard-write';

export interface PermissionRequest {
  name: PermissionNameExt;
  state: PermissionState;
}

export interface BrowserPermissions {
  query(descriptor: PermissionDescriptor): Promise<PermissionStatus>;
  isSupported(): boolean;
}
