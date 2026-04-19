export interface PackageInfo {
  icon: string;
  name: string;
  npmPackage: string;
  tagline: string;
  description: string;
  highlights: string[];
  highlightsLabel: string;
  installCmd: string;
  docsLink: string;
  demoLink: string | null;
  badge: string | null;
  promise: 'lightweight' | 'robust' | 'performance';
  serviceCount?: number;
}

export const PACKAGES: readonly PackageInfo[] = [
  {
    icon: '🌐',
    name: 'browser-web-apis',
    npmPackage: '@angular-helpers/browser-web-apis',
    tagline: '37 typed Angular services for the browser. One provider.',
    description:
      '37 typed Angular services covering Camera, Geolocation, Storage, WebSocket, Bluetooth, NFC, Payments, Gamepad, and 29 more. Plus 9 signal-based inject() primitives.',
    highlights: [
      'Geolocation · Camera · MediaDevices · MediaRecorder',
      'WebSocket · WebWorker · ServerSentEvents · BroadcastChannel',
      'Clipboard · Notifications · WebStorage · FileSystemAccess',
      'Bluetooth · NFC · USB · Gamepad · Payments · +21 more',
    ],
    highlightsLabel: 'Included services',
    installCmd: 'npm i @angular-helpers/browser-web-apis',
    docsLink: '/docs/browser-web-apis',
    demoLink: '/demo/browser-apis',
    badge: null,
    promise: 'lightweight',
    serviceCount: 37,
  },
  {
    icon: '🛡️',
    name: 'security',
    npmPackage: '@angular-helpers/security',
    tagline: 'Worker-isolated, ReDoS-safe security primitives.',
    description:
      'ReDoS-safe regex execution in Web Workers, WebCrypto utilities (AES-GCM, HMAC), encrypted storage, input sanitization, and password strength evaluation.',
    highlights: [
      'Worker-isolated regex with timeout protection',
      'WebCrypto: AES-GCM, HMAC-SHA256/384/512, hashing',
      'SecureStorage: encrypted localStorage/sessionStorage',
      'InputSanitizer: XSS prevention, URL validation',
      'PasswordStrength: entropy-based scoring',
    ],
    highlightsLabel: 'Security features',
    installCmd: 'npm i @angular-helpers/security',
    docsLink: '/docs/security',
    demoLink: '/demo/security',
    badge: null,
    promise: 'robust',
  },
  {
    icon: '🚀',
    name: 'worker-http',
    npmPackage: '@angular-helpers/worker-http',
    tagline: 'HTTP off the main thread. Non-blocking by design.',
    description:
      'Move HTTP requests off the main thread. Typed RPC bridge, worker-side interceptor pipelines (retry, cache, HMAC signing, rate limit), and pluggable serialization.',
    highlights: [
      'Off-main-thread HTTP with typed RPC bridge',
      '7 built-in interceptors (retry, cache, HMAC, etc.)',
      '3 serialization strategies (structured clone, seroval, auto)',
      'WebCrypto HMAC/AES utilities',
    ],
    highlightsLabel: 'Worker HTTP features',
    installCmd: 'npm i @angular-helpers/worker-http',
    docsLink: '/docs/worker-http',
    demoLink: '/demo/worker-http',
    badge: null,
    promise: 'performance',
  },
];

export const TOTAL_SERVICE_COUNT = PACKAGES.reduce((sum, pkg) => sum + (pkg.serviceCount ?? 0), 0);
