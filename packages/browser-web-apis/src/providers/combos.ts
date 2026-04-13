import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';
import { CameraService } from '../services/camera.service';
import { MediaDevicesService } from '../services/media-devices.service';
import { GeolocationService } from '../services/geolocation.service';
import { ClipboardService } from '../services/clipboard.service';
import { WebStorageService } from '../services/web-storage.service';
import { NotificationService } from '../services/notification.service';
import { WebShareService } from '../services/web-share.service';
import { WebSocketService } from '../services/web-socket.service';

export function provideMediaApis(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, CameraService, MediaDevicesService]);
}

export function provideLocationApis(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, GeolocationService]);
}

export function provideStorageApis(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, ClipboardService, WebStorageService]);
}

export function provideCommunicationApis(): EnvironmentProviders {
  return makeEnvironmentProviders([
    PermissionsService,
    NotificationService,
    WebShareService,
    WebSocketService,
  ]);
}
