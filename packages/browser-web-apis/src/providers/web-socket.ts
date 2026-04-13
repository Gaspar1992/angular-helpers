import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { WebSocketService } from '../services/web-socket.service';

export function provideWebSocket(): EnvironmentProviders {
  return makeEnvironmentProviders([WebSocketService]);
}
