import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { GamepadService } from '../services/gamepad.service';

export function provideGamepad(): EnvironmentProviders {
  return makeEnvironmentProviders([GamepadService]);
}
