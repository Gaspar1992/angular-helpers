import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';
import { NotificationService } from '../services/notification.service';

export function provideNotifications(): EnvironmentProviders {
  return makeEnvironmentProviders([PermissionsService, NotificationService]);
}
