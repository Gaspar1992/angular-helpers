import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { ServerSentEventsService } from '../services/server-sent-events.service';

export function provideServerSentEvents(): EnvironmentProviders {
  return makeEnvironmentProviders([ServerSentEventsService]);
}
