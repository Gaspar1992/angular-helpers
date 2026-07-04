import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { DeviceMotionService } from '../services/device-motion.service';

export function provideDeviceMotion(): EnvironmentProviders {
  return makeEnvironmentProviders([DeviceMotionService]);
}
