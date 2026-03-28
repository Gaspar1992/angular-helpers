// Browser Web APIs Services
export { PermissionsService } from './services/permissions.service';
export { CameraService } from './services/camera.service';
export { GeolocationService } from './services/geolocation.service';
export { MediaDevicesService } from './services/media-devices.service';
export { NotificationService } from './services/notification.service';
export { ClipboardService } from './services/clipboard.service';
export {
  BrowserCapabilityService,
  type BrowserCapabilityId,
} from './services/browser-capability.service';
export { BatteryService } from './services/battery.service';
export { WebShareService } from './services/web-share.service';
export {
  WebStorageService,
  type StorageOptions,
  type StorageEvent,
} from './services/web-storage.service';
export {
  WebSocketService,
  type WebSocketConfig,
  type WebSocketMessage,
  type WebSocketStatus,
} from './services/web-socket.service';
export {
  WebWorkerService,
  type WorkerMessage,
  type WorkerStatus,
  type WorkerTask,
} from './services/web-worker.service';

// Base classes
export { BrowserApiBaseService } from './services/base/browser-api-base.service';

// Interfaces and Types
export * from './interfaces/permissions.interface';
export * from './interfaces/media.interface';
export * from './interfaces/geolocation.interface';
export * from './interfaces/battery.interface';
export * from './interfaces/common.types';

// Utils and Guards
export * from './utils/browser-support.util';
export * from './guards/permission.guard';

// Providers
export * from './providers';

// Version
export const version = '0.1.0';
