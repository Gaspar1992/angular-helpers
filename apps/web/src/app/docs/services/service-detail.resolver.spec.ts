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

  it('should resolve all sections and interfaces in both v21 and v22 and handle redirects', async () => {
    const { resolveServiceDetailData } = await import('./service-detail.resolver');
    const sections = [
      'core',
      'browser-web-apis',
      'security',
      'worker-http',
      'storage',
      'openlayers',
      'yjs',
      'testing',
    ];

    for (const version of ['v21', 'v22'] as const) {
      for (const sec of sections) {
        // Test with unknown itemId to trigger sectionData lookup + not-found redirect
        const res = await resolveServiceDetailData(
          sec,
          'non-existent-id',
          version,
          routerSpy,
          seoSpy,
        );
        expect(res).toBeNull();
        expect(routerSpy.navigate).toHaveBeenCalledWith([`/docs/${sec}`]);
      }
    }

    // Invalid section redirects to /docs
    const invalidRes = await resolveServiceDetailData(
      'invalid-section',
      'any',
      'v22',
      routerSpy,
      seoSpy,
    );
    expect(invalidRes).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/docs']);

    // Resolve valid items in security, worker-http, storage, openlayers to cover getInterfaces and paramName branches
    const { SECURITY_SERVICES } = await import('../data/v22/security.data');
    const { WORKER_HTTP_ENTRIES } = await import('../data/v22/worker-http.data');
    const { OPENLAYERS_SERVICES } = await import('../data/v22/openlayers.data');
    const { STORAGE_SERVICES } = await import('../data/v22/storage.data');

    for (const version of ['v21', 'v22'] as const) {
      versionService.activeVersionSignal.set(version);

      const secRoute = {
        url: [{ path: 'security' }],
        paramMap: { get: (k: string) => (k === 'service' ? SECURITY_SERVICES[0].id : null) },
      } as any;
      const secRes = await TestBed.runInInjectionContext(() =>
        serviceDetailResolver(secRoute, {} as any),
      );
      expect(secRes).toBeTruthy();

      const whRoute = {
        url: [{ path: 'worker-http' }],
        paramMap: { get: (k: string) => (k === 'entry' ? WORKER_HTTP_ENTRIES[0].id : null) },
      } as any;
      const whRes = await TestBed.runInInjectionContext(() =>
        serviceDetailResolver(whRoute, {} as any),
      );
      expect(whRes).toBeTruthy();

      const olRoute = {
        url: [{ path: 'openlayers' }],
        paramMap: { get: (k: string) => (k === 'component' ? OPENLAYERS_SERVICES[0].id : null) },
      } as any;
      const olRes = await TestBed.runInInjectionContext(() =>
        serviceDetailResolver(olRoute, {} as any),
      );
      expect(olRes).toBeTruthy();

      const storageRoute = {
        url: [{ path: 'storage' }],
        paramMap: { get: (k: string) => (k === 'service' ? STORAGE_SERVICES[0].id : null) },
      } as any;
      const stRes = await TestBed.runInInjectionContext(() =>
        serviceDetailResolver(storageRoute, {} as any),
      );
      expect(stRes).toBeTruthy();
    }

    // Also test serviceDetailResource paramName branches for worker-http, openlayers, and security
    for (const sec of ['worker-http', 'openlayers', 'security']) {
      const ctx = {
        params: signal({}),
      } as any;
      const res = TestBed.runInInjectionContext(() => serviceDetailResource(ctx, sec));
      expect(res).toBeDefined();
    }
  });
});
