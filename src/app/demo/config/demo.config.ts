export interface DemoSection {
  path: string;
  title: string;
  description: string;
  icon: string;
  packageName: string;
}

export const PUBLIC_DEMO_SECTIONS: readonly DemoSection[] = [
  {
    path: '/demo/browser-apis',
    title: 'Browser Web APIs',
    description: 'Geolocation, Camera, WebSocket, Clipboard, and 33 more typed Angular services.',
    icon: '🌐',
    packageName: '@angular-helpers/browser-web-apis',
  },
  {
    path: '/demo/security',
    title: 'Security',
    description:
      'ReDoS-safe regex, WebCrypto, SecureStorage, InputSanitizer, and PasswordStrength.',
    icon: '🛡️',
    packageName: '@angular-helpers/security',
  },
  {
    path: '/demo/security-utilities',
    title: 'Security Utilities',
    description:
      'Reactive Forms validators, JWT inspection, HIBP, CSRF, rate limiter, and sensitive clipboard.',
    icon: '🧰',
    packageName: '@angular-helpers/security',
  },
  {
    path: '/demo/security-signal-forms',
    title: 'Security — Signal Forms',
    description:
      'Angular v21 Signal Forms validators with sync strongPassword and async hibpPassword rules.',
    icon: '🧪',
    packageName: '@angular-helpers/security/signal-forms',
  },
  {
    path: '/demo/worker-http',
    title: 'Worker HTTP',
    description:
      'Off-main-thread HTTP with typed RPC bridge, interceptors, and pluggable serialization.',
    icon: '🚀',
    packageName: '@angular-helpers/worker-http',
  },
  {
    path: '/demo/worker-http-benchmark',
    title: 'Worker HTTP — Benchmarks',
    description:
      'Reproducible benchmarks comparing main-thread vs worker transports across 4 workloads.',
    icon: '📊',
    packageName: '@angular-helpers/worker-http',
  },
  {
    path: '/demo/openlayers',
    title: 'OpenLayers',
    description:
      'Interactive maps with OpenLayers: tile layers, controls, and reactive vector layers.',
    icon: '🗺️',
    packageName: '@angular-helpers/openlayers',
  },
];
