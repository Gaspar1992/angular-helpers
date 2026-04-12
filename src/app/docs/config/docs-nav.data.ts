export interface NavItem {
  label: string;
  route: string;
  hasFn?: boolean;
}

export interface NavSection {
  label: string;
  overviewRoute: string;
  servicesLabel: string;
  serviceItems: NavItem[];
}

export const DOCS_NAV_SECTIONS: readonly NavSection[] = [
  {
    label: 'browser-web-apis',
    overviewRoute: '/docs/browser-web-apis',
    servicesLabel: 'Services',
    serviceItems: [
      { label: 'Barcode Detector', route: '/docs/browser-web-apis/barcode-detector' },
      { label: 'Battery', route: '/docs/browser-web-apis/battery' },
      { label: 'Browser Capability', route: '/docs/browser-web-apis/browser-capability' },
      { label: 'Broadcast Channel', route: '/docs/browser-web-apis/broadcast-channel' },
      { label: 'Camera', route: '/docs/browser-web-apis/camera' },
      { label: 'Clipboard', route: '/docs/browser-web-apis/clipboard' },
      { label: 'Credential Management', route: '/docs/browser-web-apis/credential-management' },
      { label: 'EyeDropper', route: '/docs/browser-web-apis/eye-dropper' },
      { label: 'File System Access', route: '/docs/browser-web-apis/file-system-access' },
      { label: 'Fullscreen', route: '/docs/browser-web-apis/fullscreen' },
      { label: 'Gamepad', route: '/docs/browser-web-apis/gamepad', hasFn: true },
      { label: 'Geolocation', route: '/docs/browser-web-apis/geolocation' },
      { label: 'Idle Detector', route: '/docs/browser-web-apis/idle-detector', hasFn: true },
      {
        label: 'Intersection Observer',
        route: '/docs/browser-web-apis/intersection-observer',
        hasFn: true,
      },
      { label: 'Media Devices', route: '/docs/browser-web-apis/media-devices' },
      { label: 'Media Recorder', route: '/docs/browser-web-apis/media-recorder' },
      {
        label: 'Mutation Observer',
        route: '/docs/browser-web-apis/mutation-observer',
        hasFn: true,
      },
      {
        label: 'Network Information',
        route: '/docs/browser-web-apis/network-information',
        hasFn: true,
      },
      { label: 'Notifications', route: '/docs/browser-web-apis/notification' },
      { label: 'Page Visibility', route: '/docs/browser-web-apis/page-visibility', hasFn: true },
      { label: 'Payment Request', route: '/docs/browser-web-apis/payment-request' },
      {
        label: 'Performance Observer',
        route: '/docs/browser-web-apis/performance-observer',
        hasFn: true,
      },
      { label: 'Permissions', route: '/docs/browser-web-apis/permissions' },
      { label: 'Resize Observer', route: '/docs/browser-web-apis/resize-observer', hasFn: true },
      {
        label: 'Screen Orientation',
        route: '/docs/browser-web-apis/screen-orientation',
        hasFn: true,
      },
      { label: 'Screen Wake Lock', route: '/docs/browser-web-apis/screen-wake-lock' },
      { label: 'Server-Sent Events', route: '/docs/browser-web-apis/server-sent-events' },
      { label: 'Speech Synthesis', route: '/docs/browser-web-apis/speech-synthesis' },
      { label: 'Vibration', route: '/docs/browser-web-apis/vibration' },
      { label: 'Web Audio', route: '/docs/browser-web-apis/web-audio' },
      { label: 'Web Bluetooth', route: '/docs/browser-web-apis/web-bluetooth' },
      { label: 'Web NFC', route: '/docs/browser-web-apis/web-nfc' },
      { label: 'Web Share', route: '/docs/browser-web-apis/web-share' },
      { label: 'Web USB', route: '/docs/browser-web-apis/web-usb' },
      { label: 'WebSocket', route: '/docs/browser-web-apis/web-socket' },
      { label: 'Web Storage', route: '/docs/browser-web-apis/web-storage' },
      { label: 'Web Worker', route: '/docs/browser-web-apis/web-worker' },
    ],
  },
  {
    label: 'security',
    overviewRoute: '/docs/security',
    servicesLabel: 'Services',
    serviceItems: [
      { label: 'RegexSecurityBuilder', route: '/docs/security/regex-security-builder' },
      { label: 'RegexSecurityService', route: '/docs/security/regex-security' },
      { label: 'WebCryptoService', route: '/docs/security/web-crypto' },
      { label: 'SecureStorageService', route: '/docs/security/secure-storage' },
      { label: 'InputSanitizerService', route: '/docs/security/input-sanitizer' },
      { label: 'PasswordStrengthService', route: '/docs/security/password-strength' },
    ],
  },
  {
    label: 'worker-http',
    overviewRoute: '/docs/worker-http',
    servicesLabel: 'Entry Points',
    serviceItems: [
      { label: 'createWorkerTransport', route: '/docs/worker-http/transport' },
      { label: 'createWorkerPipeline', route: '/docs/worker-http/interceptors' },
      { label: 'Serializers', route: '/docs/worker-http/serializer' },
      { label: 'WebCrypto Utilities', route: '/docs/worker-http/crypto' },
    ],
  },
];
