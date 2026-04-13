import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { BroadcastChannelService } from '../services/broadcast-channel.service';

export function provideBroadcastChannel(): EnvironmentProviders {
  return makeEnvironmentProviders([BroadcastChannelService]);
}
