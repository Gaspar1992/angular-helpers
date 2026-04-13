import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';
import { MediaDevicesService } from '../services/media-devices.service';

export function provideMediaDevices(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, MediaDevicesService]);
}
