import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { DeviceOrientationService } from '../services/device-orientation.service';

export function provideDeviceOrientation(): EnvironmentProviders {
  return makeEnvironmentProviders([DeviceOrientationService]);
}
