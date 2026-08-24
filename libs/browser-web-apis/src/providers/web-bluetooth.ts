import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { WebBluetoothService } from '../services/web-bluetooth.service';

export function provideWebBluetooth(): EnvironmentProviders {
  return makeEnvironmentProviders([WebBluetoothService]);
}
