import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { WebHidService } from '../services/web-hid.service';

export function provideWebHid(): EnvironmentProviders {
  return makeEnvironmentProviders([WebHidService]);
}
