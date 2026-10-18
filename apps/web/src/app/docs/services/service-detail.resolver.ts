import { type ResolveFn, Router, type ResourceContext } from '@angular/router';
import { inject, resource } from '@angular/core';
import { DocsVersionService } from '../services/docs-version.service';
import {
  type ServiceDetailConfig,
  type InterfaceDoc,
} from '../feature/unified-service-detail/unified-service-detail.component';
import { SeoService } from '../../core/services/seo.service';

async function loadSectionData(
  section: string,
  isV21: boolean,
): Promise<{
  dataSource: any[];
  backRoute: string;
  backLabel: string;
  interfacesMap?: Record<string, InterfaceDoc[]>;
} | null> {
  switch (section) {
    case 'core': {
      const mod = isV21
        ? await import('../data/v21/core.data')
        : await import('../data/v22/core.data');
      return {
        dataSource: mod.CORE_SERVICES,
        backRoute: '/docs/core',
        backLabel: 'core',
      };
    }
    case 'browser-web-apis': {
      const mod = isV21
        ? await import('../data/v21/browser-web-apis.data')
        : await import('../data/v22/browser-web-apis.data');
      return {
        dataSource: mod.BROWSER_WEB_APIS_SERVICES,
        backRoute: '/docs/browser-web-apis',
        backLabel: 'browser-web-apis',
      };
    }
    case 'security': {
      const mod = isV21
        ? await import('../data/v21/security.data')
        : await import('../data/v22/security.data');
      return {
        dataSource: mod.SECURITY_SERVICES,
        backRoute: '/docs/security',
        backLabel: 'security',
        interfacesMap: mod.SECURITY_INTERFACES as unknown as Record<string, InterfaceDoc[]>,
      };
    }
    case 'worker-http': {
      const mod = isV21
        ? await import('../data/v21/worker-http.data')
        : await import('../data/v22/worker-http.data');
      return {
        dataSource: mod.WORKER_HTTP_ENTRIES,
        backRoute: '/docs/worker-http',
        backLabel: 'worker-http',
        interfacesMap: mod.WORKER_HTTP_INTERFACES as unknown as Record<string, InterfaceDoc[]>,
      };
    }
    case 'storage': {
      const mod = isV21
        ? await import('../data/v21/storage.data')
        : await import('../data/v22/storage.data');
      return {
        dataSource: mod.STORAGE_SERVICES,
        backRoute: '/docs/storage',
        backLabel: 'storage',
        interfacesMap: mod.STORAGE_INTERFACES as Record<string, InterfaceDoc[]>,
      };
    }
    case 'openlayers': {
      const mod = isV21
        ? await import('../data/v21/openlayers.data')
        : await import('../data/v22/openlayers.data');
      return {
        dataSource: mod.OPENLAYERS_SERVICES,
        backRoute: '/docs/openlayers',
        backLabel: 'openlayers',
      };
    }
    case 'yjs': {
      const mod = isV21
        ? await import('../data/v21/yjs.data')
        : await import('../data/v22/yjs.data');
      return {
        dataSource: mod.YJS_SERVICES,
        backRoute: '/docs/yjs',
        backLabel: 'yjs',
      };
    }
    case 'testing': {
      const mod = isV21
        ? await import('../data/v21/testing.data')
        : await import('../data/v22/testing.data');
      return {
        dataSource: mod.TESTING_SERVICES,
        backRoute: '/docs/testing',
        backLabel: 'testing',
      };
    }
    default:
      return null;
  }
}

export async function resolveServiceDetailData(
  section: string,
  itemId: string,
  version: 'v21' | 'v22',
  router: Router,
  seo: SeoService,
): Promise<ServiceDetailConfig | null> {
  const isV21 = version === 'v21';
  const sectionData = await loadSectionData(section, isV21);

  // Safety check for invalid section - redirect to docs
  if (!sectionData) {
    await router.navigate(['/docs']);
    return null;
  }

  const item = sectionData.dataSource.find((s) => s.id === itemId);

  // If service not found, redirect to section overview
  if (!item) {
    await router.navigate([sectionData.backRoute]);
    return null;
  }

  // Update SEO Metadata dynamically
  seo.updateMetadata({
    title: item.name,
    description: item.description,
    url: `${sectionData.backRoute}/${itemId}`,
  });

  return {
    service: item,
    section: section as ServiceDetailConfig['section'],
    backRoute: sectionData.backRoute,
    backLabel: sectionData.backLabel,
    interfaces: sectionData.interfacesMap?.[itemId],
  };
}

export const serviceDetailResolver: ResolveFn<ServiceDetailConfig> = async (route) => {
  const router = inject(Router);
  const seo = inject(SeoService);
  const versionService = inject(DocsVersionService);

  const section = route.url[0]?.path ?? '';
  const paramName =
    section === 'worker-http'
      ? 'entry'
      : section === 'openlayers'
        ? 'component'
        : section === 'core'
          ? 'entry'
          : 'service';
  const itemId = route.paramMap.get(paramName) ?? '';

  const result = await resolveServiceDetailData(
    section,
    itemId,
    versionService.version(),
    router,
    seo,
  );
  return result as ServiceDetailConfig;
};

export function serviceDetailResource(ctx: ResourceContext, section: string) {
  const router = inject(Router);
  const seo = inject(SeoService);
  const versionService = inject(DocsVersionService);

  const paramName =
    section === 'worker-http'
      ? 'entry'
      : section === 'openlayers'
        ? 'component'
        : section === 'core'
          ? 'entry'
          : 'service';

  return resource({
    params: () => {
      const p = ctx.params();
      const itemId = (p[paramName] as string | undefined) ?? '';
      const version = versionService.version();
      return { section, itemId, version };
    },
    loader: async ({ params }) => {
      const result = await resolveServiceDetailData(
        params.section,
        params.itemId,
        params.version,
        router,
        seo,
      );
      return result as ServiceDetailConfig;
    },
  });
}
