import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';

export function providePermissions(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService]);
}
