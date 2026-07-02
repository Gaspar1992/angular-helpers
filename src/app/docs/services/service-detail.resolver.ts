import { ResolveFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { DocsVersionService } from '../services/docs-version.service';
import {
  ServiceDetailConfig,
  InterfaceDoc,
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

export const serviceDetailResolver: ResolveFn<ServiceDetailConfig> = async (route) => {
  const router = inject(Router);
  const seo = inject(SeoService);
  const versionService = inject(DocsVersionService);
  const isV21 = versionService.version() === 'v21';

  const section = route.url[0]?.path;
  const paramName =
    section === 'worker-http'
      ? 'entry'
      : section === 'openlayers'
        ? 'component'
        : section === 'core'
          ? 'entry'
          : 'service';
  const itemId = route.paramMap.get(paramName) ?? '';

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
  };

  // Safety check for invalid section - redirect to docs
  if (!sectionDataMap[section]) {
    await router.navigate(['/docs']);
    return null as unknown as ServiceDetailConfig;
  }

  const sectionData = sectionDataMap[section];
  const item = sectionData.dataSource.find((s) => s.id === itemId);

  // If service not found, redirect to section overview
  if (!item) {
    await router.navigate([sectionData.backRoute]);
    return null as unknown as ServiceDetailConfig;
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
};
