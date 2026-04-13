import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { ScreenOrientationService } from '../services/screen-orientation.service';

export function provideScreenOrientation(): EnvironmentProviders {
  return makeEnvironmentProviders([ScreenOrientationService]);
}
