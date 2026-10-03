import { type ResolveFn, Router, type ResourceContext } from '@angular/router';
import { inject, resource } from '@angular/core';
import { DocsVersionService } from '../services/docs-version.service';
import {
  type ServiceDetailConfig,
  type InterfaceDoc,
} from '../feature/unified-service-detail/unified-service-detail.component';
import { SeoService } from '../../core/services/seo.service';

// Import v21 data
import * as browserWebApisV21 from '../data/v21/browser-web-apis.data';
import * as coreV21 from '../data/v21/core.data';
import * as securityV21 from '../data/v21/security.data';
import * as workerHttpV21 from '../data/v21/worker-http.data';
import * as openlayersV21 from '../data/v21/openlayers.data';
import * as storageV21 from '../data/v21/storage.data';

// Import v22 data
import * as browserWebApisV22 from '../data/v22/browser-web-apis.data';
import * as coreV22 from '../data/v22/core.data';
import * as securityV22 from '../data/v22/security.data';
import * as workerHttpV22 from '../data/v22/worker-http.data';
import * as openlayersV22 from '../data/v22/openlayers.data';
import * as storageV22 from '../data/v22/storage.data';
import * as yjsV22 from '../data/v22/yjs.data';

function getInterfaces(
  section: string,
  itemId: string,
  isV21: boolean,
): InterfaceDoc[] | undefined {
  if (section === 'security') {
    const interfaces = isV21 ? securityV21.SECURITY_INTERFACES : securityV22.SECURITY_INTERFACES;
    return (interfaces as unknown as Record<string, InterfaceDoc[]>)[itemId];
  }
  if (section === 'worker-http') {
    const interfaces = isV21
      ? workerHttpV21.WORKER_HTTP_INTERFACES
      : workerHttpV22.WORKER_HTTP_INTERFACES;
    return (interfaces as unknown as Record<string, InterfaceDoc[]>)[itemId];
  }
  if (section === 'storage') {
    const interfaces = isV21 ? storageV21.STORAGE_INTERFACES : storageV22.STORAGE_INTERFACES;
    return (interfaces as Record<string, InterfaceDoc[]>)[itemId];
  }
  return undefined;
}

export async function resolveServiceDetailData(
  section: string,
  itemId: string,
  version: 'v21' | 'v22',
  router: Router,
  seo: SeoService,
): Promise<ServiceDetailConfig | null> {
  const isV21 = version === 'v21';

  const sectionDataMap: Record<
    string,
    { dataSource: any[]; backRoute: string; backLabel: string }
  > = {
    core: {
      dataSource: isV21 ? coreV21.CORE_SERVICES : coreV22.CORE_SERVICES,
      backRoute: '/docs/core',
      backLabel: 'core',
    },
    'browser-web-apis': {
      dataSource: isV21
        ? browserWebApisV21.BROWSER_WEB_APIS_SERVICES
        : browserWebApisV22.BROWSER_WEB_APIS_SERVICES,
      backRoute: '/docs/browser-web-apis',
      backLabel: 'browser-web-apis',
    },
    security: {
      dataSource: isV21 ? securityV21.SECURITY_SERVICES : securityV22.SECURITY_SERVICES,
      backRoute: '/docs/security',
      backLabel: 'security',
    },
    'worker-http': {
      dataSource: isV21 ? workerHttpV21.WORKER_HTTP_ENTRIES : workerHttpV22.WORKER_HTTP_ENTRIES,
      backRoute: '/docs/worker-http',
      backLabel: 'worker-http',
    },
    storage: {
      dataSource: isV21 ? storageV21.STORAGE_SERVICES : storageV22.STORAGE_SERVICES,
      backRoute: '/docs/storage',
      backLabel: 'storage',
    },
    openlayers: {
      dataSource: isV21 ? openlayersV21.OPENLAYERS_SERVICES : openlayersV22.OPENLAYERS_SERVICES,
      backRoute: '/docs/openlayers',
      backLabel: 'openlayers',
    },
    yjs: {
      dataSource: isV21 ? [] : yjsV22.YJS_SERVICES,
      backRoute: '/docs/yjs',
      backLabel: 'yjs',
    },
  };

  // Safety check for invalid section - redirect to docs
  if (!sectionDataMap[section]) {
    await router.navigate(['/docs']);
    return null;
  }

  const sectionData = sectionDataMap[section];
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
    interfaces: getInterfaces(section, itemId, isV21),
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
