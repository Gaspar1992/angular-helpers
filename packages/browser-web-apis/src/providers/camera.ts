import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { CameraService } from '../services/camera.service';

export function provideCamera(): EnvironmentProviders {
  return makeEnvironmentProviders([CameraService]);
}
