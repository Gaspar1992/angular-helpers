import { ServiceDoc } from '../models/doc-meta.model';

export const BROWSER_WEB_APIS_SERVICES: ServiceDoc[] = [
  {
    id: 'battery',
    name: 'BatteryService',
    description:
      'Provides access to the Battery Status API, allowing you to monitor device battery level, charging state, and receive reactive updates via Observables.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari ✗ · Edge ✓',
    notes: ['Call initialize() before any other method.', 'Battery API is not available in Safari.'],
    methods: [
      {
        name: 'initialize',
        signature: 'initialize(): Promise<BatteryInfo>',
        description: 'Initializes the battery manager. Must be called before other methods.',
        returns: 'Promise<BatteryInfo>',
      },
      {
        name: 'getBatteryInfo',
        signature: 'getBatteryInfo(): BatteryInfo',
        description: 'Returns current battery state (level, charging, chargingTime, dischargingTime).',
        returns: 'BatteryInfo',
      },
      {
        name: 'watchBatteryInfo',
        signature: 'watchBatteryInfo(): Observable<BatteryInfo>',
        description: 'Returns an Observable that emits whenever battery state changes.',
        returns: 'Observable<BatteryInfo>',
      },
      {
        name: 'isCharging',
        signature: 'isCharging(): boolean',
        description: 'Returns whether the device is currently charging.',
        returns: 'boolean',
      },
      {
        name: 'getLevel',
        signature: 'getLevel(): number',
        description: 'Returns the battery level as a value between 0.0 and 1.0.',
        returns: 'number (0.0–1.0)',
      },
    ],
    example: `import { BatteryService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [BatteryService] })
export class BatteryComponent {
  private battery = inject(BatteryService);
  info = signal<BatteryInfo | null>(null);

  async ngOnInit() {
    const info = await this.battery.initialize();
    this.info.set(info);

    this.battery.watchBatteryInfo().subscribe(updated => {
      this.info.set(updated);
    });
  }
}`,
  },
  {
    id: 'browser-capability',
    name: 'BrowserCapabilityService',
    description:
      'Detects browser capabilities and feature support. Allows you to check whether specific browser APIs are available before using them.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: ['Use this service to guard API usage before instantiating other services.'],
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(capability: BrowserCapabilityId): boolean',
        description: 'Returns whether the given browser API capability is supported.',
        returns: 'boolean',
      },
      {
        name: 'getUnsupportedCapabilities',
        signature: 'getUnsupportedCapabilities(capabilities: BrowserCapabilityId[]): BrowserCapabilityId[]',
        description: 'Returns the subset of the given capabilities that are NOT supported.',
        returns: 'BrowserCapabilityId[]',
      },
    ],
    example: `import { BrowserCapabilityService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [BrowserCapabilityService] })
export class MyComponent {
  private capability = inject(BrowserCapabilityService);

  ngOnInit() {
    if (this.capability.isSupported('geolocation')) {
      console.log('Geolocation is available');
    }
  }
}`,
  },
  {
    id: 'camera',
    name: 'CameraService',
    description:
      'Manages camera access via the MediaDevices API. Handles permission checks, stream lifecycle, and photo capture with typed constraints.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari ✓ · Edge ✓',
    notes: [
      'Requires camera permission to be granted by the user.',
      'Must be used in a secure context (HTTPS).',
    ],
    methods: [
      {
        name: 'startCamera',
        signature: 'startCamera(constraints?: MediaStreamConstraints): Promise<MediaStream>',
        description: 'Starts camera capture with optional constraints. Returns the active MediaStream.',
        returns: 'Promise<MediaStream>',
      },
      {
        name: 'stopCamera',
        signature: 'stopCamera(): void',
        description: 'Stops all camera tracks and releases the stream.',
        returns: 'void',
      },
      {
        name: 'takePhoto',
        signature: 'takePhoto(videoElement: HTMLVideoElement): Promise<Blob>',
        description: 'Captures a photo from the given video element and returns it as a Blob.',
        returns: 'Promise<Blob>',
      },
      {
        name: 'isActive',
        signature: 'isActive(): boolean',
        description: 'Returns whether there is a currently active camera stream.',
        returns: 'boolean',
      },
    ],
    example: `import { CameraService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [CameraService] })
export class PhotoComponent {
  private camera = inject(CameraService);
  stream = signal<MediaStream | null>(null);

  async start() {
    const mediaStream = await this.camera.startCamera({ video: true });
    this.stream.set(mediaStream);
  }

  stop() {
    this.camera.stopCamera();
    this.stream.set(null);
  }
}`,
  },
  {
    id: 'clipboard',
    name: 'ClipboardService',
    description:
      'Provides a type-safe wrapper around the Clipboard API for reading from and writing to the system clipboard, with automatic permission verification.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari ✓ · Edge ✓',
    notes: [
      'Requires clipboard-read / clipboard-write permissions.',
      'Must be called from a user gesture context.',
    ],
    methods: [
      {
        name: 'writeText',
        signature: 'writeText(text: string): Promise<void>',
        description: 'Writes the given text to the clipboard.',
        returns: 'Promise<void>',
      },
      {
        name: 'readText',
        signature: 'readText(): Promise<string>',
        description: 'Reads text from the clipboard.',
        returns: 'Promise<string>',
      },
    ],
    example: `import { ClipboardService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [ClipboardService] })
export class ClipboardComponent {
  private clipboard = inject(ClipboardService);

  async copy(text: string) {
    await this.clipboard.writeText(text);
  }

  async paste() {
    const text = await this.clipboard.readText();
    console.log('Pasted:', text);
  }
}`,
  },
  {
    id: 'geolocation',
    name: 'GeolocationService',
    description:
      'Wraps the Geolocation API with typed Promises and Observables. Supports one-time position queries and continuous position watching with automatic cleanup.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari ✓ · Edge ✓',
    notes: ['Requires geolocation permission.', 'Use watchPosition() Observable — it auto-unsubscribes via DestroyRef.'],
    methods: [
      {
        name: 'getCurrentPosition',
        signature: 'getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition>',
        description: 'Returns the current device position as a Promise.',
        returns: 'Promise<GeolocationPosition>',
      },
      {
        name: 'watchPosition',
        signature: 'watchPosition(options?: PositionOptions): Observable<GeolocationPosition>',
        description: 'Returns an Observable that continuously emits position updates. Unsubscribe to stop watching.',
        returns: 'Observable<GeolocationPosition>',
      },
      {
        name: 'clearWatch',
        signature: 'clearWatch(watchId: number): void',
        description: 'Clears a position watch by its ID.',
        returns: 'void',
      },
    ],
    example: `import { GeolocationService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [GeolocationService] })
export class MapComponent {
  private geo = inject(GeolocationService);
  position = signal<GeolocationPosition | null>(null);

  async getOnce() {
    const pos = await this.geo.getCurrentPosition({ enableHighAccuracy: true });
    this.position.set(pos);
  }

  startTracking() {
    this.geo.watchPosition().subscribe(pos => this.position.set(pos));
  }
}`,
  },
  {
    id: 'media-devices',
    name: 'MediaDevicesService',
    description:
      'Enumerates and manages media input/output devices (cameras, microphones, speakers). Provides reactive device change detection.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari ✓ · Edge ✓',
    notes: ['Device labels are only available after permission is granted.'],
    methods: [
      {
        name: 'enumerateDevices',
        signature: 'enumerateDevices(): Promise<MediaDeviceInfo[]>',
        description: 'Returns all available media devices.',
        returns: 'Promise<MediaDeviceInfo[]>',
      },
      {
        name: 'getVideoDevices',
        signature: 'getVideoDevices(): Promise<MediaDeviceInfo[]>',
        description: 'Returns only video input devices (cameras).',
        returns: 'Promise<MediaDeviceInfo[]>',
      },
      {
        name: 'getAudioDevices',
        signature: 'getAudioDevices(): Promise<MediaDeviceInfo[]>',
        description: 'Returns only audio input devices (microphones).',
        returns: 'Promise<MediaDeviceInfo[]>',
      },
      {
        name: 'watchDeviceChanges',
        signature: 'watchDeviceChanges(): Observable<MediaDeviceInfo[]>',
        description: 'Returns an Observable that emits whenever devices are connected or disconnected.',
        returns: 'Observable<MediaDeviceInfo[]>',
      },
    ],
    example: `import { MediaDevicesService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [MediaDevicesService] })
export class DeviceSelectorComponent {
  private devices = inject(MediaDevicesService);
  cameras = signal<MediaDeviceInfo[]>([]);

  async ngOnInit() {
    this.cameras.set(await this.devices.getVideoDevices());
  }
}`,
  },
  {
    id: 'notification',
    name: 'NotificationService',
    description:
      'Manages browser push notifications — requesting permissions and displaying notifications with typed options.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari partial · Edge ✓',
    notes: ['Safari has limited support for the Notifications API.', 'User must explicitly grant permission.'],
    methods: [
      {
        name: 'permission',
        signature: 'get permission(): NotificationPermission',
        description: 'Returns the current notification permission state: "default", "granted", or "denied".',
        returns: 'NotificationPermission',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether the Notifications API is available in the current browser.',
        returns: 'boolean',
      },
      {
        name: 'requestNotificationPermission',
        signature: 'requestNotificationPermission(): Promise<NotificationPermission>',
        description: 'Prompts the user for notification permission.',
        returns: 'Promise<NotificationPermission>',
      },
      {
        name: 'showNotification',
        signature: 'showNotification(title: string, options?: NotificationOptions): Promise<Notification>',
        description: 'Displays a browser notification. Permission must be granted first.',
        returns: 'Promise<Notification>',
      },
    ],
    example: `import { NotificationService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [NotificationService] })
export class AlertComponent {
  private notifications = inject(NotificationService);

  async notify() {
    if (this.notifications.permission !== 'granted') {
      await this.notifications.requestNotificationPermission();
    }
    await this.notifications.showNotification('Hello!', {
      body: 'This is a notification from Angular',
    });
  }
}`,
  },
  {
    id: 'permissions',
    name: 'PermissionsService',
    description:
      'Centralizes browser permission queries. Used internally by other services and directly available for custom permission checks.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari partial · Edge ✓',
    notes: ['Some permissions are not queryable in all browsers (e.g. clipboard in Firefox).'],
    methods: [
      {
        name: 'query',
        signature: 'query(descriptor: PermissionDescriptor): Promise<PermissionStatus>',
        description: 'Queries the current state of a given permission.',
        returns: 'Promise<PermissionStatus>',
      },
    ],
    example: `import { PermissionsService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [PermissionsService] })
export class PermissionCheckComponent {
  private permissions = inject(PermissionsService);

  async checkCamera() {
    const status = await this.permissions.query({ name: 'camera' });
    console.log('Camera permission:', status.state);
  }
}`,
  },
  {
    id: 'regex-security',
    name: 'RegexSecurityService',
    description:
      'Executes regular expressions safely in a Web Worker to prevent ReDoS (Regular Expression Denial of Service) attacks. Includes pattern complexity analysis and configurable timeouts.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'All browsers with Web Workers support',
    notes: [
      'Pattern analysis runs synchronously; execution runs in a Web Worker.',
      'Use safeMode: true in production to block high-risk patterns.',
      'Timeout defaults to 5000ms.',
    ],
    methods: [
      {
        name: 'testRegex',
        signature: 'testRegex(pattern: string, text: string, options?: RegexSecurityConfig): Promise<RegexTestResult>',
        description: 'Executes a regex in a Web Worker with timeout protection. Returns match result and execution metadata.',
        returns: 'Promise<RegexTestResult>',
      },
      {
        name: 'analyzePatternSecurity',
        signature: 'analyzePatternSecurity(pattern: string): Promise<RegexSecurityResult>',
        description: 'Analyzes a regex pattern for ReDoS risk without executing it.',
        returns: 'Promise<RegexSecurityResult>',
      },
    ],
    example: `import { RegexSecurityService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [RegexSecurityService] })
export class ValidationComponent {
  private regexSecurity = inject(RegexSecurityService);

  async validateEmail(email: string): Promise<boolean> {
    const result = await this.regexSecurity.testRegex(
      '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      email,
      { timeout: 3000, safeMode: true }
    );
    return result.match;
  }
}`,
  },
  {
    id: 'web-share',
    name: 'WebShareService',
    description:
      'Wraps the Web Share API to trigger the native device share sheet. Supports sharing URLs, text, and files.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox partial · Safari ✓ · Edge ✓ (mobile focused)',
    notes: ['Requires a user gesture to trigger.', 'File sharing support varies by browser.'],
    methods: [
      {
        name: 'share',
        signature: 'share(data: ShareData): Promise<ShareResult>',
        description: 'Opens the native share dialog with the given data.',
        returns: 'Promise<{ shared: boolean; error?: string }>',
      },
      {
        name: 'canShare',
        signature: 'canShare(): boolean',
        description: 'Returns whether the Web Share API is available.',
        returns: 'boolean',
      },
      {
        name: 'canShareFiles',
        signature: 'canShareFiles(): boolean',
        description: 'Returns whether file sharing is supported.',
        returns: 'boolean',
      },
    ],
    example: `import { WebShareService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [WebShareService] })
export class ShareButtonComponent {
  private share = inject(WebShareService);

  async shareLink() {
    if (!this.share.canShare()) return;
    await this.share.share({
      title: 'Angular Helpers',
      text: 'Check out this library!',
      url: 'https://github.com/angular-helpers',
    });
  }
}`,
  },
  {
    id: 'web-socket',
    name: 'WebSocketService',
    description:
      'Manages WebSocket connections with automatic reconnection, heartbeat support, and typed message streams via Observables.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Supports automatic reconnection with configurable retries.',
      'Heartbeat keeps idle connections alive.',
    ],
    methods: [
      {
        name: 'connect',
        signature: 'connect(config: WebSocketConfig): Observable<WebSocketStatus>',
        description: 'Establishes a WebSocket connection. Emits status updates.',
        returns: 'Observable<WebSocketStatus>',
      },
      {
        name: 'send',
        signature: 'send<T>(message: WebSocketMessage<T>): void',
        description: 'Sends a typed message through the active WebSocket.',
        returns: 'void',
      },
      {
        name: 'messages$',
        signature: 'messages$<T>(type?: string): Observable<WebSocketMessage<T>>',
        description: 'Returns an Observable of incoming messages, optionally filtered by type.',
        returns: 'Observable<WebSocketMessage<T>>',
      },
      {
        name: 'disconnect',
        signature: 'disconnect(): void',
        description: 'Closes the WebSocket connection and cancels reconnection.',
        returns: 'void',
      },
    ],
    example: `import { WebSocketService, WebSocketConfig } from '@angular-helpers/browser-web-apis';

@Component({ providers: [WebSocketService] })
export class ChatComponent {
  private ws = inject(WebSocketService);

  connect() {
    const config: WebSocketConfig = {
      url: 'wss://api.example.com/ws',
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
    };
    this.ws.connect(config).subscribe(status => console.log(status));
    this.ws.messages$<string>('chat').subscribe(msg => console.log(msg));
  }
}`,
  },
  {
    id: 'web-storage',
    name: 'WebStorageService',
    description:
      'Type-safe wrapper for localStorage and sessionStorage with JSON serialization, optional key prefixing, and reactive change detection via Observables.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: ['Storage events only fire across tabs, not within the same tab.', 'Values are auto-serialized with JSON.stringify.'],
    methods: [
      {
        name: 'setLocalStorage',
        signature: 'setLocalStorage<T>(key: string, value: T, options?: StorageOptions): boolean',
        description: 'Stores a value in localStorage.',
        returns: 'boolean (success)',
      },
      {
        name: 'getLocalStorage',
        signature: 'getLocalStorage<T>(key: string, defaultValue?: T | null, options?: StorageOptions): T | null',
        description: 'Retrieves a value from localStorage.',
        returns: 'T | null',
      },
      {
        name: 'removeLocalStorage',
        signature: 'removeLocalStorage(key: string, options?: StorageOptions): boolean',
        description: 'Removes a key from localStorage.',
        returns: 'boolean (success)',
      },
      {
        name: 'watchLocalStorage',
        signature: 'watchLocalStorage<T>(key: string, options?: StorageOptions): Observable<T | null>',
        description: 'Watches a localStorage key for changes across tabs.',
        returns: 'Observable<T | null>',
      },
      {
        name: 'setSessionStorage',
        signature: 'setSessionStorage<T>(key: string, value: T, options?: StorageOptions): boolean',
        description: 'Stores a value in sessionStorage.',
        returns: 'boolean (success)',
      },
      {
        name: 'getSessionStorage',
        signature: 'getSessionStorage<T>(key: string, defaultValue?: T | null, options?: StorageOptions): T | null',
        description: 'Retrieves a value from sessionStorage.',
        returns: 'T | null',
      },
    ],
    example: `import { WebStorageService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [WebStorageService] })
export class PreferencesComponent {
  private storage = inject(WebStorageService);

  saveTheme(theme: string) {
    this.storage.setLocalStorage('theme', theme, { prefix: 'app' });
  }

  loadTheme(): string {
    return this.storage.getLocalStorage<string>('theme', 'light', { prefix: 'app' }) ?? 'light';
  }
}`,
  },
  {
    id: 'web-worker',
    name: 'WebWorkerService',
    description:
      'Manages Web Worker lifecycle — creation, typed message passing, status tracking, and cleanup — with an Observable-based API.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Worker scripts must be served from the same origin.',
      'Workers are auto-terminated on component destroy via DestroyRef.',
    ],
    methods: [
      {
        name: 'createWorker',
        signature: 'createWorker(name: string, scriptUrl: string): Observable<WorkerStatus>',
        description: 'Creates and initializes a named Web Worker. Emits status updates.',
        returns: 'Observable<WorkerStatus>',
      },
      {
        name: 'sendMessage',
        signature: 'sendMessage<T>(name: string, task: WorkerTask<T>): void',
        description: 'Sends a typed task message to the named worker.',
        returns: 'void',
      },
      {
        name: 'messages$',
        signature: 'messages$<T>(name: string): Observable<WorkerMessage<T>>',
        description: 'Returns an Observable of messages from the named worker.',
        returns: 'Observable<WorkerMessage<T>>',
      },
      {
        name: 'terminateWorker',
        signature: 'terminateWorker(name: string): void',
        description: 'Terminates a named worker and releases its resources.',
        returns: 'void',
      },
    ],
    example: `import { WebWorkerService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [WebWorkerService] })
export class ProcessingComponent {
  private workerService = inject(WebWorkerService);

  process(data: unknown[]) {
    this.workerService.createWorker('processor', '/assets/workers/processor.js')
      .subscribe(status => console.log('Worker status:', status));

    this.workerService.messages$<unknown[]>('processor')
      .subscribe(msg => console.log('Result:', msg.data));

    this.workerService.sendMessage('processor', {
      id: crypto.randomUUID(),
      type: 'process',
      data,
    });
  }
}`,
  },
];
