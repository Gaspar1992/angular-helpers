export interface NavItem {
  label: string;
  route: string;
  hasFn?: boolean;
  experimental?: boolean;
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
    ],
  },
  {
    id: 'openlayers',
    label: 'OpenLayers',
    overviewRoute: '/docs/openlayers',
    sections: [
      {
        title: 'Core',
        items: [
          { label: 'Map', route: '/docs/openlayers/map' },
          { label: 'View', route: '/docs/openlayers/view' },
        ],
      },
      {
        title: 'Layers',
        items: [
          { label: 'Tile Layer', route: '/docs/openlayers/tile-layer' },
          { label: 'Vector Layer', route: '/docs/openlayers/vector-layer' },
        ],
      },
      {
        title: 'Controls',
        items: [
          { label: 'Zoom', route: '/docs/openlayers/zoom-control' },
          { label: 'Attribution', route: '/docs/openlayers/attribution-control' },
        ],
      },
      {
        title: 'Interactions',
        items: [
          { label: 'Select', route: '/docs/openlayers/select-interaction' },
          { label: 'Draw', route: '/docs/openlayers/draw-interaction' },
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
