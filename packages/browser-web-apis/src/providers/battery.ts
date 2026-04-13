import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { BatteryService } from '../services/battery.service';

export function provideBattery(): EnvironmentProviders {
  return makeEnvironmentProviders([BatteryService]);
}
