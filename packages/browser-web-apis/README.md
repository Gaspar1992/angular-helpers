# @angular-helpers/browser-web-apis

Angular services package for a structured and secure access layer over browser Web APIs.

🌐 **Documentation & Demo**: https://gaspar1992.github.io/angular-helpers/

[Leer en español](./README.es.md)

## Features

- Integrated security with ReDoS prevention using Web Workers
- Unified browser API access through strongly typed services
- Tree-shakable architecture
- Modular provider setup to enable only what you need
- Reactive APIs with signals and observables
- Lifecycle-safe integration with `destroyRef`

## Available Services

### Media and Device APIs

- `CameraService` - Camera access with permission handling
- `MediaDevicesService` - Media device listing and management
- `GeolocationService` - Geolocation API access
- `NotificationService` - Browser notifications API
- `MediaRecorderService` - Record audio/video from MediaStream

### Observer APIs

- `IntersectionObserverService` - Detect when elements enter/exit viewport
- `ResizeObserverService` - Watch for element size changes

### System APIs

- `BatteryService` - Monitor battery status and charging state
- `PageVisibilityService` - Track document visibility state changes
- `ScreenWakeLockService` - Prevent screen from dimming or locking
- `ScreenOrientationService` - Read and lock screen orientation
- `FullscreenService` - Toggle fullscreen mode for elements
- `VibrationService` - Trigger haptic feedback patterns
- `SpeechSynthesisService` - Text-to-speech with voice selection

### Network APIs

- `WebSocketService` - WebSocket connection handling
- `ServerSentEventsService` - Server-Sent Events client
- `BroadcastChannelService` - Inter-tab communication
- `NetworkInformationService` - Connection info and online status

### Storage & I/O APIs

- `WebStorageService` - LocalStorage and SessionStorage helpers
- `WebShareService` - Native Web Share API support
- `ClipboardService` - System clipboard access
- `FileSystemAccessService` - Open/save files via native picker

### Web APIs

- `WebWorkerService` - Web Worker management

### Security & Capabilities

- `PermissionsService` - Centralized browser permissions handling
- `BrowserCapabilityService` - Feature-detection for browser API availability

### Utilities

- `BrowserApiBaseService` - Shared base class for browser API services

## Installation

```bash
npm install @angular-helpers/browser-web-apis
```

## Quick Setup

```typescript
import { provideBrowserWebApis } from '@angular-helpers/browser-web-apis';

bootstrapApplication(AppComponent, {
  providers: [
    provideBrowserWebApis({
      enableCamera: true,
      enableGeolocation: true,
      enableNotifications: true,
    }),
  ],
});
```

## Usage by Service

### CameraService

```typescript
import { CameraService } from '@angular-helpers/browser-web-apis';

export class PhotoComponent {
  private cameraService = inject(CameraService);

  async takePhoto() {
    try {
      const stream = await this.cameraService.startCamera({
        video: true,
        audio: false,
      });

      // Use stream for video/photo capture
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }

  async stopCamera() {
    await this.cameraService.stopCamera();
  }
}
```

### BrowserCapabilityService

```typescript
import { BrowserCapabilityService } from '@angular-helpers/browser-web-apis';

export class MyComponent {
  private capability = inject(BrowserCapabilityService);

  ngOnInit() {
    if (this.capability.isSupported('geolocation')) {
      console.log('Geolocation is available');
    }
  }
}
```

### GeolocationService

```typescript
import { GeolocationService } from '@angular-helpers/browser-web-apis';

export class LocationComponent {
  private geolocation = inject(GeolocationService);

  async getCurrentLocation() {
    try {
      const position = await this.geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });

      console.log('Position:', position.coords);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }
}
```

### IntersectionObserverService

