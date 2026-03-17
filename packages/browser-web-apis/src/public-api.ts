// Browser Web APIs Services
export { BrowserWebApisModule } from './browser-web-apis.module';
export { PermissionsService } from './services/permissions.service';
export { CameraService } from './services/camera.service';
export { GeolocationService } from './services/geolocation.service';
export { MediaDevicesService } from './services/media-devices.service';
export { NotificationService } from './services/notification.service';
export { ClipboardService } from './services/clipboard.service';

// Interfaces and Types
export * from './interfaces/permissions.interface';
export * from './interfaces/media.interface';
export * from './interfaces/geolocation.interface';

// Utils and Guards
export * from './utils/browser-support.util';
export * from './guards/permission.guard';

// Version
export const version = '0.1.0';
