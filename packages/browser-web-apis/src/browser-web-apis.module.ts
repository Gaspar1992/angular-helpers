import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PermissionsService } from './services/permissions.service';
import { CameraService } from './services/camera.service';
import { GeolocationService } from './services/geolocation.service';
import { MediaDevicesService } from './services/media-devices.service';
import { NotificationService } from './services/notification.service';
import { ClipboardService } from './services/clipboard.service';

@NgModule({
  imports: [CommonModule],
  providers: [
    PermissionsService,
    CameraService,
    GeolocationService,
    MediaDevicesService,
    NotificationService,
    ClipboardService
  ]
})
export class BrowserWebApisModule {
  static forRoot() {
    return {
      ngModule: BrowserWebApisModule,
      providers: []
    };
  }
}
