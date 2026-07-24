import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { SpeechRecognitionService } from '../services/speech-recognition.service';

export function provideSpeechRecognition(): EnvironmentProviders {
  return makeEnvironmentProviders([SpeechRecognitionService]);
}
