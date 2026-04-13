import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { WebAudioService } from '../services/web-audio.service';

export function provideWebAudio(): EnvironmentProviders {
  return makeEnvironmentProviders([WebAudioService]);
}
