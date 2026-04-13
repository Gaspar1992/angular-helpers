import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';
import { ClipboardService } from '../services/clipboard.service';

export function provideClipboard(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, ClipboardService]);
}
