import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { WebSerialService } from '../services/web-serial.service';

export function provideWebSerial(): EnvironmentProviders {
  return makeEnvironmentProviders([WebSerialService]);
}
