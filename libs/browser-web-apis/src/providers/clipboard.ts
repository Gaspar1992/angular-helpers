import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { ClipboardService } from '../services/clipboard.service';

export function provideClipboard(): EnvironmentProviders {
  return makeEnvironmentProviders([ClipboardService]);
}