```typescript
import { IntersectionObserverService } from '@angular-helpers/browser-web-apis';

export class LazyImageComponent {
  private intersectionService = inject(IntersectionObserverService);
  private elementRef = inject(ElementRef);

  isVisible = signal(false);

  ngAfterViewInit() {
    this.intersectionService
      .observeVisibility(this.elementRef.nativeElement, { threshold: 0.5 })
      .subscribe((visible) => this.isVisible.set(visible));
  }
}
```

### ResizeObserverService

```typescript
import { ResizeObserverService } from '@angular-helpers/browser-web-apis';

export class ResponsiveComponent {
  private resizeService = inject(ResizeObserverService);
  private elementRef = inject(ElementRef);

  elementSize = signal<ElementSize | null>(null);

  ngAfterViewInit() {
    this.resizeService
      .observeSize(this.elementRef.nativeElement)
      .subscribe((size) => this.elementSize.set(size));
  }
}
```

### PageVisibilityService

```typescript
import { PageVisibilityService } from '@angular-helpers/browser-web-apis';

export class AnalyticsComponent {
  private visibilityService = inject(PageVisibilityService);

  ngOnInit() {
    this.visibilityService.watch().subscribe((state) => {
      console.log('Page is now:', state);
    });
  }
}
```

### FullscreenService

```typescript
import { FullscreenService } from '@angular-helpers/browser-web-apis';

export class VideoPlayerComponent {
  private fullscreenService = inject(FullscreenService);

  async toggleFullscreen() {
    await this.fullscreenService.toggle();
  }
}
```

### ScreenWakeLockService

```typescript
import { ScreenWakeLockService } from '@angular-helpers/browser-web-apis';

export class PresentationComponent {
  private wakeLockService = inject(ScreenWakeLockService);

  async keepScreenOn() {
    await this.wakeLockService.request();
  }

  async releaseScreen() {
    await this.wakeLockService.release();
  }
}
```

### BroadcastChannelService

```typescript
import { BroadcastChannelService } from '@angular-helpers/browser-web-apis';

export class SyncComponent {
  private broadcastService = inject(BroadcastChannelService);

  ngOnInit() {
    // Listen for messages from other tabs
    this.broadcastService.open<string>('app-sync').subscribe((msg) => {
      console.log('Received:', msg);
    });
  }

  sendMessage(data: string) {
    this.broadcastService.post('app-sync', data);
  }
}
```

### ServerSentEventsService

```typescript
import { ServerSentEventsService } from '@angular-helpers/browser-web-apis';

export class LiveFeedComponent {
  private sseService = inject(ServerSentEventsService);

  connectToEvents() {
    this.sseService.connect('https://api.example.com/events').subscribe({
      next: (message) => console.log('Event:', message),
      error: (err) => console.error('SSE error:', err),
    });
  }
}
```

### VibrationService

```typescript
import { VibrationService } from '@angular-helpers/browser-web-apis';

export class FeedbackComponent {
  private vibrationService = inject(VibrationService);

  onSuccess() {
    this.vibrationService.success();
  }

  onError() {
    this.vibrationService.error();
  }
}
```

### SpeechSynthesisService

```typescript
import { SpeechSynthesisService } from '@angular-helpers/browser-web-apis';

export class VoiceComponent {
  private speechService = inject(SpeechSynthesisService);

  speakText(text: string) {
    this.speechService.speak(text).subscribe((state) => {
      console.log('Speech state:', state);
    });
  }
}
```

### BatteryService

```typescript
import { BatteryService } from '@angular-helpers/browser-web-apis';

export class PowerComponent {
  private batteryService = inject(BatteryService);

  async ngOnInit() {
    try {
      // Initialize and get initial battery info
      const batteryInfo = await this.batteryService.initialize();
      console.log('Battery level:', batteryInfo.level);
      console.log('Is charging:', batteryInfo.charging);

      // Watch for battery changes
      this.batteryService.watchBatteryInfo().subscribe((info) => {
        console.log('Battery updated:', info);
      });
    } catch (error) {
      console.error('Battery API not supported:', error);
    }
  }
}
```

