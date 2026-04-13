import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { WebWorkerService } from '../services/web-worker.service';

export function provideWebWorker(): EnvironmentProviders {
  return makeEnvironmentProviders([WebWorkerService]);
}
