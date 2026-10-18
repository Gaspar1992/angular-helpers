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

  it('should create reactive overviewResource for route and resolve all sections in v21 and v22', async () => {
    const { getOverviewConfig } = await import('./overview.resolver');
    const sections = [
      'core',
      'browser-web-apis',
      'security',
      'worker-http',
      'storage',
      'openlayers',
      'yjs',
      'testing',
      'unknown-pkg',
    ];
    for (const version of ['v21', 'v22'] as const) {
      for (const sec of sections) {
        const cfg = await getOverviewConfig(sec, version);
        expect(cfg.packageName).toBe(sec);
      }
    }

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

  describe('overview.utils', () => {
    it('generateServiceGroups groups services, separates experimental items, and defaults missing category', async () => {
      const { generateServiceGroups, validateServiceCategories } = await import('./overview.utils');
      const sampleServices: any[] = [
        {
          id: 'svc-1',
          name: 'NormalService',
          category: 'network',
          description: 'Network helper',
          methods: [],
        },
        {
          id: 'svc-exp-fn',
          name: 'ExpFnService',
          category: 'network',
          description: 'Has experimental fn',
          methods: [],
          fnVersion: { name: 'injectExperimentalFeature', importPath: 'pkg', fields: [] },
        },
        {
          id: 'svc-exp-note',
          name: 'ExpNoteService',
          category: undefined,
          description: 'Missing category with experimental note',
          methods: [],
          notes: ['This is an Experimental API'],
        },
      ];

      const groupsSeparated = generateServiceGroups(sampleServices);
      expect(groupsSeparated.map((g) => g.label)).toEqual([
        'System APIs',
        'Network APIs',
        'Experimental APIs',
      ]);

      const groupsInline = generateServiceGroups(sampleServices, { separateExperimental: false });
      expect(groupsInline.map((g) => g.label)).toEqual(['System APIs', 'Network APIs']);

      expect(validateServiceCategories(sampleServices)).toEqual(['svc-exp-note']);
    });
  });
});
