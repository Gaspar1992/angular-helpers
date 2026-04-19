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
    notes: [
      'Call initialize() before any other method.',
      'Battery API is not available in Safari.',
    ],
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
        description:
          'Returns current battery state (level, charging, chargingTime, dischargingTime).',
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
    fnVersion: {
      name: 'injectBattery',
      importPath: '@angular-helpers/browser-web-apis',
      returnType: 'BatteryRef',
      description:
        'Provides reactive battery status via signals. Automatically initializes and watches battery changes with cleanup on destroy.',
      fields: [
        {
          name: 'info',
          type: 'Signal<BatteryInfo | null>',
          description: 'Current battery info (level, charging state, times).',
        },
        {
          name: 'error',
          type: 'Signal<string | null>',
          description: 'Last error from battery API.',
        },
        {
          name: 'isSupported',
          type: 'Signal<boolean>',
          description: 'True when Battery API is available.',
        },
      ],
      example: `import { injectBattery } from '@angular-helpers/browser-web-apis';

@Component({...})
export class BatteryComponent {
  protected battery = injectBattery();

  // In template: {{ battery.info()?.level }}% {{ battery.info()?.charging ? '⚡' : '' }}
}`,
    },
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
        signature:
          'getUnsupportedCapabilities(capabilities: BrowserCapabilityId[]): BrowserCapabilityId[]',
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
        description:
          'Starts camera capture with optional constraints. Returns the active MediaStream.',
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
    fnVersion: {
      name: 'injectClipboard',
      importPath: '@angular-helpers/browser-web-apis',
      returnType: 'ClipboardRef',
      description:
        'Provides reactive clipboard access via signals. Tracks text content, errors, busy state, and API support without manual subscription management.',
      fields: [
        {
          name: 'text',
          type: 'Signal<string | null>',
          description: 'Last text successfully read from clipboard.',
        },
        {
          name: 'error',
          type: 'Signal<string | null>',
          description: 'Last error message from read/write attempt.',
        },
        {
          name: 'busy',
          type: 'Signal<boolean>',
          description: 'True when a read/write operation is in progress.',
        },
        {
          name: 'isSupported',
          type: 'Signal<boolean>',
          description: 'True when Clipboard API is available.',
        },
      ],
      example: `import { injectClipboard } from '@angular-helpers/browser-web-apis';

@Component({...})
export class CopyButtonComponent {
  protected cb = injectClipboard();

  // In template: @if (cb.busy()) { 'Copying...' } @else { 'Copy' }
  async copyValue(value: string) {
    await this.cb.writeText(value);
  }
}`,
    },
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
    notes: [
      'Requires geolocation permission.',
      'Use watchPosition() Observable — it auto-unsubscribes via DestroyRef.',
    ],
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
        description:
          'Returns an Observable that continuously emits position updates. Unsubscribe to stop watching.',
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
    fnVersion: {
      name: 'injectGeolocation',
      importPath: '@angular-helpers/browser-web-apis',
      returnType: 'GeolocationRef',
      description:
        'Provides reactive geolocation via signals. Tracks position, errors, and watch state with automatic cleanup on component destroy.',
      fields: [
        {
          name: 'position',
          type: 'Signal<GeolocationPosition | null>',
          description: 'Current geolocation position or null.',
        },
        {
          name: 'error',
          type: 'Signal<GeolocationPositionError | null>',
          description: 'Last error from geolocation API.',
        },
        {
          name: 'watching',
          type: 'Signal<boolean>',
          description: 'True when actively watching position updates.',
        },
        {
          name: 'isSupported',
          type: 'Signal<boolean>',
          description: 'True when Geolocation API is available.',
        },
      ],
      example: `import { injectGeolocation } from '@angular-helpers/browser-web-apis';

@Component({...})
export class MapComponent {
  protected geo = injectGeolocation({ watch: true });

  // In template: Lat: {{ geo.position()?.coords.latitude }}
}`,
    },
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
        description:
          'Returns an Observable that emits whenever devices are connected or disconnected.',
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
    notes: [
      'Safari has limited support for the Notifications API.',
      'User must explicitly grant permission.',
    ],
    methods: [
      {
        name: 'permission',
        signature: 'get permission(): NotificationPermission',
        description:
          'Returns the current notification permission state: "default", "granted", or "denied".',
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
        signature:
          'showNotification(title: string, options?: NotificationOptions): Promise<Notification>',
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
    notes: [
      'Storage events only fire across tabs, not within the same tab.',
      'Values are auto-serialized with JSON.stringify.',
    ],
    methods: [
      {
        name: 'setLocalStorage',
        signature: 'setLocalStorage<T>(key: string, value: T, options?: StorageOptions): boolean',
        description: 'Stores a value in localStorage.',
        returns: 'boolean (success)',
      },
      {
        name: 'getLocalStorage',
        signature:
          'getLocalStorage<T>(key: string, defaultValue?: T | null, options?: StorageOptions): T | null',
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
        signature:
          'watchLocalStorage<T>(key: string, options?: StorageOptions): Observable<T | null>',
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
        signature:
          'getSessionStorage<T>(key: string, defaultValue?: T | null, options?: StorageOptions): T | null',
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
  // --- Tier 1 services ---
  {
    id: 'intersection-observer',
    name: 'IntersectionObserverService',
    apiName: 'Intersection Observer',
    description:
      'Wraps the IntersectionObserver API with an Observable-based interface. Detects when elements enter or leave the viewport with configurable thresholds and root margins.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Automatically disconnects when the component is destroyed via DestroyRef.',
      'Use observeVisibility() for a simple boolean stream.',
    ],
    methods: [
      {
        name: 'observe',
        signature:
          'observe(element: Element, options?: IntersectionObserverOptions): Observable<IntersectionObserverEntry[]>',
        description: 'Observes an element and emits raw IntersectionObserverEntry arrays.',
        returns: 'Observable<IntersectionObserverEntry[]>',
      },
      {
        name: 'observeVisibility',
        signature:
          'observeVisibility(element: Element, options?: IntersectionObserverOptions): Observable<boolean>',
        description:
          'Observes an element and emits a boolean indicating whether it is intersecting.',
        returns: 'Observable<boolean>',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether IntersectionObserver is available in the current browser.',
        returns: 'boolean',
      },
    ],
    example: `import { IntersectionObserverService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [IntersectionObserverService] })
export class LazyImageComponent {
  private io = inject(IntersectionObserverService);
  private el = inject(ElementRef);
  isVisible = signal(false);

  ngAfterViewInit() {
    this.io.observeVisibility(this.el.nativeElement, { threshold: 0.5 })
      .subscribe(visible => this.isVisible.set(visible));
  }
}`,
    fnVersion: {
      name: 'injectIntersectionObserver',
      importPath: '@angular-helpers/browser-web-apis',
      returnType: 'IntersectionRef',
      description:
        'Observes when an element enters or leaves the viewport. Returns reactive signals updated automatically — no subscriptions, no teardown code needed.',
      fields: [
        {
          name: 'isIntersecting',
          type: 'Signal<boolean>',
          description: 'True while the element intersects the viewport at the given threshold.',
        },
        {
          name: 'isVisible',
          type: 'Signal<boolean>',
          description: 'Alias for isIntersecting — convenient for template bindings.',
        },
      ],
      example: `import { injectIntersectionObserver } from '@angular-helpers/browser-web-apis';

@Component({...})
export class LazyCardComponent {
  private el = inject(ElementRef);
  protected io = injectIntersectionObserver(this.el, { threshold: 0.25 });

  // In template: @if (io.isVisible()) { ... }
}`,
    },
  },
  {
    id: 'resize-observer',
    name: 'ResizeObserverService',
    apiName: 'Resize Observer',
    description:
      'Wraps the ResizeObserver API. Emits element size information whenever the observed element changes dimensions.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: ['Automatically disconnects on component destroy.'],
    methods: [
      {
        name: 'observe',
        signature:
          'observe(element: Element, options?: ResizeObserverOptions): Observable<ResizeObserverEntry[]>',
        description: 'Observes an element and emits raw ResizeObserverEntry arrays.',
        returns: 'Observable<ResizeObserverEntry[]>',
      },
      {
        name: 'observeSize',
        signature:
          'observeSize(element: Element, options?: ResizeObserverOptions): Observable<ElementSize>',
        description:
          'Observes an element and emits a typed ElementSize (width, height, inlineSize, blockSize).',
        returns: 'Observable<ElementSize>',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether ResizeObserver is available in the current browser.',
        returns: 'boolean',
      },
    ],
    example: `import { ResizeObserverService, type ElementSize } from '@angular-helpers/browser-web-apis';

@Component({ providers: [ResizeObserverService] })
export class ResponsiveComponent {
  private ro = inject(ResizeObserverService);
  private el = inject(ElementRef);
  size = signal<ElementSize | null>(null);

  ngAfterViewInit() {
    this.ro.observeSize(this.el.nativeElement)
      .subscribe(s => this.size.set(s));
  }
}`,
    fnVersion: {
      name: 'injectResizeObserver',
      importPath: '@angular-helpers/browser-web-apis',
      returnType: 'ResizeRef',
      description:
        "Reactively tracks an element's dimensions. Returns signals for width, height, and box sizes that update on every resize — no subscriptions or cleanup needed.",
      fields: [
        {
          name: 'width',
          type: 'Signal<number>',
          description: 'Content-box width in pixels.',
        },
        {
          name: 'height',
          type: 'Signal<number>',
          description: 'Content-box height in pixels.',
        },
        {
          name: 'inlineSize',
          type: 'Signal<number>',
          description: 'Border-box inline size (logical width).',
        },
        {
          name: 'blockSize',
          type: 'Signal<number>',
          description: 'Border-box block size (logical height).',
        },
        {
          name: 'size',
          type: 'Signal<ElementSize | null>',
          description: 'Full size snapshot; null before first observation.',
        },
      ],
      example: `import { injectResizeObserver } from '@angular-helpers/browser-web-apis';

@Component({...})
export class ResponsiveComponent {
  private el = inject(ElementRef);
  protected ro = injectResizeObserver(this.el);

  // In template: {{ ro.width() }}px × {{ ro.height() }}px
}`,
    },
  },
  {
    id: 'page-visibility',
    name: 'PageVisibilityService',
    apiName: 'Page Visibility',
    description:
      'Tracks document visibility state using the Page Visibility API. Useful for pausing background tasks when the tab is hidden.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Automatically cleans up the event listener on component destroy.',
      'Use watchVisibility() for a simple boolean stream.',
    ],
    methods: [
      {
        name: 'watch',
        signature: 'watch(): Observable<VisibilityState>',
        description: "Emits the document's visibility state ('visible' | 'hidden') on each change.",
        returns: "Observable<'visible' | 'hidden' | 'prerender'>",
      },
      {
        name: 'watchVisibility',
        signature: 'watchVisibility(): Observable<boolean>',
        description: 'Emits true when the page is visible, false when hidden.',
        returns: 'Observable<boolean>',
      },
      {
        name: 'visibilityState',
        signature: 'get visibilityState(): VisibilityState',
        description: 'Returns the current visibility state synchronously.',
        returns: 'VisibilityState',
      },
      {
        name: 'isHidden',
        signature: 'get isHidden(): boolean',
        description: 'Returns true when the document is currently hidden.',
        returns: 'boolean',
      },
    ],
    example: `import { PageVisibilityService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [PageVisibilityService] })
export class VideoComponent {
  private visibility = inject(PageVisibilityService);

  ngOnInit() {
    this.visibility.watch().subscribe(state => {
      if (state === 'hidden') this.pauseVideo();
      else this.resumeVideo();
    });
  }
}`,
    fnVersion: {
      name: 'injectPageVisibility',
      importPath: '@angular-helpers/browser-web-apis',
      returnType: 'PageVisibilityRef',
      description:
        'Tracks document visibility as reactive signals. Initialises immediately from document.visibilityState and updates whenever the user switches tabs.',
      fields: [
        {
          name: 'state',
          type: "Signal<'visible' | 'hidden' | 'prerender'>",
          description: 'Current visibility state of the document.',
        },
        {
          name: 'isVisible',
          type: 'Signal<boolean>',
          description: 'True while the tab is in the foreground.',
        },
        {
          name: 'isHidden',
          type: 'Signal<boolean>',
          description: 'True while the tab is in the background.',
        },
      ],
      example: `import { injectPageVisibility } from '@angular-helpers/browser-web-apis';

@Component({...})
export class VideoComponent {
  protected vis = injectPageVisibility();

  // In template: @if (vis.isHidden()) { pause video }
  // Or drive an effect:
  constructor() {
    effect(() => {
      if (this.vis.isHidden()) this.pauseVideo();
      else this.resumeVideo();
    });
  }
}`,
    },
  },
  {
    id: 'broadcast-channel',
    name: 'BroadcastChannelService',
    description:
      'Provides Observable-based inter-tab and inter-context communication via the BroadcastChannel API. Channels are auto-closed on component destroy.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari ✓ · Edge ✓',
    notes: [
      'Channels are closed automatically when the service is destroyed.',
      'Messages sent to a channel are not received by the sender itself.',
    ],
    methods: [
      {
        name: 'open',
        signature: 'open<T>(name: string): Observable<T>',
        description:
          'Opens (or reuses) a named channel and returns an Observable of incoming messages.',
        returns: 'Observable<T>',
      },
      {
        name: 'post',
        signature: 'post<T>(name: string, data: T): void',
        description: 'Posts a message to all other contexts listening on the named channel.',
        returns: 'void',
      },
      {
        name: 'close',
        signature: 'close(name: string): void',
        description: 'Closes and removes a named channel.',
        returns: 'void',
      },
      {
        name: 'closeAll',
        signature: 'closeAll(): void',
        description: 'Closes all open channels.',
        returns: 'void',
      },
    ],
    example: `import { BroadcastChannelService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [BroadcastChannelService] })
export class SyncComponent {
  private bc = inject(BroadcastChannelService);

  ngOnInit() {
    this.bc.open<string>('app-sync').subscribe(msg => {
      console.log('Cross-tab message:', msg);
    });
  }

  broadcast(value: string) {
    this.bc.post('app-sync', value);
  }
}`,
  },
  {
    id: 'network-information',
    name: 'NetworkInformationService',
    apiName: 'Network Information',
    description:
      'Provides access to the Network Information API. Reports online status, connection type, effective type, downlink speed, and round-trip time.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'Chrome ✓ · Firefox partial · Safari ✗ · Edge ✓',
    notes: [
      'Connection type details (type, effectiveType, rtt) are only available in Chrome/Edge.',
      'navigator.onLine is universally available; extended info is optional.',
    ],
    methods: [
      {
        name: 'getSnapshot',
        signature: 'getSnapshot(): NetworkInformation',
        description: 'Returns the current network state synchronously.',
        returns: 'NetworkInformation',
      },
      {
        name: 'watch',
        signature: 'watch(): Observable<NetworkInformation>',
        description:
          'Returns an Observable that emits whenever online status or connection info changes.',
        returns: 'Observable<NetworkInformation>',
      },
      {
        name: 'isOnline',
        signature: 'get isOnline(): boolean',
        description: 'Returns the current online status.',
        returns: 'boolean',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether extended Network Information API (connection) is available.',
        returns: 'boolean',
      },
    ],
    example: `import { NetworkInformationService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [NetworkInformationService] })
export class OfflineBannerComponent {
  private network = inject(NetworkInformationService);
  isOnline = signal(true);

  ngOnInit() {
    this.network.watch().subscribe(info => {
      this.isOnline.set(info.online);
    });
  }
}`,
    fnVersion: {
      name: 'injectNetworkInformation',
      importPath: '@angular-helpers/browser-web-apis',
      returnType: 'NetworkInformationRef',
      description:
        'Provides network state as reactive signals. Updates automatically on online/offline events and connection changes without any subscription management.',
      fields: [
        {
          name: 'online',
          type: 'Signal<boolean>',
          description: 'True when the browser has network connectivity.',
        },
        {
          name: 'effectiveType',
          type: "Signal<'slow-2g' | '2g' | '3g' | '4g' | undefined>",
          description: 'Estimated connection quality (Chromium-only).',
        },
        {
          name: 'downlink',
          type: 'Signal<number | undefined>',
          description: 'Estimated downlink bandwidth in Mbps.',
        },
        {
          name: 'rtt',
          type: 'Signal<number | undefined>',
          description: 'Estimated round-trip time in milliseconds.',
        },
        {
          name: 'snapshot',
          type: 'Signal<NetworkInformation>',
          description: 'Full network state snapshot signal.',
        },
      ],
      example: `import { injectNetworkInformation } from '@angular-helpers/browser-web-apis';

@Component({...})
export class OfflineBannerComponent {
  protected net = injectNetworkInformation();

  // In template: @if (!net.online()) { <offline-banner /> }
}`,
    },
  },
  {
    id: 'screen-wake-lock',
    name: 'ScreenWakeLockService',
    description:
      'Prevents the device screen from dimming or locking via the Screen Wake Lock API. Automatically re-acquires the lock when the tab becomes visible again.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✗ · Safari ✓ (16.4+) · Edge ✓',
    notes: [
      'Requires a secure context (HTTPS).',
      'The lock is released automatically when the tab is hidden and re-acquired on visibility.',
      'Call release() when the lock is no longer needed.',
    ],
    methods: [
      {
        name: 'request',
        signature: "request(type?: 'screen'): Promise<WakeLockStatus>",
        description:
          'Acquires a screen wake lock. Throws if unsupported or not in a secure context.',
        returns: 'Promise<WakeLockStatus>',
      },
      {
        name: 'release',
        signature: 'release(): Promise<void>',
        description: 'Releases the active wake lock.',
        returns: 'Promise<void>',
      },
      {
        name: 'watchStatus',
        signature: 'watchStatus(): Observable<WakeLockStatus>',
        description: 'Emits the current wake lock status whenever it changes.',
        returns: 'Observable<WakeLockStatus>',
      },
      {
        name: 'isActive',
        signature: 'get isActive(): boolean',
        description: 'Returns whether the wake lock is currently active.',
        returns: 'boolean',
      },
    ],
    example: `import { ScreenWakeLockService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [ScreenWakeLockService] })
export class PresentationComponent {
  private wakeLock = inject(ScreenWakeLockService);

  async keepScreenOn() {
    try {
      await this.wakeLock.request();
    } catch (e) {
      console.warn('Wake lock not available:', e);
    }
  }

  async releaseScreen() {
    await this.wakeLock.release();
  }
}`,
  },
  {
    id: 'screen-orientation',
    name: 'ScreenOrientationService',
    apiName: 'Screen Orientation',
    description:
      'Reads and watches the screen orientation type and angle. Supports programmatic orientation locking for mobile applications.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari partial · Edge ✓',
    notes: [
      'Orientation locking (lock()) requires fullscreen and is not supported in all browsers.',
      'getSnapshot() always returns a safe default on unsupported browsers.',
    ],
    methods: [
      {
        name: 'getSnapshot',
        signature: 'getSnapshot(): OrientationInfo',
        description: 'Returns the current orientation type and angle synchronously.',
        returns: 'OrientationInfo',
      },
      {
        name: 'watch',
        signature: 'watch(): Observable<OrientationInfo>',
        description: 'Emits the current orientation whenever it changes.',
        returns: 'Observable<OrientationInfo>',
      },
      {
        name: 'lock',
        signature: 'lock(orientation: OrientationLockType): Promise<void>',
        description: 'Locks the screen to the given orientation.',
        returns: 'Promise<void>',
      },
      {
        name: 'unlock',
        signature: 'unlock(): void',
        description: 'Releases any previously set orientation lock.',
        returns: 'void',
      },
      {
        name: 'isPortrait',
        signature: 'get isPortrait(): boolean',
        description: 'Returns whether the current orientation is portrait.',
        returns: 'boolean',
      },
    ],
    example: `import { ScreenOrientationService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [ScreenOrientationService] })
export class MobileComponent {
  private orientation = inject(ScreenOrientationService);
  currentOrientation = signal<string>('portrait-primary');

  ngOnInit() {
    this.orientation.watch().subscribe(info => {
      this.currentOrientation.set(info.type);
    });
  }

  async lockLandscape() {
    await this.orientation.lock('landscape');
  }
}`,
    fnVersion: {
      name: 'injectScreenOrientation',
      importPath: '@angular-helpers/browser-web-apis',
      returnType: 'ScreenOrientationRef',
      description:
        'Exposes screen orientation as reactive signals. Includes lock/unlock methods for programmatic orientation control on mobile devices.',
      fields: [
        {
          name: 'type',
          type: "Signal<'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary'>",
          description: 'Current orientation type.',
        },
        {
          name: 'angle',
          type: 'Signal<number>',
          description: 'Current rotation angle in degrees.',
        },
        {
          name: 'isPortrait',
          type: 'Signal<boolean>',
          description: 'True when the device is in portrait orientation.',
        },
        {
          name: 'isLandscape',
          type: 'Signal<boolean>',
          description: 'True when the device is in landscape orientation.',
        },
        {
          name: 'lock(orientation)',
          type: 'Promise<void>',
          description: 'Locks the screen to the given orientation type.',
        },
        {
          name: 'unlock()',
          type: 'void',
          description: 'Releases any previously set orientation lock.',
        },
      ],
      example: `import { injectScreenOrientation } from '@angular-helpers/browser-web-apis';

@Component({...})
export class MobileComponent {
  protected orient = injectScreenOrientation();

  // In template: {{ orient.type() }} — {{ orient.angle() }}°

  async lockLandscape() {
    await this.orient.lock('landscape');
  }
}`,
    },
  },
  {
    id: 'fullscreen',
    name: 'FullscreenService',
    description:
      'Manages fullscreen mode for any DOM element. Supports entering, exiting, and toggling fullscreen with webkit prefix fallback.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Fullscreen requests must be triggered by a user gesture.',
      'Includes webkit prefix support for Safari.',
    ],
    methods: [
      {
        name: 'request',
        signature: 'request(element?: Element): Promise<void>',
        description:
          'Enters fullscreen for the given element (defaults to document.documentElement).',
        returns: 'Promise<void>',
      },
      {
        name: 'exit',
        signature: 'exit(): Promise<void>',
        description: 'Exits fullscreen mode.',
        returns: 'Promise<void>',
      },
      {
        name: 'toggle',
        signature: 'toggle(element?: Element): Promise<void>',
        description: 'Toggles fullscreen mode.',
        returns: 'Promise<void>',
      },
      {
        name: 'watch',
        signature: 'watch(): Observable<boolean>',
        description: 'Emits true when entering fullscreen and false when exiting.',
        returns: 'Observable<boolean>',
      },
      {
        name: 'isFullscreen',
        signature: 'get isFullscreen(): boolean',
        description: 'Returns whether the document is currently in fullscreen mode.',
        returns: 'boolean',
      },
    ],
    example: `import { FullscreenService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [FullscreenService] })
export class VideoPlayerComponent {
  private fullscreen = inject(FullscreenService);
  private el = inject(ElementRef);
  isFullscreen = signal(false);

  ngOnInit() {
    this.fullscreen.watch().subscribe(state => this.isFullscreen.set(state));
  }

  async toggleFullscreen() {
    await this.fullscreen.toggle(this.el.nativeElement);
  }
}`,
  },
  {
    id: 'file-system-access',
    name: 'FileSystemAccessService',
    description:
      'Provides access to the File System Access API for opening and saving files via the native OS picker. Supports single/multiple file selection, save dialogs, and directory access.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✗ · Safari ✗ · Edge ✓',
    notes: [
      'Only available in Chromium-based browsers.',
      'Requires a secure context (HTTPS).',
      'Returns empty array / null when the user cancels (AbortError).',
    ],
    methods: [
      {
        name: 'openFile',
        signature: 'openFile(options?: FileOpenOptions): Promise<File[]>',
        description:
          'Opens the native file picker. Returns selected File objects (empty array on cancel).',
        returns: 'Promise<File[]>',
      },
      {
        name: 'saveFile',
        signature: 'saveFile(content: string | Blob, options?: FileSaveOptions): Promise<void>',
        description: 'Opens the save dialog and writes content to the chosen file.',
        returns: 'Promise<void>',
      },
      {
        name: 'openDirectory',
        signature: 'openDirectory(options?): Promise<FileSystemDirectoryHandle | null>',
        description: 'Opens a directory picker and returns the handle (null on cancel).',
        returns: 'Promise<FileSystemDirectoryHandle | null>',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether the File System Access API is supported and secure.',
        returns: 'boolean',
      },
    ],
    example: `import { FileSystemAccessService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [FileSystemAccessService] })
export class FileEditorComponent {
  private fs = inject(FileSystemAccessService);
  content = signal('');

  async openFile() {
    const files = await this.fs.openFile({
      types: [{ description: 'Text', accept: { 'text/plain': ['.txt'] } }],
    });
    if (files.length) {
      this.content.set(await files[0].text());
    }
  }

  async saveFile() {
    await this.fs.saveFile(this.content(), { suggestedName: 'document.txt' });
  }
}`,
  },
  {
    id: 'media-recorder',
    name: 'MediaRecorderService',
    description:
      'Wraps the MediaRecorder API for recording audio and video from a MediaStream. Provides start, pause, resume, and stop controls with Observable state and data streams.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari ✓ (14.1+) · Edge ✓',
    notes: [
      'Requires a MediaStream from getUserMedia or screen capture.',
      'Call stop() to get the final RecordingResult with the Blob URL.',
    ],
    methods: [
      {
        name: 'start',
        signature: 'start(stream: MediaStream, options?: RecordingOptions): Promise<void>',
        description: 'Starts recording the given stream.',
        returns: 'Promise<void>',
      },
      {
        name: 'stop',
        signature: 'stop(): RecordingResult | null',
        description:
          'Stops recording and returns the result with blob, URL, mimeType and duration.',
        returns: 'RecordingResult | null',
      },
      {
        name: 'pause',
        signature: 'pause(): void',
        description: 'Pauses an active recording.',
        returns: 'void',
      },
      {
        name: 'resume',
        signature: 'resume(): void',
        description: 'Resumes a paused recording.',
        returns: 'void',
      },
      {
        name: 'watchState',
        signature: 'watchState(): Observable<RecordingState>',
        description: "Emits recording state changes ('recording' | 'paused' | 'inactive').",
        returns: "Observable<'recording' | 'paused' | 'inactive'>",
      },
    ],
    example: `import { MediaRecorderService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [MediaRecorderService] })
export class RecorderComponent {
  private recorder = inject(MediaRecorderService);
  private stream: MediaStream | null = null;
  state = signal<string>('inactive');

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.recorder.watchState().subscribe(s => this.state.set(s));
    await this.recorder.start(this.stream, { mimeType: 'audio/webm' });
  }

  stop() {
    const result = this.recorder.stop();
    if (result) console.log('Recorded:', result.url);
  }
}`,
  },
  {
    id: 'server-sent-events',
    name: 'ServerSentEventsService',
    description:
      'Manages Server-Sent Events (SSE) connections. Supports typed message streams, custom event types, and multiple concurrent connections identified by URL.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'EventSource connections are automatically closed on component destroy.',
      'Use disconnect(url) to close a specific connection manually.',
    ],
    methods: [
      {
        name: 'connect',
        signature: 'connect<T>(url: string, config?: SSEConfig): Observable<SSEMessage<T>>',
        description:
          'Opens an SSE connection to the given URL and returns an Observable of typed messages.',
        returns: 'Observable<SSEMessage<T>>',
      },
      {
        name: 'disconnect',
        signature: 'disconnect(url: string): void',
        description: 'Closes the SSE connection for the given URL.',
        returns: 'void',
      },
      {
        name: 'getState',
        signature: 'getState(url: string): SSEConnectionState',
        description: "Returns the connection state ('connecting' | 'open' | 'closed').",
        returns: 'SSEConnectionState',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether EventSource is available in the current browser.',
        returns: 'boolean',
      },
    ],
    example: `import { ServerSentEventsService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [ServerSentEventsService] })
export class LiveFeedComponent {
  private sse = inject(ServerSentEventsService);
  messages = signal<string[]>([]);

  connect() {
    this.sse.connect<string>('https://api.example.com/events')
      .subscribe(msg => {
        this.messages.update(list => [...list, String(msg.data)]);
      });
  }

  disconnect() {
    this.sse.disconnect('https://api.example.com/events');
  }
}`,
  },
  {
    id: 'vibration',
    name: 'VibrationService',
    description:
      'Triggers haptic feedback patterns via the Vibration API. Includes built-in presets for common interactions (success, error, notification, double-tap).',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari ✗ · Edge ✓ (mobile-focused)',
    notes: [
      'Safari does not support the Vibration API.',
      'Most browsers require the device to have a vibration motor.',
      'isSupported() returns false on desktop browsers.',
    ],
    methods: [
      {
        name: 'vibrate',
        signature: 'vibrate(pattern?: VibrationPattern): boolean',
        description:
          'Triggers a vibration with the given pattern (ms durations). Returns false if unsupported.',
        returns: 'boolean',
      },
      {
        name: 'success',
        signature: 'success(): boolean',
        description: 'Triggers the preset success haptic pattern.',
        returns: 'boolean',
      },
      {
        name: 'error',
        signature: 'error(): boolean',
        description: 'Triggers the preset error haptic pattern.',
        returns: 'boolean',
      },
      {
        name: 'notification',
        signature: 'notification(): boolean',
        description: 'Triggers the preset notification haptic pattern.',
        returns: 'boolean',
      },
      {
        name: 'stop',
        signature: 'stop(): boolean',
        description: 'Stops any active vibration.',
        returns: 'boolean',
      },
    ],
    example: `import { VibrationService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [VibrationService] })
export class FeedbackComponent {
  private vibration = inject(VibrationService);

  onActionSuccess() {
    this.vibration.success();
  }

  onActionError() {
    this.vibration.error();
  }

  onCustomPattern() {
    this.vibration.vibrate([100, 50, 100, 50, 200]);
  }
}`,
  },
  {
    id: 'speech-synthesis',
    name: 'SpeechSynthesisService',
    description:
      'Text-to-speech via the Web Speech Synthesis API. Supports voice selection, language, pitch, rate, and volume. Exposes speaking state as an Observable.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari ✓ · Edge ✓',
    notes: [
      'Available voices vary by OS and browser.',
      'Voices may load asynchronously — use watchVoices() to react when they are ready.',
    ],
    methods: [
      {
        name: 'speak',
        signature: 'speak(text: string, options?: SpeechOptions): Observable<SpeechState>',
        description: "Speaks the given text. Emits 'speaking', 'paused', and 'idle' state changes.",
        returns: 'Observable<SpeechState>',
      },
      {
        name: 'getVoices',
        signature: 'getVoices(): SpeechSynthesisVoice[]',
        description: 'Returns the currently available voices synchronously.',
        returns: 'SpeechSynthesisVoice[]',
      },
      {
        name: 'watchVoices',
        signature: 'watchVoices(): Observable<SpeechSynthesisVoice[]>',
        description: 'Emits the voice list whenever it changes.',
        returns: 'Observable<SpeechSynthesisVoice[]>',
      },
      {
        name: 'pause',
        signature: 'pause(): void',
        description: 'Pauses speech synthesis.',
        returns: 'void',
      },
      {
        name: 'resume',
        signature: 'resume(): void',
        description: 'Resumes paused speech synthesis.',
        returns: 'void',
      },
      {
        name: 'cancel',
        signature: 'cancel(): void',
        description: 'Cancels all pending and active speech.',
        returns: 'void',
      },
    ],
    example: `import { SpeechSynthesisService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [SpeechSynthesisService] })
export class VoiceComponent {
  private speech = inject(SpeechSynthesisService);
  speakingState = signal<string>('idle');

  speak(text: string) {
    this.speech.speak(text, { lang: 'en-US', rate: 1, pitch: 1 })
      .subscribe(state => this.speakingState.set(state));
  }

  stop() {
    this.speech.cancel();
  }
}`,
  },
  // --- Tier 2 services ---
  {
    id: 'mutation-observer',
    name: 'MutationObserverService',
    apiName: 'Mutation Observer',
    description:
      'Wraps the MutationObserver API with an Observable-based interface. Detects DOM mutations such as child additions, attribute changes, and text content modifications.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Automatically disconnects when the subscription is closed.',
      'Use with subtree: true to observe deep DOM changes.',
    ],
    methods: [
      {
        name: 'observe',
        signature:
          'observe(target: Node, options?: MutationObserverOptions): Observable<MutationRecord[]>',
        description: 'Observes a DOM node and emits arrays of MutationRecord on each mutation.',
        returns: 'Observable<MutationRecord[]>',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether MutationObserver is available in the current browser.',
        returns: 'boolean',
      },
    ],
    example: `import { MutationObserverService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [MutationObserverService] })
export class DomWatcherComponent {
  private mo = inject(MutationObserverService);
  private el = inject(ElementRef);

  ngAfterViewInit() {
    this.mo.observe(this.el.nativeElement, { childList: true, subtree: true })
      .subscribe(mutations => console.log('DOM changed:', mutations));
  }
}`,
    fnVersion: {
      name: 'injectMutationObserver',
      importPath: '@angular-helpers/browser-web-apis',
      returnType: 'MutationRef',
      description:
        'Reactively tracks DOM mutations on an element. Returns signals updated automatically on each mutation batch — no subscriptions or teardown needed.',
      fields: [
        {
          name: 'mutations',
          type: 'Signal<MutationRecord[]>',
          description: 'The latest batch of MutationRecords.',
        },
        {
          name: 'mutationCount',
          type: 'Signal<number>',
          description: 'Number of records in the latest mutation batch.',
        },
      ],
      example: `import { injectMutationObserver } from '@angular-helpers/browser-web-apis';

@Component({...})
export class DomWatcherComponent {
  private el = inject(ElementRef);
  protected mo = injectMutationObserver(this.el, { childList: true });

  // In template: {{ mo.mutationCount() }} mutations detected
}`,
    },
  },
  {
    id: 'performance-observer',
    name: 'PerformanceObserverService',
    apiName: 'Performance Observer',
    description:
      'Wraps the PerformanceObserver API for monitoring performance entries such as LCP, FID, CLS, navigation timing, and resource loading metrics.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'Use buffered: true to receive entries logged before the observer was created.',
      'Entry types vary by browser — use getSupportedEntryTypes() to check.',
    ],
    methods: [
      {
        name: 'observe',
        signature: 'observe(config: PerformanceObserverConfig): Observable<PerformanceEntryList>',
        description: 'Observes performance entries matching the config and emits batches.',
        returns: 'Observable<PerformanceEntryList>',
      },
      {
        name: 'observeByType',
        signature:
          'observeByType(type: PerformanceEntryType, buffered?: boolean): Observable<PerformanceEntryList>',
        description: 'Convenience method to observe a single entry type.',
        returns: 'Observable<PerformanceEntryList>',
      },
      {
        name: 'getSupportedEntryTypes',
        signature: 'getSupportedEntryTypes(): PerformanceEntryType[]',
        description: 'Returns the list of supported performance entry types.',
        returns: 'PerformanceEntryType[]',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether PerformanceObserver is available.',
        returns: 'boolean',
      },
    ],
    example: `import { PerformanceObserverService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [PerformanceObserverService] })
export class MetricsComponent {
  private perf = inject(PerformanceObserverService);

  ngOnInit() {
    this.perf.observeByType('largest-contentful-paint')
      .subscribe(entries => console.log('LCP:', entries));
  }
}`,
    fnVersion: {
      name: 'injectPerformanceObserver',
      importPath: '@angular-helpers/browser-web-apis',
      returnType: 'PerformanceObserverRef',
      description:
        'Tracks performance entries as reactive signals. Automatically updates when new entries are observed.',
      fields: [
        {
          name: 'entries',
          type: 'Signal<PerformanceEntryList>',
          description: 'The latest batch of performance entries.',
        },
        {
          name: 'entryCount',
          type: 'Signal<number>',
          description: 'Number of entries in the latest batch.',
        },
        {
          name: 'latestEntry',
          type: 'Signal<PerformanceEntry | undefined>',
          description: 'The most recent performance entry.',
        },
      ],
      example: `import { injectPerformanceObserver } from '@angular-helpers/browser-web-apis';

@Component({...})
export class MetricsComponent {
  protected perf = injectPerformanceObserver({ type: 'navigation', buffered: true });

  // In template: {{ perf.entryCount() }} entries observed
}`,
    },
  },
  {
    id: 'idle-detector',
    name: 'IdleDetectorService',
    apiName: 'Idle Detection',
    description:
      'Detects user idle state and screen lock status using the Idle Detection API. Useful for auto-logout, presence indicators, or pausing resource-intensive tasks.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✗ · Safari ✗ · Edge ✓',
    notes: [
      'Requires "idle-detection" permission — call requestPermission() first.',
      'Default idle threshold is 60 seconds.',
      'Chrome-only as of 2024.',
    ],
    methods: [
      {
        name: 'watch',
        signature: 'watch(options?: IdleDetectorOptions): Observable<IdleState>',
        description: 'Starts monitoring idle state. Emits user and screen state changes.',
        returns: 'Observable<IdleState>',
      },
      {
        name: 'requestPermission',
        signature: 'requestPermission(): Promise<PermissionState>',
        description: 'Requests the idle-detection permission.',
        returns: 'Promise<PermissionState>',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether the Idle Detection API is available.',
        returns: 'boolean',
      },
    ],
    example: `import { IdleDetectorService } from '@angular-helpers/browser-web-apis/experimental';

@Component({ providers: [IdleDetectorService] })
export class PresenceComponent {
  private idle = inject(IdleDetectorService);

  async start() {
    await this.idle.requestPermission();
    this.idle.watch({ threshold: 120_000 }).subscribe(state => {
      console.log('User:', state.user, 'Screen:', state.screen);
    });
  }
}`,
    fnVersion: {
      name: 'injectIdleDetector',
      importPath: '@angular-helpers/browser-web-apis/experimental',
      returnType: 'IdleDetectorRef',
      description:
        'Exposes user idle and screen lock state as reactive signals. Automatically starts monitoring and cleans up on destroy.',
      fields: [
        {
          name: 'userState',
          type: "Signal<'active' | 'idle'>",
          description: 'Current user activity state.',
        },
        {
          name: 'screenState',
          type: "Signal<'locked' | 'unlocked'>",
          description: 'Current screen lock state.',
        },
        {
          name: 'isUserIdle',
          type: 'Signal<boolean>',
          description: 'True when the user is idle.',
        },
        {
          name: 'isScreenLocked',
          type: 'Signal<boolean>',
          description: 'True when the screen is locked.',
        },
      ],
      example: `import { injectIdleDetector } from '@angular-helpers/browser-web-apis/experimental';

@Component({...})
export class PresenceComponent {
  protected idle = injectIdleDetector({ threshold: 120_000 });

  // In template: @if (idle.isUserIdle()) { <idle-indicator /> }
}`,
    },
  },
  {
    id: 'eye-dropper',
    name: 'EyeDropperService',
    apiName: 'EyeDropper',
    description:
      'Provides access to the EyeDropper API for picking colors from anywhere on the screen. Opens a system color picker that returns the selected color in sRGB hex format.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis/experimental',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✗ · Safari ✗ · Edge ✓',
    notes: ['Must be triggered by a user gesture.', 'Only available in Chromium-based browsers.'],
    methods: [
      {
        name: 'open',
        signature: 'open(signal?: AbortSignal): Promise<ColorSelectionResult>',
        description: 'Opens the eyedropper tool. Returns the selected color as { sRGBHex }.',
        returns: 'Promise<ColorSelectionResult>',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether the EyeDropper API is available.',
        returns: 'boolean',
      },
    ],
    example: `import { EyeDropperService } from '@angular-helpers/browser-web-apis/experimental';

@Component({ providers: [EyeDropperService] })
export class ColorPickerComponent {
  private eyeDropper = inject(EyeDropperService);
  selectedColor = signal('');

  async pickColor() {
    if (!this.eyeDropper.isSupported()) return;
    const result = await this.eyeDropper.open();
    this.selectedColor.set(result.sRGBHex);
  }
}`,
  },
  {
    id: 'barcode-detector',
    name: 'BarcodeDetectorService',
    apiName: 'Barcode Detection',
    description:
      'Wraps the Barcode Detection API (Shape Detection API) for scanning barcodes and QR codes from images, video frames, or canvas elements.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis/experimental',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✗ · Safari ✗ · Edge ✓',
    notes: [
      'Only available in Chromium-based browsers.',
      'Supports multiple barcode formats: QR, EAN, UPC, Code 128, etc.',
      'Use getSupportedFormats() to check availability.',
    ],
    methods: [
      {
        name: 'detect',
        signature:
          'detect(image: ImageBitmapSource, formats?: BarcodeFormat[]): Promise<DetectedBarcode[]>',
        description: 'Detects barcodes in the given image source.',
        returns: 'Promise<DetectedBarcode[]>',
      },
      {
        name: 'getSupportedFormats',
        signature: 'getSupportedFormats(): Promise<BarcodeFormat[]>',
        description: 'Returns the barcode formats supported by the browser.',
        returns: 'Promise<BarcodeFormat[]>',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether the BarcodeDetector API is available.',
        returns: 'boolean',
      },
    ],
    example: `import { BarcodeDetectorService } from '@angular-helpers/browser-web-apis/experimental';

@Component({ providers: [BarcodeDetectorService] })
export class ScannerComponent {
  private barcode = inject(BarcodeDetectorService);

  async scanFromVideo(video: HTMLVideoElement) {
    if (!this.barcode.isSupported()) return;
    const results = await this.barcode.detect(video, ['qr_code']);
    results.forEach(r => console.log('Found:', r.rawValue));
  }
}`,
  },
  {
    id: 'web-audio',
    name: 'WebAudioService',
    apiName: 'Web Audio',
    description:
      'Manages Web Audio API contexts, nodes, and audio processing. Supports oscillators, gain control, analysers for visualization, audio decoding, and playback.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    notes: [
      'AudioContext is created lazily on first getContext() call.',
      'Context is auto-closed on component destroy.',
      'Call resume() after a user gesture if the context starts suspended.',
    ],
    methods: [
      {
        name: 'getContext',
        signature: 'getContext(): AudioContext',
        description: 'Returns the AudioContext, creating it if needed.',
        returns: 'AudioContext',
      },
      {
        name: 'resume',
        signature: 'resume(): Promise<void>',
        description: 'Resumes a suspended AudioContext (required after user gesture).',
        returns: 'Promise<void>',
      },
      {
        name: 'close',
        signature: 'close(): Promise<void>',
        description: 'Closes the AudioContext and releases resources.',
        returns: 'Promise<void>',
      },
      {
        name: 'createOscillator',
        signature: 'createOscillator(type?: OscillatorType, frequency?: number): OscillatorNode',
        description: 'Creates an oscillator node with the given type and frequency.',
        returns: 'OscillatorNode',
      },
      {
        name: 'createAnalyser',
        signature: 'createAnalyser(fftSize?: number): AnalyserNode',
        description: 'Creates an analyser node for audio visualization.',
        returns: 'AnalyserNode',
      },
      {
        name: 'watchAnalyser',
        signature:
          'watchAnalyser(analyser: AnalyserNode, intervalMs?: number): Observable<AudioAnalyserData>',
        description: 'Emits frequency and time-domain data from an analyser at the given interval.',
        returns: 'Observable<AudioAnalyserData>',
      },
      {
        name: 'decodeAudioData',
        signature: 'decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer>',
        description: 'Decodes audio data from an ArrayBuffer.',
        returns: 'Promise<AudioBuffer>',
      },
      {
        name: 'playBuffer',
        signature: 'playBuffer(buffer: AudioBuffer, loop?: boolean): AudioBufferSourceNode',
        description: 'Plays an AudioBuffer through the default output.',
        returns: 'AudioBufferSourceNode',
      },
    ],
    example: `import { WebAudioService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [WebAudioService] })
export class ToneComponent {
  private audio = inject(WebAudioService);

  async playTone() {
    await this.audio.resume();
    const osc = this.audio.createOscillator('sine', 440);
    const gain = this.audio.createGain(0.5);
    osc.connect(gain).connect(this.audio.getContext().destination);
    osc.start();
    setTimeout(() => osc.stop(), 500);
  }
}`,
  },
  {
    id: 'gamepad',
    name: 'GamepadService',
    apiName: 'Gamepad',
    description:
      'Provides access to the Gamepad API for reading game controller input. Supports connection events, polling for button/axis state, and listing connected gamepads.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari ✓ · Edge ✓',
    notes: [
      'Gamepad data requires active polling — the browser does not push updates.',
      'Use poll() with requestAnimationFrame timing (16ms) for real-time input.',
      'A user gesture (button press) is required before gamepads are reported.',
    ],
    methods: [
      {
        name: 'poll',
        signature: 'poll(index: number, intervalMs?: number): Observable<GamepadState>',
        description: 'Polls a gamepad at the given interval and emits its state.',
        returns: 'Observable<GamepadState>',
      },
      {
        name: 'watchConnections',
        signature:
          "watchConnections(): Observable<{ gamepad: GamepadState; type: 'connected' | 'disconnected' }>",
        description: 'Emits events when gamepads are connected or disconnected.',
        returns: 'Observable<{ gamepad: GamepadState; type: string }>',
      },
      {
        name: 'getConnectedGamepads',
        signature: 'getConnectedGamepads(): GamepadState[]',
        description: 'Returns a snapshot of all currently connected gamepads.',
        returns: 'GamepadState[]',
      },
      {
        name: 'getSnapshot',
        signature: 'getSnapshot(index: number): GamepadState | null',
        description: 'Returns the current state of a gamepad by index.',
        returns: 'GamepadState | null',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether the Gamepad API is available.',
        returns: 'boolean',
      },
    ],
    example: `import { GamepadService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [GamepadService] })
export class GameInputComponent {
  private gamepad = inject(GamepadService);

  startPolling() {
    this.gamepad.poll(0).subscribe(state => {
      console.log('Buttons:', state.buttons);
      console.log('Axes:', state.axes);
    });
  }
}`,
    fnVersion: {
      name: 'injectGamepad',
      importPath: '@angular-helpers/browser-web-apis',
      returnType: 'GamepadRef',
      description:
        'Polls a gamepad and exposes its state as reactive signals. Automatically starts polling and cleans up on destroy.',
      fields: [
        {
          name: 'state',
          type: 'Signal<GamepadState | null>',
          description: 'Full gamepad state snapshot; null if not connected.',
        },
        {
          name: 'connected',
          type: 'Signal<boolean>',
          description: 'True when the gamepad is connected.',
        },
        {
          name: 'buttons',
          type: 'Signal<ReadonlyArray<{ pressed: boolean; value: number }>>',
          description: 'Current button states.',
        },
        {
          name: 'axes',
          type: 'Signal<readonly number[]>',
          description: 'Current axis values (-1 to 1).',
        },
      ],
      example: `import { injectGamepad } from '@angular-helpers/browser-web-apis';

@Component({...})
export class GameInputComponent {
  protected gp = injectGamepad(0);

  // In template: @if (gp.connected()) { Axes: {{ gp.axes() }} }
}`,
    },
  },
  {
    id: 'web-bluetooth',
    name: 'WebBluetoothService',
    apiName: 'Web Bluetooth',
    description:
      'Provides access to the Web Bluetooth API for connecting to Bluetooth Low Energy (BLE) devices. Supports device discovery, GATT service/characteristic read/write, and notifications.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis/experimental',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✗ · Safari ✗ · Edge ✓',
    notes: [
      'Only available in Chromium-based browsers.',
      'Requires HTTPS and a user gesture to trigger device discovery.',
      'Use requestDevice() to initiate Bluetooth pairing.',
    ],
    methods: [
      {
        name: 'requestDevice',
        signature:
          'requestDevice(options?: BluetoothRequestDeviceOptions): Promise<BluetoothDeviceRef>',
        description: 'Opens the Bluetooth device picker dialog.',
        returns: 'Promise<BluetoothDeviceRef>',
      },
      {
        name: 'connect',
        signature: 'connect(device: BluetoothDeviceRef): Promise<BluetoothRemoteGATTServer>',
        description: 'Connects to the GATT server on the given device.',
        returns: 'Promise<BluetoothRemoteGATTServer>',
      },
      {
        name: 'disconnect',
        signature: 'disconnect(device: BluetoothDeviceRef): void',
        description: 'Disconnects from the device GATT server.',
        returns: 'void',
      },
      {
        name: 'readCharacteristic',
        signature: 'readCharacteristic(server, serviceUuid, characteristicUuid): Promise<DataView>',
        description: 'Reads a value from a BLE characteristic.',
        returns: 'Promise<DataView>',
      },
      {
        name: 'writeCharacteristic',
        signature:
          'writeCharacteristic(server, serviceUuid, characteristicUuid, value): Promise<void>',
        description: 'Writes a value to a BLE characteristic.',
        returns: 'Promise<void>',
      },
      {
        name: 'watchCharacteristic',
        signature:
          'watchCharacteristic(server, serviceUuid, characteristicUuid): Observable<DataView>',
        description: 'Subscribes to value notifications from a BLE characteristic.',
        returns: 'Observable<DataView>',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether the Web Bluetooth API is available.',
        returns: 'boolean',
      },
    ],
    example: `import { WebBluetoothService } from '@angular-helpers/browser-web-apis/experimental';

@Component({ providers: [WebBluetoothService] })
export class BleComponent {
  private bt = inject(WebBluetoothService);

  async connectToDevice() {
    const device = await this.bt.requestDevice({
      filters: [{ services: ['heart_rate'] }],
    });
    const server = await this.bt.connect(device);
    const value = await this.bt.readCharacteristic(
      server, 'heart_rate', 'heart_rate_measurement'
    );
    console.log('Heart rate:', new Uint8Array(value.buffer));
  }
}`,
  },
  {
    id: 'web-usb',
    name: 'WebUsbService',
    apiName: 'WebUSB',
    description:
      'Provides access to the WebUSB API for communicating with USB devices from the browser. Supports device discovery, configuration, interface claiming, and data transfer.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis/experimental',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✗ · Safari ✗ · Edge ✓',
    notes: [
      'Only available in Chromium-based browsers.',
      'Requires HTTPS and a user gesture.',
      'Device must not be claimed by a kernel driver.',
    ],
    methods: [
      {
        name: 'requestDevice',
        signature: 'requestDevice(filters?: UsbDeviceFilterDef[]): Promise<UsbDeviceRef>',
        description: 'Opens the USB device picker dialog.',
        returns: 'Promise<UsbDeviceRef>',
      },
      {
        name: 'getDevices',
        signature: 'getDevices(): Promise<UsbDeviceRef[]>',
        description: 'Returns previously authorized USB devices.',
        returns: 'Promise<UsbDeviceRef[]>',
      },
      {
        name: 'open',
        signature: 'open(device: UsbDeviceRef): Promise<void>',
        description: 'Opens a USB device for communication.',
        returns: 'Promise<void>',
      },
      {
        name: 'close',
        signature: 'close(device: UsbDeviceRef): Promise<void>',
        description: 'Closes a USB device.',
        returns: 'Promise<void>',
      },
      {
        name: 'transferIn',
        signature:
          'transferIn(device: UsbDeviceRef, endpointNumber: number, length: number): Promise<UsbTransferResult>',
        description: 'Reads data from a USB endpoint.',
        returns: 'Promise<UsbTransferResult>',
      },
      {
        name: 'transferOut',
        signature:
          'transferOut(device: UsbDeviceRef, endpointNumber: number, data: BufferSource): Promise<UsbTransferResult>',
        description: 'Writes data to a USB endpoint.',
        returns: 'Promise<UsbTransferResult>',
      },
      {
        name: 'watchConnection',
        signature:
          "watchConnection(): Observable<{ device: UsbDeviceRef; type: 'connect' | 'disconnect' }>",
        description: 'Emits events when USB devices are connected or disconnected.',
        returns: 'Observable<{ device: UsbDeviceRef; type: string }>',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether the WebUSB API is available.',
        returns: 'boolean',
      },
    ],
    example: `import { WebUsbService } from '@angular-helpers/browser-web-apis/experimental';

@Component({ providers: [WebUsbService] })
export class UsbComponent {
  private usb = inject(WebUsbService);

  async connectDevice() {
    const device = await this.usb.requestDevice([{ vendorId: 0x1234 }]);
    await this.usb.open(device);
    console.log('Connected to:', device.productName);
  }
}`,
  },
  {
    id: 'web-nfc',
    name: 'WebNfcService',
    apiName: 'Web NFC',
    description:
      'Provides access to the Web NFC API for reading and writing NFC tags. Supports NDEF message scanning and writing.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis/experimental',
    requiresSecureContext: true,
    browserSupport: 'Chrome Android ✓ · Firefox ✗ · Safari ✗ · Edge ✗',
    notes: [
      'Only available on Android Chrome.',
      'Requires HTTPS.',
      'Physical NFC hardware is required.',
    ],
    methods: [
      {
        name: 'scan',
        signature: 'scan(): Observable<NdefReadingEvent>',
        description: 'Starts scanning for NFC tags and emits NDEF reading events.',
        returns: 'Observable<NdefReadingEvent>',
      },
      {
        name: 'write',
        signature:
          'write(message: NdefMessage | string, options?: NdefWriteOptions): Promise<void>',
        description: 'Writes an NDEF message to an NFC tag.',
        returns: 'Promise<void>',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether the Web NFC API is available.',
        returns: 'boolean',
      },
    ],
    example: `import { WebNfcService } from '@angular-helpers/browser-web-apis/experimental';

@Component({ providers: [WebNfcService] })
export class NfcComponent {
  private nfc = inject(WebNfcService);

  startScanning() {
    this.nfc.scan().subscribe(event => {
      console.log('Tag:', event.serialNumber);
      console.log('Message:', event.message);
    });
  }

  async writeTag(text: string) {
    await this.nfc.write(text);
  }
}`,
  },
  {
    id: 'payment-request',
    name: 'PaymentRequestService',
    apiName: 'Payment Request',
    description:
      'Wraps the Payment Request API for initiating native payment flows. Supports payment method validation, payment sheet display, and result handling.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis/experimental',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari ✓ · Edge ✓',
    notes: [
      'Requires HTTPS.',
      'Use canMakePayment() to check if the user has a valid payment method.',
      'show() must be called from a user gesture.',
    ],
    methods: [
      {
        name: 'canMakePayment',
        signature:
          'canMakePayment(methods: PaymentMethodConfig[], details: PaymentDetailsInit): Promise<boolean>',
        description: 'Checks whether the user can make a payment with the given methods.',
        returns: 'Promise<boolean>',
      },
      {
        name: 'show',
        signature:
          'show(methods: PaymentMethodConfig[], details: PaymentDetailsInit, options?: PaymentOptionsConfig): Promise<PaymentResult>',
        description: 'Shows the payment sheet and returns the result on completion.',
        returns: 'Promise<PaymentResult>',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether the Payment Request API is available.',
        returns: 'boolean',
      },
    ],
    example: `import { PaymentRequestService } from '@angular-helpers/browser-web-apis/experimental';

@Component({ providers: [PaymentRequestService] })
export class CheckoutComponent {
  private payment = inject(PaymentRequestService);

  async pay() {
    const methods = [{ supportedMethods: 'https://google.com/pay' }];
    const details = {
      total: { label: 'Total', amount: { currency: 'USD', value: '9.99' } },
    };
    const result = await this.payment.show(methods, details);
    console.log('Payment:', result.methodName);
  }
}`,
  },
  {
    id: 'credential-management',
    name: 'CredentialManagementService',
    apiName: 'Credential Management',
    description:
      'Wraps the Credential Management API for managing user credentials. Supports password credentials, public key credentials (WebAuthn/passkeys), and silent sign-in prevention.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis/experimental',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari partial · Edge ✓',
    notes: [
      'Requires HTTPS.',
      'PublicKeyCredential (WebAuthn) support varies by browser.',
      'Use isConditionalMediationAvailable() to check passkey autofill support.',
    ],
    methods: [
      {
        name: 'get',
        signature: 'get(options?: CredentialRequestOptions): Promise<Credential | null>',
        description: 'Retrieves a stored credential matching the given options.',
        returns: 'Promise<Credential | null>',
      },
      {
        name: 'store',
        signature: 'store(credential: Credential): Promise<void>',
        description: 'Stores a credential in the browser credential store.',
        returns: 'Promise<void>',
      },
      {
        name: 'createPasswordCredential',
        signature: 'createPasswordCredential(data: PasswordCredentialData): Promise<Credential>',
        description: 'Creates a password credential for storage.',
        returns: 'Promise<Credential>',
      },
      {
        name: 'createPublicKeyCredential',
        signature:
          'createPublicKeyCredential(options: PublicKeyCredentialOptions): Promise<Credential | null>',
        description: 'Creates a public key credential (WebAuthn registration).',
        returns: 'Promise<Credential | null>',
      },
      {
        name: 'preventSilentAccess',
        signature: 'preventSilentAccess(): Promise<void>',
        description: 'Prevents automatic sign-in on next visit.',
        returns: 'Promise<void>',
      },
      {
        name: 'isConditionalMediationAvailable',
        signature: 'isConditionalMediationAvailable(): Promise<boolean>',
        description: 'Checks if passkey autofill (conditional mediation) is supported.',
        returns: 'Promise<boolean>',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether the Credential Management API is available.',
        returns: 'boolean',
      },
    ],
    example: `import { CredentialManagementService } from '@angular-helpers/browser-web-apis/experimental';

@Component({ providers: [CredentialManagementService] })
export class LoginComponent {
  private credentials = inject(CredentialManagementService);

  async autoLogin() {
    const cred = await this.credentials.get({ password: true, mediation: 'optional' });
    if (cred) console.log('Auto-signed in as:', cred.id);
  }

  async saveCredentials(id: string, password: string) {
    const cred = await this.credentials.createPasswordCredential({ id, password });
    await this.credentials.store(cred);
  }
}`,
  },
  // --- New Web Platform Services (v21.11) ---
  {
    id: 'web-locks',
    name: 'WebLocksService',
    apiName: 'Web Locks',
    description:
      'Coordinates exclusive or shared access to a named resource across tabs and workers using the Web Locks API. Useful for preventing concurrent operations on shared resources.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari ✓ · Edge ✓',
    notes: [
      'Locks are automatically released when the callback completes or rejects.',
      'Use query() for diagnostics only — do not gate critical logic on it.',
    ],
    methods: [
      {
        name: 'acquire',
        signature:
          'acquire<T>(name: string, callback: () => Promise<T> | T, options?: LockOptions): Promise<T>',
        description:
          'Acquires a lock and runs the callback while holding it. Lock is released automatically when callback completes.',
        returns: 'Promise<T>',
      },
      {
        name: 'query',
        signature: 'query(): Promise<LockManagerSnapshot>',
        description: 'Queries current lock state (held and pending locks). Diagnostic use only.',
        returns: 'Promise<{ held: LockInfo[], pending: LockInfo[] }>',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether the Web Locks API is available.',
        returns: 'boolean',
      },
    ],
    example: `import { WebLocksService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [WebLocksService] })
export class SyncComponent {
  private locks = inject(WebLocksService);

  async syncUserData() {
    // Only one tab can execute this at a time
    await this.locks.acquire('user-cache', async () => {
      await this.performSync();
    });
  }
}`,
  },
  {
    id: 'storage-manager',
    name: 'StorageManagerService',
    apiName: 'Storage Manager',
    description:
      'Provides access to the Storage Manager API for checking storage quotas and requesting persistent storage that is protected from automatic eviction.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari ✓ · Edge ✓',
    notes: [
      'Storage quota estimates are best-effort and may vary between browsers.',
      'Persistent storage requires user permission in some browsers.',
    ],
    methods: [
      {
        name: 'estimate',
        signature: 'estimate(): Promise<StorageQuotaEstimate>',
        description: 'Returns storage usage and quota information for the current origin.',
        returns: 'Promise<{ usage: number, quota: number, usageDetails?: Record<string, number> }>',
      },
      {
        name: 'persist',
        signature: 'persist(): Promise<boolean>',
        description: 'Requests that storage be made persistent (eviction-protected).',
        returns: 'Promise<boolean>',
      },
      {
        name: 'persisted',
        signature: 'persisted(): Promise<boolean>',
        description: 'Checks whether storage is currently persistent.',
        returns: 'Promise<boolean>',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether the Storage Manager API is available.',
        returns: 'boolean',
      },
    ],
    example: `import { StorageManagerService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [StorageManagerService] })
export class StorageComponent {
  private storage = inject(StorageManagerService);

  async checkStorage() {
    const estimate = await this.storage.estimate();
    console.log('Using', estimate.usage, 'of', estimate.quota, 'bytes');
  }

  async requestPersistence() {
    const persisted = await this.storage.persist();
    if (persisted) console.log('Storage is now persistent');
  }
}`,
  },
  {
    id: 'compression',
    name: 'CompressionService',
    apiName: 'Compression Streams',
    description:
      'Wraps the Compression Streams API for gzip/deflate compression and decompression of Uint8Array data. Useful for reducing transfer sizes or storing compressed data locally.',
    scope: 'provided',
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: false,
    browserSupport: 'Chrome ✓ · Firefox ✓ · Safari ✗ · Edge ✓',
    notes: [
      'Safari does not support Compression Streams API as of 2024.',
      'Always use try/catch when compressing/decompressing.',
    ],
    methods: [
      {
        name: 'compress',
        signature:
          'compress(data: Uint8Array | ArrayBuffer, format?: CompressionFormat): Promise<Uint8Array>',
        description: 'Compresses data using the specified format (default: gzip).',
        returns: 'Promise<Uint8Array>',
      },
      {
        name: 'decompress',
        signature:
          'decompress(data: Uint8Array | ArrayBuffer, format?: CompressionFormat): Promise<Uint8Array>',
        description: 'Decompresses data using the specified format (default: gzip).',
        returns: 'Promise<Uint8Array>',
      },
      {
        name: 'compressString',
        signature: 'compressString(value: string, format?: CompressionFormat): Promise<Uint8Array>',
        description: 'Convenience method to compress a UTF-8 string.',
        returns: 'Promise<Uint8Array>',
      },
      {
        name: 'decompressString',
        signature:
          'decompressString(data: Uint8Array | ArrayBuffer, format?: CompressionFormat): Promise<string>',
        description: 'Convenience method to decompress into a UTF-8 string.',
        returns: 'Promise<string>',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns whether the Compression Streams API is available.',
        returns: 'boolean',
      },
    ],
    example: `import { CompressionService } from '@angular-helpers/browser-web-apis';

@Component({ providers: [CompressionService] })
export class CompressionComponent {
  private compression = inject(CompressionService);

  async compressJson(data: unknown): Promise<Uint8Array> {
    const json = JSON.stringify(data);
    return await this.compression.compressString(json, 'gzip');
  }

  async decompressToJson(compressed: Uint8Array): Promise<unknown> {
    const json = await this.compression.decompressString(compressed, 'gzip');
    return JSON.parse(json);
  }
}`,
  },
];
