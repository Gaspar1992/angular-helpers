import { ResolveFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { BROWSER_WEB_APIS_SERVICES } from '../data/browser-web-apis.data';
import { SECURITY_SERVICES, SECURITY_INTERFACES } from '../data/security.data';
import { WORKER_HTTP_ENTRIES, WORKER_HTTP_INTERFACES } from '../data/worker-http.data';
import { OPENLAYERS_SERVICES } from '../data/openlayers.data';
import { STORAGE_SERVICES, STORAGE_INTERFACES } from '../data/storage.data';
import {
  ServiceDetailConfig,
  InterfaceDoc,
} from '../feature/unified-service-detail/unified-service-detail.component';
import { SeoService } from '../../core/services/seo.service';

const SECTION_DATA = {
  'browser-web-apis': {
    dataSource: BROWSER_WEB_APIS_SERVICES,
    backRoute: '/docs/browser-web-apis',
    backLabel: 'browser-web-apis',
  },
  security: {
    dataSource: SECURITY_SERVICES,
    backRoute: '/docs/security',
    backLabel: 'security',
  },
  'worker-http': {
    dataSource: WORKER_HTTP_ENTRIES,
    backRoute: '/docs/worker-http',
    backLabel: 'worker-http',
  },
  storage: {
    dataSource: STORAGE_SERVICES,
    backRoute: '/docs/storage',
    backLabel: 'storage',
  },
  openlayers: {
    dataSource: OPENLAYERS_SERVICES,
    backRoute: '/docs/openlayers',
    backLabel: 'openlayers',
  },
};

function getInterfaces(section: string, itemId: string): InterfaceDoc[] | undefined {
  if (section === 'security') {
    return SECURITY_INTERFACES[itemId];
  }
  if (section === 'worker-http') {
    return WORKER_HTTP_INTERFACES[itemId];
  }
  if (section === 'storage') {
    return STORAGE_INTERFACES[itemId];
  }
  return undefined;
}

export const serviceDetailResolver: ResolveFn<ServiceDetailConfig> = async (route) => {
  const router = inject(Router);
  const seo = inject(SeoService);
  const section = route.url[0]?.path as keyof typeof SECTION_DATA;
  const paramName =
    section === 'worker-http' ? 'entry' : section === 'openlayers' ? 'component' : 'service';
  const itemId = route.paramMap.get(paramName) ?? '';

  // Safety check for invalid section - redirect to docs
  if (!SECTION_DATA[section]) {
    await router.navigate(['/docs']);
    return null as unknown as ServiceDetailConfig;
  }

  const sectionData = SECTION_DATA[section];
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
    interfaces: getInterfaces(section, itemId),
  };
};
