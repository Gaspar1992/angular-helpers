import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';
import { CameraService } from '../services/camera.service';

export function provideCamera(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, CameraService]);
}
