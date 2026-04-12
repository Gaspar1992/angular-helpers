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
    path: '/demo/worker-http',
    title: 'Worker HTTP',
    description:
      'Off-main-thread HTTP with typed RPC bridge, interceptors, and pluggable serialization.',
    icon: '🚀',
    packageName: '@angular-helpers/worker-http',
  },
];
