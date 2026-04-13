import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { WebNfcService } from '../services/web-nfc.service';

export function provideWebNfc(): EnvironmentProviders {
  return makeEnvironmentProviders([WebNfcService]);
}
