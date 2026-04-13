import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { NetworkInformationService } from '../services/network-information.service';

export function provideNetworkInformation(): EnvironmentProviders {
  return makeEnvironmentProviders([NetworkInformationService]);
}
