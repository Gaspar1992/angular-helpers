import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { CompressionService } from '../services/compression.service';

export function provideCompression(): EnvironmentProviders {
  return makeEnvironmentProviders([CompressionService]);
}