### ClipboardService

```typescript
import { ClipboardService } from '@angular-helpers/browser-web-apis';

export class CopyComponent {
  private clipboardService = inject(ClipboardService);

  async copyToClipboard(text: string) {
    try {
      await this.clipboardService.writeText(text);
      console.log('Copied successfully');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  async pasteFromClipboard(): Promise<string> {
    try {
      const text = await this.clipboardService.readText();
      return text;
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      return '';
    }
  }
}
```

### FileSystemAccessService

```typescript
import { FileSystemAccessService } from '@angular-helpers/browser-web-apis';

export class FileManagerComponent {
  private fileService = inject(FileSystemAccessService);

  async openFiles() {
    try {
      const files = await this.fileService.openFile({
        multiple: true,
        types: [
          {
            description: 'Text files',
            accept: { 'text/plain': ['.txt'] },
          },
        ],
      });
      console.log('Selected files:', files);
    } catch (error) {
      console.error('Failed to open files:', error);
    }
  }

  async saveContent(content: string) {
    try {
      await this.fileService.saveFile(content, {
        suggestedName: 'document.txt',
      });
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  }
}
```

### MediaRecorderService

```typescript
import { MediaRecorderService } from '@angular-helpers/browser-web-apis';

export class RecorderComponent {
  private recorderService = inject(MediaRecorderService);
  private stream: MediaStream | null = null;

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      await this.recorderService.start(this.stream, { mimeType: 'video/webm' });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }

  stopRecording() {
    const result = this.recorderService.stop();
    if (result) {
      console.log('Recording saved, blob URL:', result.url);
    }
  }
}
```

### WebSocketService

```typescript
import { WebSocketService } from '@angular-helpers/browser-web-apis';

export class LiveComponent {
  private wsService = inject(WebSocketService);

  connect() {
    this.wsService
      .connect({
        url: 'wss://example.com/socket',
        reconnectInterval: 3000,
        maxReconnectAttempts: 5,
      })
      .subscribe((status) => {
        console.log('Connection status:', status);
      });

    this.wsService.getMessages().subscribe((message) => {
      console.log('Received:', message);
    });
  }

  sendMessage(data: unknown) {
    this.wsService.send({ type: 'message', data });
  }
}
```

### WebStorageService

```typescript
import { WebStorageService } from '@angular-helpers/browser-web-apis';

export class SettingsComponent {
  private storageService = inject(WebStorageService);

  saveSetting(key: string, value: unknown) {
    this.storageService.setLocalStorage(key, value);
  }

  getSetting<T>(key: string): T | null {
    return this.storageService.getLocalStorage<T>(key);
  }

  watchSetting<T>(key: string) {
    return this.storageService.watchLocalStorage<T>(key).subscribe((value) => {
      console.log('Setting changed:', value);
    });
  }
}
```

### WebWorkerService

```typescript
import { WebWorkerService } from '@angular-helpers/browser-web-apis';

export class WorkerComponent {
  private workerService = inject(WebWorkerService);

  async createWorker() {
    this.workerService
      .createWorker('calc-worker', '/assets/workers/calc.worker.js')
      .subscribe((status) => {
        console.log('Worker status:', status);
      });

    this.workerService.getMessages('calc-worker').subscribe((message) => {
      console.log('Worker response:', message);
    });
  }

  sendTask(data: unknown) {
    this.workerService.postMessage('calc-worker', {
      id: 'task-1',
      type: 'CALCULATE',
      data,
    });
  }
}
```

## Browser Support

The services automatically validate browser support and unsupported-path handling:

- Chrome: full support
- Firefox: full support
- Safari: partial support
- Edge: full support
- Mobile browsers: depends on platform and API

## Notes

- Secure context (HTTPS) is required for several APIs
- Some APIs require explicit user interaction
- Permission behavior varies by browser
- Always implement error handling and fallback logic

## License

MIT
