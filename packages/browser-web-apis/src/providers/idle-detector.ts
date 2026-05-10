import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { IdleDetectorService } from '../services/idle-detector.service';
import { PermissionsService } from '../services/permissions.service';

export function provideIdleDetector(): EnvironmentProviders {
  return makeEnvironmentProviders([IdleDetectorService, PermissionsService]);
}
