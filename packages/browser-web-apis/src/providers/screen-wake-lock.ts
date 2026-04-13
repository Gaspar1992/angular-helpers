import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';
import { ScreenWakeLockService } from '../services/screen-wake-lock.service';

export function provideScreenWakeLock(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, ScreenWakeLockService]);
}
