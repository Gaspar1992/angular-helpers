import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { PermissionsService } from './services/permissions.service';
import { CameraService } from './services/camera.service';
import { GeolocationService } from './services/geolocation.service';
import { MediaDevicesService } from './services/media-devices.service';
import { NotificationService } from './services/notification.service';
import { ClipboardService } from './services/clipboard.service';
import { BatteryService } from './services/battery.service';
import { WebShareService } from './services/web-share.service';
import { WebStorageService } from './services/web-storage.service';
import { WebSocketService } from './services/web-socket.service';
import { WebWorkerService } from './services/web-worker.service';
import { RegexSecurityService } from './services/regex-security.service';

export interface BrowserWebApisConfig {
  enableCamera?: boolean;
  enableGeolocation?: boolean;
  enableNotifications?: boolean;
  enableClipboard?: boolean;
  enableMediaDevices?: boolean;
  enablePermissions?: boolean;
  enableBattery?: boolean;
  enableWebShare?: boolean;
  enableWebStorage?: boolean;
  enableWebSocket?: boolean;
  enableWebWorker?: boolean;
  enableRegexSecurity?: boolean;
}

export const defaultBrowserWebApisConfig: BrowserWebApisConfig = {
  enableCamera: true,
  enableGeolocation: true,
  enableNotifications: true,
  enableClipboard: true,
  enablePermissions: true,
  enableBattery: false,
  enableMediaDevices: true,
  enableWebShare: false,
  enableWebStorage: false,
  enableWebSocket: false,
  enableWebWorker: false,
  enableRegexSecurity: true
};

export function provideBrowserWebApis(config: BrowserWebApisConfig = {}): EnvironmentProviders {
  const mergedConfig = { ...defaultBrowserWebApisConfig, ...config };
  
  const providers = [];
  
  // Always include PermissionsService as it's used by other services
  if (mergedConfig.enablePermissions) {
    providers.push(PermissionsService);
  }
  
  if (mergedConfig.enableCamera) {
    providers.push(CameraService);
  }
  
  if (mergedConfig.enableGeolocation) {
    providers.push(GeolocationService);
  }
  
  if (mergedConfig.enableNotifications) {
    providers.push(NotificationService);
  }
  
  if (mergedConfig.enableClipboard) {
    providers.push(ClipboardService);
  }
  
  if (mergedConfig.enableMediaDevices) {
    providers.push(MediaDevicesService);
  }
  
  if (mergedConfig.enableBattery) {
    providers.push(BatteryService);
  }
  
  if (mergedConfig.enableWebShare) {
    providers.push(WebShareService);
  }
  
  if (mergedConfig.enableWebStorage) {
    providers.push(WebStorageService);
  }
  
  if (mergedConfig.enableWebSocket) {
    providers.push(WebSocketService);
  }
  
  if (mergedConfig.enableWebWorker) {
    providers.push(WebWorkerService);
  }
  
  if (mergedConfig.enableRegexSecurity) {
    providers.push(RegexSecurityService);
  }
  
  return makeEnvironmentProviders(providers);
}

// Feature-specific providers for tree-shaking
export function provideCamera(): EnvironmentProviders {
  return makeEnvironmentProviders([
    PermissionsService,
    CameraService
  ]);
}

export function provideGeolocation(): EnvironmentProviders {
  return makeEnvironmentProviders([
    PermissionsService,
    GeolocationService
  ]);
}

export function provideNotifications(): EnvironmentProviders {
  return makeEnvironmentProviders([
    PermissionsService,
    NotificationService
  ]);
}

export function provideClipboard(): EnvironmentProviders {
  return makeEnvironmentProviders([
    PermissionsService,
    ClipboardService
  ]);
}

export function provideMediaDevices(): EnvironmentProviders {
  return makeEnvironmentProviders([
    PermissionsService,
    MediaDevicesService
  ]);
}

export function provideBattery(): EnvironmentProviders {
  return makeEnvironmentProviders([
    BatteryService
  ]);
}

export function provideWebShare(): EnvironmentProviders {
  return makeEnvironmentProviders([
    WebShareService
  ]);
}

export function provideWebStorage(): EnvironmentProviders {
  return makeEnvironmentProviders([
    WebStorageService
  ]);
}

export function provideWebSocket(): EnvironmentProviders {
  return makeEnvironmentProviders([
    WebSocketService
  ]);
}

export function provideWebWorker(): EnvironmentProviders {
  return makeEnvironmentProviders([
    WebWorkerService
  ]);
}

export function providePermissions(): EnvironmentProviders {
  return makeEnvironmentProviders([
    PermissionsService
  ]);
}

export function provideRegexSecurity(): EnvironmentProviders {
  return makeEnvironmentProviders([
    RegexSecurityService
  ]);
}

// Combined providers for common use cases
export function provideMediaApis(): EnvironmentProviders {
  return makeEnvironmentProviders([
    PermissionsService,
    CameraService,
    MediaDevicesService
  ]);
}

export function provideLocationApis(): EnvironmentProviders {
  return makeEnvironmentProviders([
    PermissionsService,
    GeolocationService
  ]);
}

export function provideStorageApis(): EnvironmentProviders {
  return makeEnvironmentProviders([
    PermissionsService,
    ClipboardService,
    WebStorageService
  ]);
}

export function provideCommunicationApis(): EnvironmentProviders {
  return makeEnvironmentProviders([
    PermissionsService,
    NotificationService,
    WebShareService,
    WebSocketService
  ]);
}
