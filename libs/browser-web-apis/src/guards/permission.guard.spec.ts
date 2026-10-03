import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { type ActivatedRouteSnapshot, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PermissionsService } from '../services/permissions.service';
import { createPermissionGuard, permissionGuard } from './permission.guard';

describe('permissionGuard', () => {
  let mockPermissionsService: { query: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  const mockRoute = {} as ActivatedRouteSnapshot;

  beforeEach(() => {
    mockPermissionsService = {
      query: vi.fn(),
    };
    mockRouter = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: PermissionsService, useValue: mockPermissionsService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('allows access and returns true when no permission is specified', async () => {
    const guard = permissionGuard(null as any);
    const result = await TestBed.runInInjectionContext(() => guard(mockRoute, null as any));
    expect(result).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('allows access when permission state is granted', async () => {
    mockPermissionsService.query.mockResolvedValue({ state: 'granted' });

    const guard = permissionGuard('camera');
    const result = await TestBed.runInInjectionContext(() => guard(mockRoute, null as any));

    expect(result).toBe(true);
    expect(mockPermissionsService.query).toHaveBeenCalledWith({
      name: 'camera',
    });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('denies access and navigates to /permission-denied when permission is denied or prompt', async () => {
    mockPermissionsService.query.mockResolvedValue({ state: 'denied' });

    const guard = permissionGuard('camera');
    const result = await TestBed.runInInjectionContext(() => guard(mockRoute, null as any));

    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/permission-denied'], {
      queryParams: { permission: 'camera' },
    });
  });

  it('handles query error gracefully, navigates to /permission-denied and returns false', async () => {
    mockPermissionsService.query.mockRejectedValue(new Error('Permission API not supported'));

    const guard = permissionGuard('geolocation');
    const result = await TestBed.runInInjectionContext(() => guard(mockRoute, null as any));

    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/permission-denied'], {
      queryParams: { permission: 'geolocation' },
    });
  });

  it('createPermissionGuard is an alias to permissionGuard', () => {
    expect(createPermissionGuard).toBe(permissionGuard);
  });
});
