import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { overviewResolver, overviewResource } from './overview.resolver';
import { DocsVersionService } from './docs-version.service';

describe('overviewResolver', () => {
  let versionService: DocsVersionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocsVersionService],
    });
    versionService = TestBed.inject(DocsVersionService);
  });

  it('should resolve v21 data when version is v21', async () => {
    versionService.activeVersionSignal.set('v21');

    const route = new ActivatedRouteSnapshot();
    route.url = [{ path: 'core' } as any];

    const state = {} as RouterStateSnapshot;

    const result = (await TestBed.runInInjectionContext(() =>
      overviewResolver(route, state),
    )) as any;

    // The inject-platform service should have [v21 Legacy] in its description
    const platformService = result.serviceGroups[0].items[0];
    expect(platformService.description).toContain('[v21 Legacy]');
  });

  it('should resolve v22 data when version is v22', async () => {
    versionService.activeVersionSignal.set('v22');

    const route = new ActivatedRouteSnapshot();
    route.url = [{ path: 'core' } as any];

    const state = {} as RouterStateSnapshot;

    const result = (await TestBed.runInInjectionContext(() =>
      overviewResolver(route, state),
    )) as any;

    // The inject-platform service should NOT have [v21 Legacy] in its description
    const platformService = result.serviceGroups[0].items[0];
    expect(platformService.description).not.toContain('[v21 Legacy]');
  });

  it('should create reactive overviewResource for route', async () => {
    versionService.activeVersionSignal.set('v22');
    const ctx = {
      params: signal({}),
      queryParams: signal({}),
      fragment: signal(undefined),
      data: signal({}),
    } as any;

    const res = TestBed.runInInjectionContext(() => overviewResource(ctx, 'core'));
    expect(res).toBeDefined();
    TestBed.flushEffects();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(res.value()?.packageName).toBe('core');
  });
});
