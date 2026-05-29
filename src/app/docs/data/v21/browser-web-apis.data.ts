import { ServiceDoc } from '../../models/doc-meta.model';

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
    category: 'storage-io',
    methods: [
      {
        name: 'initialize',
        signature: 'initialize(): Promise<BatteryInfo>',
        description: 'Public method initialize.',
        returns: 'Promise<BatteryInfo>',
      },
      {
        name: 'getBatteryInfo',
        signature: 'getBatteryInfo(): BatteryInfo',
        description: 'Public method getBatteryInfo.',
        returns: 'BatteryInfo',
      },
      {
        name: 'watchBatteryInfo',
        signature: 'watchBatteryInfo(): Observable<BatteryInfo>',
        description: 'Public method watchBatteryInfo.',
        returns: 'Observable<BatteryInfo>',
      },
      {
        name: 'getNativeBatteryManager',
        signature: 'getNativeBatteryManager(): BatteryManager',
        description: 'Public method getNativeBatteryManager.',
        returns: 'BatteryManager',
      },
      {
        name: 'isCharging',
        signature: 'isCharging(): boolean',
        description: 'Public method isCharging.',
        returns: 'boolean',
      },
      {
        name: 'getLevel',
        signature: 'getLevel(): number',
        description: 'Public method getLevel.',
        returns: 'number',
      },
      {
        name: 'getChargingTime',
        signature: 'getChargingTime(): number',
        description: 'Public method getChargingTime.',
        returns: 'number',
      },
      {
        name: 'getDischargingTime',
        signature: 'getDischargingTime(): number',
        description: 'Public method getDischargingTime.',
        returns: 'number',
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
    category: 'security',
    methods: [
      {
        name: 'getCapabilities',
        signature: 'getCapabilities(): void',
        description: 'Public method getCapabilities.',
        returns: 'void',
      },
      {
        name: 'isSecureContext',
        signature: 'isSecureContext(): boolean',
        description: 'Public method isSecureContext.',
        returns: 'boolean',
      },
      {
        name: 'isSupported',
        signature: 'isSupported(capability: BrowserCapabilityId): boolean',
        description: 'Public method isSupported.',
        returns: 'boolean',
      },
      {
        name: 'getAllStatuses',
        signature: 'getAllStatuses(): void',
        description: 'Public method getAllStatuses.',
        returns: 'void',
      },
      {
        name: 'getPermissionState',
        signature:
          "getPermissionState(permission: PermissionName): Promise<PermissionState | 'unknown'>",
        description: 'Public method getPermissionState.',
        returns: "Promise<PermissionState | 'unknown'>",
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
    category: 'media-device',
    methods: [
      {
        name: 'startCamera',
        signature: 'startCamera(constraints?: MediaStreamConstraints): Promise<MediaStream>',
        description: 'Public method startCamera.',
        returns: 'Promise<MediaStream>',
      },
      {
        name: 'stopCamera',
        signature: 'stopCamera(): void',
        description: 'Public method stopCamera.',
        returns: 'void',
      },
      {
        name: 'switchCamera',
        signature:
          'switchCamera(deviceId: string, constraints: MediaStreamConstraints): Promise<MediaStream>',
        description: 'Public method switchCamera.',
        returns: 'Promise<MediaStream>',
      },
      {
        name: 'getCameraCapabilities',
        signature:
          'getCameraCapabilities(deviceId: string): Promise<MediaTrackCapabilities | null>',
        description: 'Public method getCameraCapabilities.',
        returns: 'Promise<MediaTrackCapabilities | null>',
      },
      {
        name: 'getCurrentStream',
        signature: 'getCurrentStream(): MediaStream | null',
        description: 'Public method getCurrentStream.',
        returns: 'MediaStream | null',
      },
      {
        name: 'isStreaming',
        signature: 'isStreaming(): boolean',
        description: 'Public method isStreaming.',
        returns: 'boolean',
      },
      {
        name: 'getVideoInputDevices',
        signature: 'getVideoInputDevices(): Promise<MediaDeviceInfo[]>',
        description: 'Public method getVideoInputDevices.',
        returns: 'Promise<MediaDeviceInfo[]>',
      },
      {
        name: 'getNativeMediaDevices',
        signature: 'getNativeMediaDevices(): MediaDevices',
        description: 'Public method getNativeMediaDevices.',
        returns: 'MediaDevices',
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
    guides: [
      {
        title: 'Reactive Hardware Streams & Context Cleanup',
        description:
          'This guide details how to build a robust photo capture interface with reactive camera permission checks, dynamic constraint adjustments, and automatic MediaStream resource cleanup when the host component is destroyed.',
        files: [
          {
            name: 'avatar-capture.component.ts',
            language: 'ts',
            content: `import { Component, inject, signal, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CameraService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-avatar-capture',
  standalone: true,
  templateUrl: './avatar-capture.component.html'
})
export class AvatarCaptureComponent implements OnInit, OnDestroy {
  private readonly cameraService = inject(CameraService);

  @ViewChild('videoEl') videoElement!: ElementRef<HTMLVideoElement>;

  protected readonly stream = signal<MediaStream | null>(null);
  protected readonly capturedImage = signal<string | null>(null);

  async enableCamera() {
    try {
      const mediaStream = await this.cameraService.startCamera({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      this.stream.set(mediaStream);

      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Failed to access camera hardware:', err);
    }
  }

  disableCamera() {
    this.cameraService.stopCamera();
    this.stream.set(null);
    if (this.videoElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }

  async capture() {
    if (!this.stream() || !this.videoElement) return;

    try {
      const photoBlob = await this.cameraService.takePhoto(this.videoElement.nativeElement);
      const url = URL.createObjectURL(photoBlob);
      this.capturedImage.set(url);
      
      this.disableCamera();
    } catch (err) {
      console.error('Failed to capture frame:', err);
    }
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.disableCamera();
    if (this.capturedImage()) {
      URL.revokeObjectURL(this.capturedImage()!);
    }
  }
}`,
          },
          {
            name: 'avatar-capture.component.html',
            language: 'html',
            content: `<div class="flex flex-col items-center gap-6 p-8 bg-base-200/50 backdrop-blur-md rounded-3xl border border-border-subtle shadow-sm max-w-[600px]">
  <h3 class="text-xl font-bold">Profile Photo Capture</h3>

  <div class="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-border">
    <video #videoEl autoplay playsinline class="w-full h-full object-cover" [class.hidden]="!stream()"></video>
    
    @if (!stream()) {
      <div class="absolute inset-0 flex flex-col items-center justify-center text-base-content/40 gap-2">
        <span class="text-3xl">📷</span>
        <p>Camera is currently off</p>
      </div>
    }
  </div>

  <div class="flex gap-4 w-full">
    @if (!stream()) {
      <button class="btn btn-primary flex-1" (click)="enableCamera()">Start Camera</button>
    } @else {
      <button class="btn btn-warning flex-1" (click)="disableCamera()">Stop Camera</button>
      <button class="btn btn-success flex-1" (click)="capture()">Capture Photo</button>
    }
  </div>

  @if (capturedImage(); as img) {
    <div class="mt-4 flex flex-col items-center gap-2">
      <h4 class="font-bold text-sm">Preview:</h4>
      <img [src]="img" class="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-lg" />
    </div>
  }
</div>`,
          },
        ],
      },
    ],
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
    category: 'storage-io',
    methods: [
      {
        name: 'writeText',
        signature: 'writeText(text: string): Promise<void>',
        description: 'Public method writeText.',
        returns: 'Promise<void>',
      },
      {
        name: 'readText',
        signature: 'readText(): Promise<string>',
        description: 'Public method readText.',
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
    category: 'media-device',
    methods: [
      {
        name: 'getCurrentPosition',
        signature: 'getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition>',
        description: 'Public method getCurrentPosition.',
        returns: 'Promise<GeolocationPosition>',
      },
      {
        name: 'watchPosition',
        signature: 'watchPosition(options?: PositionOptions): Observable<GeolocationPosition>',
        description: 'Public method watchPosition.',
        returns: 'Observable<GeolocationPosition>',
      },
      {
        name: 'clearWatch',
        signature: 'clearWatch(watchId: number): void',
        description: 'Public method clearWatch.',
        returns: 'void',
      },
      {
        name: 'getNativeGeolocation',
        signature: 'getNativeGeolocation(): Geolocation',
        description: 'Public method getNativeGeolocation.',
        returns: 'Geolocation',
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
    category: 'media-device',
    methods: [
      {
        name: 'getDevices',
        signature: 'getDevices(): Promise<MediaDeviceInfo[]>',
        description: 'Public method getDevices.',
        returns: 'Promise<MediaDeviceInfo[]>',
      },
      {
        name: 'getUserMedia',
        signature: 'getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>',
        description: 'Public method getUserMedia.',
        returns: 'Promise<MediaStream>',
      },
      {
        name: 'getDisplayMedia',
        signature: 'getDisplayMedia(constraints?: DisplayMediaConstraints): Promise<MediaStream>',
        description: 'Public method getDisplayMedia.',
        returns: 'Promise<MediaStream>',
      },
      {
        name: 'watchDeviceChanges',
        signature: 'watchDeviceChanges(): Observable<MediaDeviceInfo[]>',
        description: 'Public method watchDeviceChanges.',
        returns: 'Observable<MediaDeviceInfo[]>',
      },
      {
        name: 'getVideoInputDevices',
        signature: 'getVideoInputDevices(): Promise<MediaDeviceInfo[]>',
        description: 'Public method getVideoInputDevices.',
        returns: 'Promise<MediaDeviceInfo[]>',
      },
      {
        name: 'getAudioInputDevices',
        signature: 'getAudioInputDevices(): Promise<MediaDeviceInfo[]>',
        description: 'Public method getAudioInputDevices.',
        returns: 'Promise<MediaDeviceInfo[]>',
      },
      {
        name: 'getAudioOutputDevices',
        signature: 'getAudioOutputDevices(): Promise<MediaDeviceInfo[]>',
        description: 'Public method getAudioOutputDevices.',
        returns: 'Promise<MediaDeviceInfo[]>',
      },
      {
        name: 'getNativeMediaDevices',
        signature: 'getNativeMediaDevices(): MediaDevices',
        description: 'Public method getNativeMediaDevices.',
        returns: 'MediaDevices',
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
    category: 'system',
    methods: [
      {
        name: 'requestNotificationPermission',
        signature: 'requestNotificationPermission(): Promise<NotificationPermission>',
        description: 'Public method requestNotificationPermission.',
        returns: 'Promise<NotificationPermission>',
      },
      {
        name: 'showNotification',
        signature:
          'showNotification(title: string, options?: NotificationOptions): Promise<Notification>',
        description: 'Public method showNotification.',
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
    category: 'security',
    methods: [
      {
        name: 'query',
        signature: 'query(descriptor: PermissionDescriptor): Promise<PermissionStatus>',
        description: 'Public method query.',
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
    category: 'system',
    methods: [
      {
        name: 'share',
        signature: 'share(data: ShareData): Promise<ShareResult>',
        description: 'Public method share.',
        returns: 'Promise<ShareResult>',
      },
      {
        name: 'canShare',
        signature: 'canShare(): boolean',
        description: 'Public method canShare.',
        returns: 'boolean',
      },
      {
        name: 'canShareFiles',
        signature: 'canShareFiles(): boolean',
        description: 'Public method canShareFiles.',
        returns: 'boolean',
      },
      {
        name: 'getNativeShare',
        signature: 'getNativeShare(): typeof navigator.share',
        description: 'Public method getNativeShare.',
        returns: 'typeof navigator.share',
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
    category: 'network',
    methods: [
      {
        name: 'createClient',
        signature: 'createClient(config: WebSocketClientConfig): WebSocketClient',
        description: `Create a new WebSocket client. The client owns one connection and is the recommended
surface for all interactions (status signal, request/response, reconnect, etc.).

The returned client is automatically disposed when the host injector is destroyed.`,
        returns: 'WebSocketClient',
      },
      {
        name: 'disposeAll',
        signature: 'disposeAll(): void',
        description: `Dispose every client created via \`createClient()\` (also called automatically on destroy).`,
        returns: 'void',
      },
      {
        name: 'connect',
        signature: 'connect(config: WebSocketConfig): Observable<WebSocketStatus>',
        description: 'Public method connect.',
        returns: 'Observable<WebSocketStatus>',
      },
      {
        name: 'disconnect',
        signature: 'disconnect(): void',
        description: 'Public method disconnect.',
        returns: 'void',
      },
      {
        name: 'send',
        signature: 'send(message: WebSocketMessage<T>): void',
        description: 'Public method send.',
        returns: 'void',
      },
      {
        name: 'sendRaw',
        signature: 'sendRaw(data: string): void',
        description: 'Public method sendRaw.',
        returns: 'void',
      },
      {
        name: 'getStatus',
        signature: 'getStatus(): Observable<WebSocketStatus>',
        description: 'Public method getStatus.',
        returns: 'Observable<WebSocketStatus>',
      },
      {
        name: 'getMessages',
        signature: 'getMessages(): Observable<WebSocketMessage<T>>',
        description: 'Public method getMessages.',
        returns: 'Observable<WebSocketMessage<T>>',
      },
      {
        name: 'getMessagesByType',
        signature: 'getMessagesByType(type: string): Observable<WebSocketMessage<T>>',
        description: 'Public method getMessagesByType.',
        returns: 'Observable<WebSocketMessage<T>>',
      },
      {
        name: 'getNativeWebSocket',
        signature: 'getNativeWebSocket(): WebSocket | null',
        description: 'Public method getNativeWebSocket.',
        returns: 'WebSocket | null',
      },
      {
        name: 'isConnected',
        signature: 'isConnected(): boolean',
        description: 'Public method isConnected.',
        returns: 'boolean',
      },
      {
        name: 'getReadyState',
        signature: 'getReadyState(): number',
        description: 'Public method getReadyState.',
        returns: 'number',
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
    category: 'storage-io',
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Returns true if either local or session storage is usable.',
        returns: 'boolean',
      },
      {
        name: 'getStorageEvents',
        signature: 'getStorageEvents(): Observable<StorageEvent>',
        description: 'Stream of every storage mutation observed in this tab or other tabs.',
        returns: 'Observable<StorageEvent>',
      },
      {
        name: 'setLocalStorage',
        signature: 'setLocalStorage(key: string, value: T, options: StorageOptions): boolean',
        description: 'Public method setLocalStorage.',
        returns: 'boolean',
      },
      {
        name: 'getLocalStorage',
        signature:
          'getLocalStorage(key: string, defaultValue: T | null, options: StorageOptions): T | null',
        description: 'Public method getLocalStorage.',
        returns: 'T | null',
      },
      {
        name: 'removeLocalStorage',
        signature: 'removeLocalStorage(key: string, options: StorageOptions): boolean',
        description: 'Public method removeLocalStorage.',
        returns: 'boolean',
      },
      {
        name: 'clearLocalStorage',
        signature: 'clearLocalStorage(options: StorageOptions): boolean',
        description: 'Public method clearLocalStorage.',
        returns: 'boolean',
      },
      {
        name: 'setSessionStorage',
        signature: 'setSessionStorage(key: string, value: T, options: StorageOptions): boolean',
        description: 'Public method setSessionStorage.',
        returns: 'boolean',
      },
      {
        name: 'getSessionStorage',
        signature:
          'getSessionStorage(key: string, defaultValue: T | null, options: StorageOptions): T | null',
        description: 'Public method getSessionStorage.',
        returns: 'T | null',
      },
      {
        name: 'removeSessionStorage',
        signature: 'removeSessionStorage(key: string, options: StorageOptions): boolean',
        description: 'Public method removeSessionStorage.',
        returns: 'boolean',
      },
      {
        name: 'clearSessionStorage',
        signature: 'clearSessionStorage(options: StorageOptions): boolean',
        description: 'Public method clearSessionStorage.',
        returns: 'boolean',
      },
      {
        name: 'getLocalStorageSize',
        signature: 'getLocalStorageSize(options: StorageOptions): number',
        description: 'Public method getLocalStorageSize.',
        returns: 'number',
      },
      {
        name: 'getSessionStorageSize',
        signature: 'getSessionStorageSize(options: StorageOptions): number',
        description: 'Public method getSessionStorageSize.',
        returns: 'number',
      },
      {
        name: 'watchLocalStorage',
        signature: 'watchLocalStorage(key: string, options: StorageOptions): Observable<T | null>',
        description: 'Public method watchLocalStorage.',
        returns: 'Observable<T | null>',
      },
      {
        name: 'watchSessionStorage',
        signature:
          'watchSessionStorage(key: string, options: StorageOptions): Observable<T | null>',
        description: 'Public method watchSessionStorage.',
        returns: 'Observable<T | null>',
      },
      {
        name: 'getNativeLocalStorage',
        signature: 'getNativeLocalStorage(): Storage',
        description: 'Public method getNativeLocalStorage.',
        returns: 'Storage',
      },
      {
        name: 'getNativeSessionStorage',
        signature: 'getNativeSessionStorage(): Storage',
        description: 'Public method getNativeSessionStorage.',
        returns: 'Storage',
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
    category: 'worker-compute',
    methods: [
      {
        name: 'createWorker',
        signature: 'createWorker(name: string, scriptUrl: string): Observable<WorkerStatus>',
        description: `Create a worker. Idempotent: calling twice with the same name returns the
existing entry without recreating the worker.

Returns an \`Observable<WorkerStatus>\` for backward compatibility. Prefer
 for new code.`,
        returns: 'Observable<WorkerStatus>',
      },
      {
        name: 'createWorkerSignal',
        signature: 'createWorkerSignal(name: string, scriptUrl: string): Signal<WorkerStatus>',
        description: `Create a worker (signal-first). Returns the status signal; status is also
accessible later via .`,
        returns: 'Signal<WorkerStatus>',
      },
      {
        name: 'terminateWorker',
        signature: 'terminateWorker(name: string): void',
        description: 'Public method terminateWorker.',
        returns: 'void',
      },
      {
        name: 'terminateAllWorkers',
        signature: 'terminateAllWorkers(): void',
        description: 'Public method terminateAllWorkers.',
        returns: 'void',
      },
      {
        name: 'postMessage',
        signature: 'postMessage(workerName: string, task: WorkerTask): void',
        description: 'Send a fire-and-forget message. Use  when you need a reply.',
        returns: 'void',
      },
      {
        name: 'request',
        signature:
          'request(workerName: string, type: string, data: TReq, opts?: WorkerRequestOptions): Promise<TRes>',
        description: `Send a message and await a correlated response. The worker MUST send back a
message containing \`correlationId\` matching the request id.

\`\`\`ts
const result = await ws.request<{ ok: boolean }>('worker', 'compute', { n: 1 });
\`\`\``,
        returns: 'Promise<TRes>',
      },
      {
        name: 'getMessages',
        signature: 'getMessages(workerName: string): Observable<WorkerMessage<T>>',
        description: 'Public method getMessages.',
        returns: 'Observable<WorkerMessage<T>>',
      },
      {
        name: 'getMessagesByType',
        signature:
          'getMessagesByType(workerName: string, type: string): Observable<WorkerMessage<T>>',
        description: 'Public method getMessagesByType.',
        returns: 'Observable<WorkerMessage<T>>',
      },
      {
        name: 'getStatus',
        signature: 'getStatus(workerName: string): Observable<WorkerStatus>',
        description: 'Public method getStatus.',
        returns: 'Observable<WorkerStatus>',
      },
      {
        name: 'getStatusSignal',
        signature: 'getStatusSignal(workerName: string): Signal<WorkerStatus>',
        description: 'Public method getStatusSignal.',
        returns: 'Signal<WorkerStatus>',
      },
      {
        name: 'getCurrentStatus',
        signature: 'getCurrentStatus(workerName: string): WorkerStatus | undefined',
        description: 'Public method getCurrentStatus.',
        returns: 'WorkerStatus | undefined',
      },
      {
        name: 'getAllStatuses',
        signature: 'getAllStatuses(): Map<string, WorkerStatus>',
        description: 'Public method getAllStatuses.',
        returns: 'Map<string, WorkerStatus>',
      },
      {
        name: 'isWorkerRunning',
        signature: 'isWorkerRunning(workerName: string): boolean',
        description: 'Public method isWorkerRunning.',
        returns: 'boolean',
      },
      {
        name: 'getNativeWorker',
        signature: 'getNativeWorker(name: string): Worker | undefined',
        description: 'Public method getNativeWorker.',
        returns: 'Worker | undefined',
      },
      {
        name: 'getAllWorkers',
        signature: 'getAllWorkers(): Map<string, Worker>',
        description: 'Public method getAllWorkers.',
        returns: 'Map<string, Worker>',
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
    category: 'observer',
    methods: [
      {
        name: 'observe',
        signature:
          'observe(element: Element, options: IntersectionObserverOptions): Observable<IntersectionObserverEntry[]>',
        description: 'Public method observe.',
        returns: 'Observable<IntersectionObserverEntry[]>',
      },
      {
        name: 'observeVisibility',
        signature:
          'observeVisibility(element: Element, options: IntersectionObserverOptions): Observable<boolean>',
        description: 'Public method observeVisibility.',
        returns: 'Observable<boolean>',
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
    category: 'observer',
    methods: [
      {
        name: 'observe',
        signature:
          'observe(element: Element, options: ResizeObserverOptions): Observable<ResizeObserverEntry[]>',
        description: 'Public method observe.',
        returns: 'Observable<ResizeObserverEntry[]>',
      },
      {
        name: 'observeSize',
        signature:
          'observeSize(element: Element, options: ResizeObserverOptions): Observable<ElementSize>',
        description: 'Public method observeSize.',
        returns: 'Observable<ElementSize>',
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
    category: 'system',
    methods: [
      {
        name: 'watch',
        signature: 'watch(): Observable<VisibilityState>',
        description: 'Public method watch.',
        returns: 'Observable<VisibilityState>',
      },
      {
        name: 'watchVisibility',
        signature: 'watchVisibility(): Observable<boolean>',
        description: 'Public method watchVisibility.',
        returns: 'Observable<boolean>',
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
    category: 'network',
    methods: [
      {
        name: 'open',
        signature: 'open(name: string): Observable<T>',
        description: 'Public method open.',
        returns: 'Observable<T>',
      },
      {
        name: 'post',
        signature: 'post(name: string, data: T): void',
        description: 'Public method post.',
        returns: 'void',
      },
      {
        name: 'close',
        signature: 'close(name: string): void',
        description: 'Public method close.',
        returns: 'void',
      },
      {
        name: 'closeAll',
        signature: 'closeAll(): void',
        description: 'Public method closeAll.',
        returns: 'void',
      },
      {
        name: 'getOpenChannels',
        signature: 'getOpenChannels(): string[]',
        description: 'Public method getOpenChannels.',
        returns: 'string[]',
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
    category: 'network',
    methods: [
      {
        name: 'getSnapshot',
        signature: 'getSnapshot(): NetworkInformation',
        description: 'Public method getSnapshot.',
        returns: 'NetworkInformation',
      },
      {
        name: 'watch',
        signature: 'watch(): Observable<NetworkInformation>',
        description: 'Public method watch.',
        returns: 'Observable<NetworkInformation>',
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
    category: 'system',
    methods: [
      {
        name: 'request',
        signature: 'request(type: WakeLockType): Promise<WakeLockStatus>',
        description: 'Public method request.',
        returns: 'Promise<WakeLockStatus>',
      },
      {
        name: 'release',
        signature: 'release(): Promise<void>',
        description: 'Public method release.',
        returns: 'Promise<void>',
      },
      {
        name: 'watchStatus',
        signature: 'watchStatus(): Observable<WakeLockStatus>',
        description: 'Public method watchStatus.',
        returns: 'Observable<WakeLockStatus>',
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
    fnVersion: {
      name: 'injectWakeLock',
      importPath: '@angular-helpers/browser-web-apis',
      returnType: 'WakeLockRef',
      description:
        'Provides reactive screen wake lock control via signals. Tracks active state, errors, and API support with automatic cleanup on component destroy.',
      fields: [
        {
          name: 'active',
          type: 'Signal<boolean>',
          description: 'True when wake lock is currently held.',
        },
        {
          name: 'error',
          type: 'Signal<string | null>',
          description: 'Last error from wake lock operations.',
        },
        {
          name: 'isSupported',
          type: 'Signal<boolean>',
          description: 'True when Screen Wake Lock API is available.',
        },
      ],
      example: `import { injectWakeLock } from '@angular-helpers/browser-web-apis';

@Component({...})
export class PresentationComponent {
  protected wakeLock = injectWakeLock();

  async toggle() {
    if (this.wakeLock.active()) {
      await this.wakeLock.release();
    } else {
      await this.wakeLock.request();
    }
  }
}`,
    },
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
    category: 'system',
    methods: [
      {
        name: 'getSnapshot',
        signature: 'getSnapshot(): OrientationInfo',
        description: 'Public method getSnapshot.',
        returns: 'OrientationInfo',
      },
      {
        name: 'watch',
        signature: 'watch(): Observable<OrientationInfo>',
        description: 'Public method watch.',
        returns: 'Observable<OrientationInfo>',
      },
      {
        name: 'lock',
        signature: 'lock(orientation: OrientationLockType): Promise<void>',
        description: 'Public method lock.',
        returns: 'Promise<void>',
      },
      {
        name: 'unlock',
        signature: 'unlock(): void',
        description: 'Public method unlock.',
        returns: 'void',
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
    category: 'system',
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description:
          'Override to also check the *enabled* flag (browser may have disabled fullscreen).',
        returns: 'boolean',
      },
      {
        name: 'request',
        signature: 'request(element: Element): Promise<void>',
        description: 'Public method request.',
        returns: 'Promise<void>',
      },
      {
        name: 'exit',
        signature: 'exit(): Promise<void>',
        description: 'Public method exit.',
        returns: 'Promise<void>',
      },
      {
        name: 'toggle',
        signature: 'toggle(element: Element): Promise<void>',
        description: 'Public method toggle.',
        returns: 'Promise<void>',
      },
      {
        name: 'watch',
        signature: 'watch(): Observable<boolean>',
        description: 'Public method watch.',
        returns: 'Observable<boolean>',
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
    category: 'storage-io',
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Override to also assert secure context (required by the spec).',
        returns: 'boolean',
      },
      {
        name: 'openFile',
        signature: 'openFile(options: FileOpenOptions): Promise<File[]>',
        description: 'Public method openFile.',
        returns: 'Promise<File[]>',
      },
      {
        name: 'saveFile',
        signature: 'saveFile(content: string | Blob, options: FileSaveOptions): Promise<void>',
        description: 'Public method saveFile.',
        returns: 'Promise<void>',
      },
      {
        name: 'openDirectory',
        signature: `openDirectory(options: {
      id?: string;
      mode?: 'read' | 'readwrite';
      startIn?: string;
    }): Promise<FileSystemDirectoryHandle | null>`,
        description: 'Public method openDirectory.',
        returns: 'Promise<FileSystemDirectoryHandle | null>',
      },
      {
        name: 'readFileAsText',
        signature: 'readFileAsText(file: File): Promise<string>',
        description: 'Public method readFileAsText.',
        returns: 'Promise<string>',
      },
      {
        name: 'readFileAsArrayBuffer',
        signature: 'readFileAsArrayBuffer(file: File): Promise<ArrayBuffer>',
        description: 'Public method readFileAsArrayBuffer.',
        returns: 'Promise<ArrayBuffer>',
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
    category: 'media-device',
    methods: [
      {
        name: 'isTypeSupported',
        signature: 'isTypeSupported(mimeType: string): boolean',
        description: 'Public method isTypeSupported.',
        returns: 'boolean',
      },
      {
        name: 'watchState',
        signature: 'watchState(): Observable<RecordingState>',
        description: 'Public method watchState.',
        returns: 'Observable<RecordingState>',
      },
      {
        name: 'watchData',
        signature: 'watchData(): Observable<Blob>',
        description: 'Public method watchData.',
        returns: 'Observable<Blob>',
      },
      {
        name: 'start',
        signature: 'start(stream: MediaStream, options: RecordingOptions): Promise<void>',
        description: 'Public method start.',
        returns: 'Promise<void>',
      },
      {
        name: 'pause',
        signature: 'pause(): void',
        description: 'Public method pause.',
        returns: 'void',
      },
      {
        name: 'resume',
        signature: 'resume(): void',
        description: 'Public method resume.',
        returns: 'void',
      },
      {
        name: 'stop',
        signature: 'stop(): RecordingResult | null',
        description: 'Public method stop.',
        returns: 'RecordingResult | null',
      },
      {
        name: 'getResult',
        signature: 'getResult(): RecordingResult | null',
        description: 'Public method getResult.',
        returns: 'RecordingResult | null',
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
    category: 'network',
    methods: [
      {
        name: 'connect',
        signature: 'connect(url: string, config: SSEConfig): Observable<SSEMessage<T>>',
        description: 'Public method connect.',
        returns: 'Observable<SSEMessage<T>>',
      },
      {
        name: 'disconnect',
        signature: 'disconnect(url: string): void',
        description: 'Public method disconnect.',
        returns: 'void',
      },
      {
        name: 'disconnectAll',
        signature: 'disconnectAll(): void',
        description: 'Public method disconnectAll.',
        returns: 'void',
      },
      {
        name: 'getState',
        signature: 'getState(url: string): SSEConnectionState',
        description: 'Public method getState.',
        returns: 'SSEConnectionState',
      },
      {
        name: 'getActiveConnections',
        signature: 'getActiveConnections(): string[]',
        description: 'Public method getActiveConnections.',
        returns: 'string[]',
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
    category: 'media-device',
    methods: [
      {
        name: 'vibrate',
        signature: 'vibrate(pattern: VibrationPattern): boolean',
        description: 'Public method vibrate.',
        returns: 'boolean',
      },
      {
        name: 'success',
        signature: 'success(): boolean',
        description: 'Public method success.',
        returns: 'boolean',
      },
      {
        name: 'error',
        signature: 'error(): boolean',
        description: 'Public method error.',
        returns: 'boolean',
      },
      {
        name: 'notification',
        signature: 'notification(): boolean',
        description: 'Public method notification.',
        returns: 'boolean',
      },
      {
        name: 'doubleTap',
        signature: 'doubleTap(): boolean',
        description: 'Public method doubleTap.',
        returns: 'boolean',
      },
      {
        name: 'stop',
        signature: 'stop(): boolean',
        description: 'Public method stop.',
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
    category: 'media-device',
    methods: [
      {
        name: 'getVoices',
        signature: 'getVoices(): SpeechSynthesisVoice[]',
        description: 'Public method getVoices.',
        returns: 'SpeechSynthesisVoice[]',
      },
      {
        name: 'watchVoices',
        signature: 'watchVoices(): Observable<SpeechSynthesisVoice[]>',
        description: 'Public method watchVoices.',
        returns: 'Observable<SpeechSynthesisVoice[]>',
      },
      {
        name: 'speak',
        signature: 'speak(text: string, options: SpeechOptions): Observable<SpeechState>',
        description: 'Public method speak.',
        returns: 'Observable<SpeechState>',
      },
      {
        name: 'pause',
        signature: 'pause(): void',
        description: 'Public method pause.',
        returns: 'void',
      },
      {
        name: 'resume',
        signature: 'resume(): void',
        description: 'Public method resume.',
        returns: 'void',
      },
      {
        name: 'cancel',
        signature: 'cancel(): void',
        description: 'Public method cancel.',
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
    category: 'observer',
    methods: [
      {
        name: 'observe',
        signature:
          'observe(target: Node, options?: MutationObserverOptions): Observable<MutationRecord[]>',
        description: 'Public method observe.',
        returns: 'Observable<MutationRecord[]>',
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
    category: 'observer',
    methods: [
      {
        name: 'observe',
        signature: 'observe(config: PerformanceObserverConfig): Observable<PerformanceEntryList>',
        description: 'Public method observe.',
        returns: 'Observable<PerformanceEntryList>',
      },
      {
        name: 'observeByType',
        signature:
          'observeByType(type: PerformanceEntryType, buffered: any): Observable<PerformanceEntryList>',
        description: 'Public method observeByType.',
        returns: 'Observable<PerformanceEntryList>',
      },
      {
        name: 'getSupportedEntryTypes',
        signature: 'getSupportedEntryTypes(): PerformanceEntryType[]',
        description: 'Public method getSupportedEntryTypes.',
        returns: 'PerformanceEntryType[]',
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
    category: 'media-device',
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Public method isSupported.',
        returns: 'boolean',
      },
      {
        name: 'requestPermission',
        signature: 'requestPermission(): Promise<PermissionState>',
        description: 'Public method requestPermission.',
        returns: 'Promise<PermissionState>',
      },
      {
        name: 'watch',
        signature: 'watch(options: IdleDetectorOptions): Observable<IdleState>',
        description: `Starts tracking idle state. Emits the current state and subsequent changes.
Note: You must call requestPermission() and be granted access before starting.`,
        returns: 'Observable<IdleState>',
      },
    ],
    example: `import { IdleDetectorService } from '@angular-helpers/browser-web-apis';

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
    importPath: '@angular-helpers/browser-web-apis',
    requiresSecureContext: true,
    browserSupport: 'Chrome ✓ · Firefox ✗ · Safari ✗ · Edge ✓',
    notes: ['Must be triggered by a user gesture.', 'Only available in Chromium-based browsers.'],
    category: 'media-device',
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Override to also assert secure context (required by the spec).',
        returns: 'boolean',
      },
      {
        name: 'open',
        signature: 'open(options?: { signal?: AbortSignal }): Promise<EyeDropperResult>',
        description: 'Opens the system eye dropper tool and returns the selected color.',
        returns: 'Promise<EyeDropperResult>',
      },
    ],
    example: `import { EyeDropperService } from '@angular-helpers/browser-web-apis';

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
    category: 'media-device',
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Public method isSupported.',
        returns: 'boolean',
      },
      {
        name: 'getSupportedFormats',
        signature: 'getSupportedFormats(): Promise<BarcodeFormat[]>',
        description: 'Public method getSupportedFormats.',
        returns: 'Promise<BarcodeFormat[]>',
      },
      {
        name: 'detect',
        signature:
          'detect(source: ImageBitmapSource, formats?: BarcodeFormat[]): Promise<DetectedBarcode[]>',
        description: 'Public method detect.',
        returns: 'Promise<DetectedBarcode[]>',
      },
      {
        name: 'detectStream',
        signature:
          'detectStream(video: HTMLVideoElement, options: { formats?: BarcodeFormat[]; interval?: number }): Observable<DetectedBarcode[]>',
        description: 'Public method detectStream.',
        returns: 'Observable<DetectedBarcode[]>',
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
    category: 'media-device',
    methods: [
      {
        name: 'getContext',
        signature: 'getContext(): AudioContext',
        description: 'Public method getContext.',
        returns: 'AudioContext',
      },
      {
        name: 'resume',
        signature: 'resume(): Promise<void>',
        description: 'Public method resume.',
        returns: 'Promise<void>',
      },
      {
        name: 'close',
        signature: 'close(): Promise<void>',
        description: 'Public method close.',
        returns: 'Promise<void>',
      },
      {
        name: 'getState',
        signature: 'getState(): AudioContextState',
        description: 'Public method getState.',
        returns: 'AudioContextState',
      },
      {
        name: 'createOscillator',
        signature: 'createOscillator(type: OscillatorType, frequency: any): OscillatorNode',
        description: 'Public method createOscillator.',
        returns: 'OscillatorNode',
      },
      {
        name: 'createGain',
        signature: 'createGain(value: any): GainNode',
        description: 'Public method createGain.',
        returns: 'GainNode',
      },
      {
        name: 'createAnalyser',
        signature: 'createAnalyser(fftSize: any): AnalyserNode',
        description: 'Public method createAnalyser.',
        returns: 'AnalyserNode',
      },
      {
        name: 'watchAnalyser',
        signature:
          'watchAnalyser(analyser: AnalyserNode, intervalMs: any): Observable<AudioAnalyserData>',
        description: 'Public method watchAnalyser.',
        returns: 'Observable<AudioAnalyserData>',
      },
      {
        name: 'decodeAudioData',
        signature: 'decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer>',
        description: 'Public method decodeAudioData.',
        returns: 'Promise<AudioBuffer>',
      },
      {
        name: 'playBuffer',
        signature: 'playBuffer(buffer: AudioBuffer, loop: any): AudioBufferSourceNode',
        description: 'Public method playBuffer.',
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
    category: 'media-device',
    methods: [
      {
        name: 'getSnapshot',
        signature: 'getSnapshot(index: number): GamepadState | null',
        description: 'Public method getSnapshot.',
        returns: 'GamepadState | null',
      },
      {
        name: 'getConnectedGamepads',
        signature: 'getConnectedGamepads(): GamepadState[]',
        description: 'Public method getConnectedGamepads.',
        returns: 'GamepadState[]',
      },
      {
        name: 'watchConnections',
        signature:
          "watchConnections(): Observable<{ gamepad: GamepadState; type: 'connected' | 'disconnected' }>",
        description: 'Public method watchConnections.',
        returns: "Observable<{ gamepad: GamepadState; type: 'connected' | 'disconnected' }>",
      },
      {
        name: 'poll',
        signature: 'poll(index: number, intervalMs: any): Observable<GamepadState>',
        description: 'Public method poll.',
        returns: 'Observable<GamepadState>',
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
    category: 'media-device',
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
    category: 'media-device',
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
    category: 'media-device',
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
    category: 'system',
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
    category: 'security',
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Public method isSupported.',
        returns: 'boolean',
      },
      {
        name: 'isPublicKeySupported',
        signature: 'isPublicKeySupported(): boolean',
        description: 'Public method isPublicKeySupported.',
        returns: 'boolean',
      },
      {
        name: 'get',
        signature: 'get(options?: CredentialRequestOptions): Promise<Credential | null>',
        description: 'Public method get.',
        returns: 'Promise<Credential | null>',
      },
      {
        name: 'store',
        signature: 'store(credential: Credential): Promise<void>',
        description: 'Public method store.',
        returns: 'Promise<void>',
      },
      {
        name: 'createPasswordCredential',
        signature: 'createPasswordCredential(data: PasswordCredentialData): Promise<Credential>',
        description: 'Public method createPasswordCredential.',
        returns: 'Promise<Credential>',
      },
      {
        name: 'createPublicKeyCredential',
        signature:
          'createPublicKeyCredential(options: PublicKeyCredentialOptions): Promise<Credential | null>',
        description: 'Public method createPublicKeyCredential.',
        returns: 'Promise<Credential | null>',
      },
      {
        name: 'preventSilentAccess',
        signature: 'preventSilentAccess(): Promise<void>',
        description: 'Public method preventSilentAccess.',
        returns: 'Promise<void>',
      },
      {
        name: 'isConditionalMediationAvailable',
        signature: 'isConditionalMediationAvailable(): Promise<boolean>',
        description: 'Public method isConditionalMediationAvailable.',
        returns: 'Promise<boolean>',
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
    category: 'worker-compute',
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Public method isSupported.',
        returns: 'boolean',
      },
      {
        name: 'acquire',
        signature:
          'acquire(name: string, callback: () => Promise<T> | T, options: LockOptionsLike): Promise<T>',
        description: `Acquire a lock and run the callback while holding it. The lock is released
automatically when the callback resolves or rejects.`,
        returns: 'Promise<T>',
      },
      {
        name: 'query',
        signature: 'query(): Promise<LockManagerSnapshot>',
        description: `Query the current lock state. Useful for diagnostics and tests; do not gate
critical-section logic on this — it's a snapshot, not a reservation.`,
        returns: 'Promise<LockManagerSnapshot>',
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
    category: 'storage-io',
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Public method isSupported.',
        returns: 'boolean',
      },
      {
        name: 'estimate',
        signature: 'estimate(): Promise<StorageQuotaEstimate>',
        description: 'Public method estimate.',
        returns: 'Promise<StorageQuotaEstimate>',
      },
      {
        name: 'persist',
        signature: 'persist(): Promise<boolean>',
        description: 'Public method persist.',
        returns: 'Promise<boolean>',
      },
      {
        name: 'persisted',
        signature: 'persisted(): Promise<boolean>',
        description: 'Public method persisted.',
        returns: 'Promise<boolean>',
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
    category: 'storage-io',
    methods: [
      {
        name: 'isSupported',
        signature: 'isSupported(): boolean',
        description: 'Public method isSupported.',
        returns: 'boolean',
      },
      {
        name: 'compress',
        signature:
          'compress(data: Uint8Array | ArrayBuffer, format: CompressionFormat): Promise<Uint8Array>',
        description: `Compress a \`Uint8Array\`/\`ArrayBuffer\` using the given format.`,
        returns: 'Promise<Uint8Array>',
      },
      {
        name: 'decompress',
        signature:
          'decompress(data: Uint8Array | ArrayBuffer, format: CompressionFormat): Promise<Uint8Array>',
        description: `Decompress a \`Uint8Array\`/\`ArrayBuffer\` using the given format.`,
        returns: 'Promise<Uint8Array>',
      },
      {
        name: 'compressString',
        signature: 'compressString(value: string, format: CompressionFormat): Promise<Uint8Array>',
        description: 'Convenience: compress a UTF-8 string and return the compressed bytes.',
        returns: 'Promise<Uint8Array>',
      },
      {
        name: 'decompressString',
        signature:
          'decompressString(data: Uint8Array | ArrayBuffer, format: CompressionFormat): Promise<string>',
        description: 'Convenience: decompress bytes into a UTF-8 string.',
        returns: 'Promise<string>',
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
