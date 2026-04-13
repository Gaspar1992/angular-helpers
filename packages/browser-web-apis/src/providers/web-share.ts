import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { WebShareService } from '../services/web-share.service';

export function provideWebShare(): EnvironmentProviders {
  return makeEnvironmentProviders([WebShareService]);
}
