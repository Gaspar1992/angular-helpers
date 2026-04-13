import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { VibrationService } from '../services/vibration.service';

export function provideVibration(): EnvironmentProviders {
  return makeEnvironmentProviders([VibrationService]);
}
