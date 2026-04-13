import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';
import { FileSystemAccessService } from '../services/file-system-access.service';

export function provideFileSystemAccess(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, FileSystemAccessService]);
}
