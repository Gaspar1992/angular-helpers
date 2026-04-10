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

// Lazy loaded demo components map
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
  'file-system-access': () =>
    import('../../demo/services/file-system-access/file-system-access-demo.component').then(
      (m) => m.FileSystemAccessDemoComponent,
    ),
  fullscreen: () =>
    import('../../demo/services/fullscreen/fullscreen-demo.component').then(
      (m) => m.FullscreenDemoComponent,
    ),
  geolocation: () =>
    import('../../demo/services/geolocation/geolocation-demo.component').then(
      (m) => m.GeolocationDemoComponent,
    ),
  'intersection-observer': () =>
    import('../../demo/services/intersection-observer/intersection-observer-demo.component').then(
      (m) => m.IntersectionObserverDemoComponent,
    ),
  'media-devices': () =>
    import('../../demo/services/media-devices/media-devices-demo.component').then(
      (m) => m.MediaDevicesDemoComponent,
    ),
  'media-recorder': () =>
    import('../../demo/services/media-recorder/media-recorder-demo.component').then(
      (m) => m.MediaRecorderDemoComponent,
    ),
  'network-information': () =>
    import('../../demo/services/network-information/network-information-demo.component').then(
      (m) => m.NetworkInformationDemoComponent,
    ),
  notification: () =>
    import('../../demo/services/notification/notification-demo.component').then(
      (m) => m.NotificationDemoComponent,
    ),
  'page-visibility': () =>
    import('../../demo/services/page-visibility/page-visibility-demo.component').then(
      (m) => m.PageVisibilityDemoComponent,
    ),
  'resize-observer': () =>
    import('../../demo/services/resize-observer/resize-observer-demo.component').then(
      (m) => m.ResizeObserverDemoComponent,
    ),
  'screen-orientation': () =>
    import('../../demo/services/screen-orientation/screen-orientation-demo.component').then(
      (m) => m.ScreenOrientationDemoComponent,
    ),
  'screen-wake-lock': () =>
    import('../../demo/services/screen-wake-lock/screen-wake-lock-demo.component').then(
      (m) => m.ScreenWakeLockDemoComponent,
    ),
  'server-sent-events': () =>
    import('../../demo/services/server-sent-events/server-sent-events-demo.component').then(
      (m) => m.ServerSentEventsDemoComponent,
    ),
  'speech-synthesis': () =>
    import('../../demo/services/speech-synthesis/speech-synthesis-demo.component').then(
      (m) => m.SpeechSynthesisDemoComponent,
    ),
  vibration: () =>
    import('../../demo/services/vibration/vibration-demo.component').then(
      (m) => m.VibrationDemoComponent,
    ),
  // Security
  'regex-security': () =>
    import('../../demo/services/regex-security/regex-security-demo.component').then(
      (m) => m.RegexSecurityDemoComponent,
    ),
  'web-crypto': () =>
    import('../../demo/services/web-crypto/web-crypto-demo.component').then(
      (m) => m.WebCryptoDemoComponent,
    ),
  'secure-storage': () =>
    import('../../demo/services/secure-storage/secure-storage-demo.component').then(
      (m) => m.SecureStorageDemoComponent,
    ),
  'input-sanitizer': () =>
    import('../../demo/services/input-sanitizer/input-sanitizer-demo.component').then(
      (m) => m.InputSanitizerDemoComponent,
    ),
  'password-strength': () =>
    import('../../demo/services/password-strength/password-strength-demo.component').then(
      (m) => m.PasswordStrengthDemoComponent,
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
} as const;

function getInterfaces(section: string, itemId: string): InterfaceDoc[] | undefined {
  if (section === 'security' && itemId === 'regex-security') {
    return SECURITY_INTERFACES as InterfaceDoc[];
  }
  if (section === 'worker-http') {
    switch (itemId) {
      case 'transport':
        return WORKER_HTTP_INTERFACES.filter((i) =>
          ['WorkerTransportConfig', 'WorkerInterceptorFn'].includes(i.name),
        ) as InterfaceDoc[];
      case 'interceptors':
        return WORKER_HTTP_INTERFACES.filter((i) =>
          ['RetryConfig', 'CacheConfig', 'HmacSigningConfig'].includes(i.name),
        ) as InterfaceDoc[];
      case 'serializer':
        return WORKER_HTTP_INTERFACES.filter(
          (i) => i.name === 'AutoSerializerConfig',
        ) as InterfaceDoc[];
      default:
        return undefined;
    }
  }
  return undefined;
}

export const serviceDetailResolver: ResolveFn<ServiceDetailConfig> = async (route) => {
  // Get section from the route URL - first segment after /docs/
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

  // Load demo component if available
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
    hasDemoTab: sectionData.hasDemoTab,
    demoComponent,
    interfaces: getInterfaces(section, itemId),
  };
};
