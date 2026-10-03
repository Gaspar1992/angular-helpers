import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { serviceDetailResolver, serviceDetailResource } from './service-detail.resolver';
import { DocsVersionService } from './docs-version.service';
import { SeoService } from '../../core/services/seo.service';

describe('serviceDetailResolver', () => {
  let versionService: DocsVersionService;
  let routerSpy: any;
  let seoSpy: any;

  beforeEach(() => {
    routerSpy = {
      navigate: vi.fn().mockResolvedValue(true),
    };
    seoSpy = {
      updateMetadata: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        DocsVersionService,
        { provide: Router, useValue: routerSpy },
        { provide: SeoService, useValue: seoSpy },
      ],
    });
    versionService = TestBed.inject(DocsVersionService);
  });

  it('should resolve v21 service detail when version is v21', async () => {
    versionService.activeVersionSignal.set('v21');

    const route = {
      url: [{ path: 'core' } as any],
      paramMap: {
        get: vi.fn().mockReturnValue('inject-platform'),
        has: vi.fn(),
      },
    } as any;

    const state = {} as any;

    const result = (await TestBed.runInInjectionContext(() =>
      serviceDetailResolver(route, state),
    )) as any;
    expect(result.service.description).toContain('[v21 Legacy]');
  });

  it('should resolve v22 service detail when version is v22', async () => {
    versionService.activeVersionSignal.set('v22');

    const route = {
      url: [{ path: 'core' } as any],
      paramMap: {
        get: vi.fn().mockReturnValue('inject-platform'),
        has: vi.fn(),
      },
    } as any;

    const state = {} as any;

    const result = (await TestBed.runInInjectionContext(() =>
      serviceDetailResolver(route, state),
    )) as any;
    expect(result.service.description).not.toContain('[v21 Legacy]');
  });

  it('should create reactive serviceDetailResource for route', async () => {
    versionService.activeVersionSignal.set('v22');
    const ctx = {
      params: signal({ entry: 'inject-platform' }),
      queryParams: signal({}),
      fragment: signal(undefined),
      data: signal({}),
    } as any;

    const res = TestBed.runInInjectionContext(() => serviceDetailResource(ctx, 'core'));
    expect(res).toBeDefined();
    TestBed.flushEffects();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(res.value()?.service.id).toBe('inject-platform');
  });
});
