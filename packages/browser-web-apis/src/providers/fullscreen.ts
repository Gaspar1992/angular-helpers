import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { FullscreenService } from '../services/fullscreen.service';

export function provideFullscreen(): EnvironmentProviders {
  return makeEnvironmentProviders([FullscreenService]);
}
