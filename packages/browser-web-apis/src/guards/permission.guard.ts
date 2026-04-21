import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';
import { PermissionNameExt } from '../interfaces/permissions.interface';

/**
 * Functional guard that checks if the user has the required permission.
 * Usage in routes: { canActivate: [permissionGuard('camera')] }
 */
export const permissionGuard = (permission: PermissionNameExt): CanActivateFn => {
  return async (_route: ActivatedRouteSnapshot) => {
    const permissionsService = inject(PermissionsService);
    const router = inject(Router);

    if (!permission) {
      return true;
    }

    try {
      const status = await permissionsService.query({ name: permission as PermissionName });

      if (status.state !== 'granted') {
        router.navigate(['/permission-denied'], {
          queryParams: { permission },
        });
        return false;
      }

      return true;
    } catch (error) {
      // oxlint-disable-next-line no-console -- guard errors must surface to DevTools; no injectable logger here
      console.error('Permission guard error:', error);
      router.navigate(['/permission-denied'], {
        queryParams: { permission },
      });
      return false;
    }
  };
};

// Re-export for backwards compatibility during migration
export { permissionGuard as createPermissionGuard };
