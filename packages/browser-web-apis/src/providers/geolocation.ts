import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';
import { GeolocationService } from '../services/geolocation.service';

export function provideGeolocation(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, GeolocationService]);
}
