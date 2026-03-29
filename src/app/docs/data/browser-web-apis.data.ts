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
  },
  {
    id: 'resize-observer',
    name: 'ResizeObserverService',
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
  },
  {
    id: 'page-visibility',
    name: 'PageVisibilityService',
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
];
