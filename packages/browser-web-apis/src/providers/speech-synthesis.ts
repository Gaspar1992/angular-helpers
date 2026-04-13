import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { SpeechSynthesisService } from '../services/speech-synthesis.service';

export function provideSpeechSynthesis(): EnvironmentProviders {
  return makeEnvironmentProviders([SpeechSynthesisService]);
}
