import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { EyeDropperService } from '../services/eye-dropper.service';

export function provideEyeDropper(): EnvironmentProviders {
  return makeEnvironmentProviders([EyeDropperService]);
}
