import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { PermissionsService } from '../services/permissions.service';
import { PermissionNameExt } from '../interfaces/permissions.interface';

export class PermissionGuard implements CanActivate {
  constructor(
    private permissionsService: PermissionsService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const permission = route.data?.['permission'] as PermissionNameExt;
    
    if (!permission) {
      return Promise.resolve(true);
    }

    return this.checkPermission(permission);
  }

  private async checkPermission(permission: PermissionNameExt): Promise<boolean> {
    try {
      const status = await this.permissionsService.query({ name: permission as PermissionName });

      if (status.state !== 'granted') {
        this.router.navigate(['/permission-denied'], {
          queryParams: { permission }
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Permission guard error:', error);
      this.router.navigate(['/permission-denied'], {
        queryParams: { permission }
      });
      return false;
    }
  }
}

export function createPermissionGuard(permission: PermissionNameExt) {
  return {
    canActivate: [PermissionGuard],
    data: { permission }
  };
}
