import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';
import { IdleDetectorService } from '../services/idle-detector.service';

export function provideIdleDetector(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, IdleDetectorService]);
}
