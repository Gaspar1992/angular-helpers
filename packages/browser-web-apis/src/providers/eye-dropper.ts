import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { EyeDropperService } from '../services/eye-dropper.service';
import { PermissionsService } from '../services/permissions.service';

export function provideEyeDropper(): EnvironmentProviders {
  return makeEnvironmentProviders([EyeDropperService, PermissionsService]);
}
