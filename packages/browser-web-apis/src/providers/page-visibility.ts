import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { PageVisibilityService } from '../services/page-visibility.service';

export function providePageVisibility(): EnvironmentProviders {
  return makeEnvironmentProviders([PageVisibilityService]);
}
