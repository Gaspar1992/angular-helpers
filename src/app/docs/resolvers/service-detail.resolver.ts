import { ResolveFn } from '@angular/router';
import { Type } from '@angular/core';
import { ServiceDoc } from '../models/doc-meta.model';
import { BROWSER_WEB_APIS_SERVICES } from '../data/browser-web-apis.data';
import { SECURITY_SERVICES, SECURITY_INTERFACES } from '../data/security.data';
import { WORKER_HTTP_ENTRIES, WORKER_HTTP_INTERFACES } from '../data/worker-http.data';
import {
  ServiceDetailConfig,
  InterfaceDoc,
} from '../../features/docs/unified-service-detail/unified-service-detail.component';

// Demo components map - lazy loaded
const DEMO_COMPONENTS: Record<string, () => Promise<Type<unknown>>> = {
  // Browser Web APIs
  'broadcast-channel': () =>
    import('../../demo/services/broadcast-channel/broadcast-channel-demo.component').then(
      (m) => m.BroadcastChannelDemoComponent,
    ),
  camera: () =>
    import('../../demo/services/camera/camera-demo.component').then((m) => m.CameraDemoComponent),
  clipboard: () =>
    import('../../demo/services/clipboard/clipboard-demo.component').then(
      (m) => m.ClipboardDemoComponent,
    ),
  geolocation: () =>
    import('../../demo/services/geolocation/geolocation-demo.component').then(
      (m) => m.GeolocationDemoComponent,
    ),
  notification: () =>
    import('../../demo/services/notification/notification-demo.component').then(
      (m) => m.NotificationDemoComponent,
    ),
};

const SECTION_DATA = {
  'browser-web-apis': {
    dataSource: BROWSER_WEB_APIS_SERVICES,
    backRoute: '/docs/browser-web-apis',
    backLabel: 'browser-web-apis',
    hasDemoTab: true,
  },
  security: {
    dataSource: SECURITY_SERVICES,
    backRoute: '/docs/security',
    backLabel: 'security',
    hasDemoTab: true,
  },
  'worker-http': {
    dataSource: WORKER_HTTP_ENTRIES,
    backRoute: '/docs/worker-http',
    backLabel: 'worker-http',
    hasDemoTab: false,
  },
};

function getInterfaces(section: string, itemId: string): InterfaceDoc[] | undefined {
  if (section === 'security') {
    return SECURITY_INTERFACES[itemId];
  }
  if (section === 'worker-http') {
    return WORKER_HTTP_INTERFACES[itemId];
  }
  return undefined;
}

export const serviceDetailResolver: ResolveFn<ServiceDetailConfig> = async (route) => {
  const section = route.url[0]?.path as keyof typeof SECTION_DATA;
  const paramName = section === 'worker-http' ? 'entry' : 'service';
  const itemId = route.paramMap.get(paramName) ?? '';

  // Safety check for invalid section
  if (!SECTION_DATA[section]) {
    return {
      service: {} as ServiceDoc,
      section: 'browser-web-apis',
      backRoute: '/docs',
      backLabel: 'docs',
      hasDemoTab: false,
    };
  }

  const sectionData = SECTION_DATA[section];
  const item = sectionData.dataSource.find((s) => s.id === itemId);

  if (!item) {
    return {
      service: {} as ServiceDoc,
      section: section as ServiceDetailConfig['section'],
      backRoute: sectionData.backRoute,
      backLabel: sectionData.backLabel,
      hasDemoTab: false,
    };
  }

  // Lazy load demo component if available
  let demoComponent: Type<unknown> | undefined;
  const demoLoader = DEMO_COMPONENTS[itemId];
  if (demoLoader) {
    demoComponent = await demoLoader();
  }

  return {
    service: item,
    section: section as ServiceDetailConfig['section'],
    backRoute: sectionData.backRoute,
    backLabel: sectionData.backLabel,
    hasDemoTab: sectionData.hasDemoTab && !!demoComponent,
    demoComponent,
    interfaces: getInterfaces(section, itemId),
  };
};
