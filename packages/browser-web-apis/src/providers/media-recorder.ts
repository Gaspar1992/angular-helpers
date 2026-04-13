import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';
import { MediaRecorderService } from '../services/media-recorder.service';

export function provideMediaRecorder(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, MediaRecorderService]);
}
