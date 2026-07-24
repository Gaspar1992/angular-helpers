import { AngularVersion } from '../models/angular-version.model';

export interface NavItem {
  label: string;
  route: string;
  hasFn?: boolean;
  experimental?: boolean;
  since?: AngularVersion;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface LibraryNav {
  id: string;
  label: string;
  overviewRoute: string;
  sections: NavSection[];
}

export const DOCS_NAV_LIBRARIES: readonly LibraryNav[] = [
  {
    id: 'core',
    label: 'Core',
    overviewRoute: '/docs/core',
    sections: [
      {
        title: 'Platform',
        items: [{ label: 'injectPlatform', route: '/docs/core/inject-platform', hasFn: true }],
      },
      {
        title: 'Workers',
        items: [
          { label: 'isTransferable', route: '/docs/core/is-transferable', hasFn: true },
          { label: 'WorkerPool', route: '/docs/core/worker-pool' },
        ],
      },
    ],
  },
  {
    id: 'browser-web-apis',
    label: 'Browser Web APIs',
    overviewRoute: '/docs/browser-web-apis',
    sections: [
      {
        title: 'Media & Devices',
        items: [
          { label: 'Camera', route: '/docs/browser-web-apis/camera' },
          { label: 'Geolocation', route: '/docs/browser-web-apis/geolocation', hasFn: true },
          { label: 'Media Devices', route: '/docs/browser-web-apis/media-devices' },
          { label: 'Media Recorder', route: '/docs/browser-web-apis/media-recorder' },
          { label: 'Web Audio', route: '/docs/browser-web-apis/web-audio' },
          { label: 'Gamepad', route: '/docs/browser-web-apis/gamepad', hasFn: true },
          { label: 'Vibration', route: '/docs/browser-web-apis/vibration' },
          { label: 'Speech Synthesis', route: '/docs/browser-web-apis/speech-synthesis' },
          {
            label: 'Idle Detector',
            route: '/docs/browser-web-apis/idle-detector',
            hasFn: true,
            experimental: true,
          },
          { label: 'EyeDropper', route: '/docs/browser-web-apis/eye-dropper', experimental: true },
          {
            label: 'Barcode Detector',
            route: '/docs/browser-web-apis/barcode-detector',
            experimental: true,
          },
          {
            label: 'Web Bluetooth',
            route: '/docs/browser-web-apis/web-bluetooth',
            experimental: true,
          },
          { label: 'Web USB', route: '/docs/browser-web-apis/web-usb', experimental: true },
          { label: 'Web NFC', route: '/docs/browser-web-apis/web-nfc', experimental: true },
        ],
      },
      {
        title: 'Storage & I/O',
        items: [
          { label: 'Clipboard', route: '/docs/browser-web-apis/clipboard', hasFn: true },
          { label: 'File System Access', route: '/docs/browser-web-apis/file-system-access' },
          { label: 'Web Storage', route: '/docs/browser-web-apis/web-storage' },
          { label: 'Storage Manager', route: '/docs/browser-web-apis/storage-manager' },
          { label: 'Compression Streams', route: '/docs/browser-web-apis/compression' },
          { label: 'Battery', route: '/docs/browser-web-apis/battery', hasFn: true },
          {
            label: 'injectBatteryResource',
            route: '/docs/browser-web-apis/inject-battery-resource',
            hasFn: true,
            since: AngularVersion.v22,
          },
        ],
      },
      {
        title: 'Network',
        items: [
          { label: 'WebSocket', route: '/docs/browser-web-apis/web-socket' },
          { label: 'Server-Sent Events', route: '/docs/browser-web-apis/server-sent-events' },
          { label: 'Broadcast Channel', route: '/docs/browser-web-apis/broadcast-channel' },
          {
            label: 'Network Information',
            route: '/docs/browser-web-apis/network-information',
            hasFn: true,
          },
          {
            label: 'injectNetworkInformationResource',
            route: '/docs/browser-web-apis/inject-network-information-resource',
            hasFn: true,
            since: AngularVersion.v22,
          },
        ],
      },
      {
        title: 'Observers',
        items: [
          {
            label: 'Intersection Observer',
            route: '/docs/browser-web-apis/intersection-observer',
            hasFn: true,
          },
          {
            label: 'Resize Observer',
            route: '/docs/browser-web-apis/resize-observer',
            hasFn: true,
          },
          {
            label: 'Mutation Observer',
            route: '/docs/browser-web-apis/mutation-observer',
            hasFn: true,
          },
          {
            label: 'Performance Observer',
            route: '/docs/browser-web-apis/performance-observer',
            hasFn: true,
          },
        ],
      },
      {
        title: 'System',
        items: [
          { label: 'Notifications', route: '/docs/browser-web-apis/notification' },
          {
            label: 'Page Visibility',
            route: '/docs/browser-web-apis/page-visibility',
            hasFn: true,
          },
          { label: 'Fullscreen', route: '/docs/browser-web-apis/fullscreen' },
          {
            label: 'Screen Wake Lock',
            route: '/docs/browser-web-apis/screen-wake-lock',
            hasFn: true,
          },
          {
            label: 'Screen Orientation',
            route: '/docs/browser-web-apis/screen-orientation',
            hasFn: true,
          },
          { label: 'Web Share', route: '/docs/browser-web-apis/web-share' },
          {
            label: 'Payment Request',
            route: '/docs/browser-web-apis/payment-request',
            experimental: true,
          },
          {
            label: 'Credential Management',
            route: '/docs/browser-web-apis/credential-management',
            experimental: true,
          },
        ],
      },
      {
        title: 'Worker & Compute',
        items: [
          { label: 'Web Worker', route: '/docs/browser-web-apis/web-worker' },
          { label: 'Web Locks', route: '/docs/browser-web-apis/web-locks' },
        ],
      },
      {
        title: 'Security',
        items: [
          { label: 'Permissions', route: '/docs/browser-web-apis/permissions' },
          { label: 'Browser Capability', route: '/docs/browser-web-apis/browser-capability' },
        ],
      },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    overviewRoute: '/docs/security',
    sections: [
      {
        title: 'Input Protection',
        items: [
          { label: 'RegexSecurityBuilder', route: '/docs/security/regex-security-builder' },
          { label: 'RegexSecurityService', route: '/docs/security/regex-security' },
          { label: 'InputSanitizerService', route: '/docs/security/input-sanitizer' },
        ],
      },
      {
        title: 'Cryptography',
        items: [
          { label: 'WebCryptoService', route: '/docs/security/web-crypto' },
          { label: 'SecureStorageService', route: '/docs/security/secure-storage' },
          { label: 'JwtService', route: '/docs/security/jwt' },
        ],
      },
      {
        title: 'Password & Auth',
        items: [
          { label: 'PasswordStrengthService', route: '/docs/security/password-strength' },
          { label: 'HibpService', route: '/docs/security/hibp' },
          { label: 'CsrfService', route: '/docs/security/csrf' },
          { label: 'RateLimiterService', route: '/docs/security/rate-limiter' },
        ],
      },
      {
        title: 'Forms & UI',
        items: [
          { label: 'SecurityValidators', route: '/docs/security/security-validators' },
          { label: 'Signal Forms validators', route: '/docs/security/signal-forms-validators' },
          { label: 'SensitiveClipboardService', route: '/docs/security/sensitive-clipboard' },
        ],
      },
    ],
  },
  {
    id: 'worker-http',
    label: 'Worker HTTP',
    overviewRoute: '/docs/worker-http',
    sections: [
      {
        title: 'Core',
        items: [
          { label: 'createWorkerTransport', route: '/docs/worker-http/transport' },
          { label: 'provideWorkerHttpClient', route: '/docs/worker-http/backend' },
        ],
      },
      {
        title: 'Interceptors & Pipeline',
        items: [{ label: 'createWorkerPipeline', route: '/docs/worker-http/interceptors' }],
      },
      {
        title: 'Serialization',
        items: [{ label: 'Serializers', route: '/docs/worker-http/serializer' }],
      },
      {
        title: 'Cryptography',
        items: [{ label: 'WebCrypto Utilities', route: '/docs/worker-http/crypto' }],
      },
      {
        title: 'Realtime',
        items: [
          {
            label: 'Realtime Clients',
            route: '/docs/worker-http/realtime',
            since: AngularVersion.v22,
          },
        ],
      },
    ],
  },
  {
    id: 'storage',
    label: 'Storage',
    overviewRoute: '/docs/storage',
    sections: [
      {
        title: 'Core primitives',
        items: [
          {
            label: 'injectStorageSignal',
            route: '/docs/storage/inject-storage-signal',
            hasFn: true,
          },
          { label: 'injectEntityStore', route: '/docs/storage/inject-entity-store', hasFn: true },
          { label: 'OfflineSyncService', route: '/docs/storage/offline-sync' },
          {
            label: 'injectStorageResource',
            route: '/docs/storage/inject-storage-resource',
            hasFn: true,
            since: AngularVersion.v22,
          },
        ],
      },
      {
        title: 'Transports & Tokens',
        items: [
          { label: 'LocalStorageTransport', route: '/docs/storage/local-transport' },
          { label: 'WorkerStorageTransport', route: '/docs/storage/worker-transport' },
          { label: 'StorageTransport', route: '/docs/storage/storage-transport' },
        ],
      },
    ],
  },
  {
    id: 'openlayers',
    label: 'OpenLayers',
    overviewRoute: '/docs/openlayers',
    sections: [
      {
        title: 'Core',
        items: [{ label: 'Map', route: '/docs/openlayers/map' }],
      },
      {
        title: 'Layers',
        items: [
          { label: 'Tile Layer', route: '/docs/openlayers/tile-layer' },
          { label: 'Vector Layer', route: '/docs/openlayers/vector-layer' },
          { label: 'WebGL Tile Layer', route: '/docs/openlayers/webgl-tile-layer' },
          { label: 'WebGL Vector Layer', route: '/docs/openlayers/webgl-vector-layer' },
          { label: 'Heatmap Layer', route: '/docs/openlayers/heatmap-layer' },
          { label: 'Cluster', route: '/docs/openlayers/cluster' },
        ],
      },
      {
        title: 'Overlays',
        items: [
          { label: 'Popup', route: '/docs/openlayers/popup' },
          { label: 'Tooltip', route: '/docs/openlayers/tooltip' },
        ],
      },
      {
        title: 'Controls',
        items: [
          { label: 'Zoom', route: '/docs/openlayers/zoom-control' },
          { label: 'Attribution', route: '/docs/openlayers/attribution-control' },
          { label: 'Scale Line', route: '/docs/openlayers/scale-line-control' },
          { label: 'Fullscreen', route: '/docs/openlayers/fullscreen-control' },
          { label: 'Layer Switcher', route: '/docs/openlayers/layer-switcher' },
          { label: 'Basemap Switcher', route: '/docs/openlayers/basemap-switcher' },
        ],
      },
      {
        title: 'Interactions',
        items: [
          {
            label: 'Select Interaction',
            route: '/docs/openlayers/select-interaction',
            since: AngularVersion.v22,
          },
        ],
      },
      {
        title: 'Military',
        items: [
          { label: 'Military Service', route: '/docs/openlayers/military' },
          { label: 'Tactical Graphics', route: '/docs/openlayers/tactical-graphics' },
        ],
      },
    ],
  },
];

// Legacy export for backward compatibility during migration
export interface NavSectionLegacy {
  label: string;
  overviewRoute: string;
  servicesLabel: string;
  serviceItems: NavItem[];
}

export const DOCS_NAV_SECTIONS: readonly NavSectionLegacy[] = DOCS_NAV_LIBRARIES.map((lib) => ({
  label: lib.id,
  overviewRoute: lib.overviewRoute,
  servicesLabel: 'Services',
  serviceItems: lib.sections.flatMap((section) => section.items),
}));

export function getNavLibrariesForVersion(version: AngularVersion): readonly LibraryNav[] {
  if (version === AngularVersion.v21) {
    return DOCS_NAV_LIBRARIES.map((lib) => ({
      ...lib,
      sections: lib.sections
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) => !item.experimental && item.since !== AngularVersion.v22,
          ),
        }))
        .filter((section) => section.items.length > 0),
    }));
  }
  return DOCS_NAV_LIBRARIES;
}
