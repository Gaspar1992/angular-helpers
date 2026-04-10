import { BROWSER_WEB_APIS_SERVICES } from '../docs/data/browser-web-apis.data';
import { SECURITY_SERVICES } from '../docs/data/security.data';
import { WORKER_HTTP_ENTRIES } from '../docs/data/worker-http.data';

/**
 * Service group configurations for docs overview pages.
 * Static configuration for displaying services grouped by category.
 */

export const BROWSER_WEB_APIS_GROUPS = [
  {
    label: 'Media & Device',
    icon: '📷',
    items: BROWSER_WEB_APIS_SERVICES.filter((s) =>
      ['camera', 'media-devices', 'media-recorder', 'geolocation', 'notification'].includes(s.id),
    ),
  },
  {
    label: 'Observer APIs',
    icon: '👁',
    items: BROWSER_WEB_APIS_SERVICES.filter((s) =>
      [
        'intersection-observer',
        'resize-observer',
        'mutation-observer',
        'performance-observer',
      ].includes(s.id),
    ),
  },
  {
    label: 'System APIs',
    icon: '🖥',
    items: BROWSER_WEB_APIS_SERVICES.filter((s) =>
      [
        'page-visibility',
        'screen-wake-lock',
        'screen-orientation',
        'fullscreen',
        'vibration',
        'speech-synthesis',
        'idle-detector',
        'gamepad',
        'web-audio',
      ].includes(s.id),
    ),
  },
  {
    label: 'Network APIs',
    icon: '🌐',
    items: BROWSER_WEB_APIS_SERVICES.filter((s) =>
      ['web-socket', 'server-sent-events', 'broadcast-channel', 'network-information'].includes(
        s.id,
      ),
    ),
  },
  {
    label: 'Storage & I/O',
    icon: '💾',
    items: BROWSER_WEB_APIS_SERVICES.filter((s) =>
      ['web-storage', 'web-share', 'clipboard', 'battery', 'file-system-access'].includes(s.id),
    ),
  },
  {
    label: 'Web Worker & Compute',
    icon: '⚙',
    items: BROWSER_WEB_APIS_SERVICES.filter((s) => ['web-worker'].includes(s.id)),
  },
  {
    label: 'Device Connectivity',
    icon: '🔌',
    items: BROWSER_WEB_APIS_SERVICES.filter((s) =>
      ['web-bluetooth', 'web-usb', 'web-nfc'].includes(s.id),
    ),
  },
  {
    label: 'Detection APIs',
    icon: '🔍',
    items: BROWSER_WEB_APIS_SERVICES.filter((s) =>
      ['eye-dropper', 'barcode-detector'].includes(s.id),
    ),
  },
  {
    label: 'Commerce & Identity',
    icon: '🪪',
    items: BROWSER_WEB_APIS_SERVICES.filter((s) =>
      ['payment-request', 'credential-management'].includes(s.id),
    ),
  },
  {
    label: 'Security & Permissions',
    icon: '🔐',
    items: BROWSER_WEB_APIS_SERVICES.filter((s) =>
      ['permissions', 'browser-capability'].includes(s.id),
    ),
  },
];

export const SECURITY_GROUPS = [
  {
    label: 'Security Services',
    icon: '🔐',
    items: SECURITY_SERVICES,
  },
];

export const WORKER_HTTP_GROUPS = [
  {
    label: 'Entry Points',
    icon: '⚙',
    items: WORKER_HTTP_ENTRIES,
  },
];

export const PROVIDER_EXAMPLES: Record<string, string> = {
  'browser-web-apis': `import { provideBrowserWebApis } from '@angular-helpers/browser-web-apis';

bootstrapApplication(AppComponent, {
  providers: [
    provideBrowserWebApis({
      enableCamera: true,
      enableGeolocation: true,
      enableWebStorage: true,
      enableWebSocket: true,
    }),
  ],
});`,
  security: `import { provideSecurity } from '@angular-helpers/security';

bootstrapApplication(AppComponent, {
  providers: [
    provideSecurity({
      enableRegexSecurity: true,
      enableWebCrypto: true,
      enableSecureStorage: true,
    }),
  ],
});`,
  'worker-http': `import { provideWorkerHttp } from '@angular-helpers/worker-http';

bootstrapApplication(AppComponent, {
  providers: [
    provideWorkerHttp({
      defaultTimeout: 30000,
    }),
  ],
});`,
};

export const SECTION_LEADS: Record<string, string> = {
  'browser-web-apis':
    'Angular services for structured, secure, and reactive access to Browser Web APIs. All services are tree-shakable, lifecycle-safe, and built with signals and OnPush change detection.',
  security:
    'Security-focused Angular services for regex validation, Web Crypto operations, secure storage, input sanitization, and password strength checking.',
  'worker-http':
    'HTTP client for Web Workers with interceptors, retry logic, caching, and HMAC signing. Offload heavy HTTP operations to background threads.',
};
