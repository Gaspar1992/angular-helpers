import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { PermissionsService } from '../services/permissions.service';
import { PermissionName } from '../interfaces/permissions.interface';

export class PermissionGuard implements CanActivate {
  constructor(
    private permissionsService: PermissionsService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const permission = route.data?.['permission'] as PermissionName;
    
    if (!permission) {
      return Promise.resolve(true);
    }

    return this.checkPermission(permission);
  }

  private async checkPermission(permission: PermissionName): Promise<boolean> {
    try {
      const hasPermission = this.permissionsService.isGranted(permission);
      
      if (!hasPermission) {
        await this.permissionsService.request({ name: permission });
        const granted = this.permissionsService.isGranted(permission);
        
        if (!granted) {
          this.router.navigate(['/permission-denied'], { 
            queryParams: { permission } 
          });
          return false;
        }
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

export function createPermissionGuard(permission: PermissionName) {
  return {
    canActivate: [PermissionGuard],
    data: { permission }
  };
}
