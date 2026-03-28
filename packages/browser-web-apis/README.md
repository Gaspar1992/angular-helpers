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

### Web APIs

- `WebWorkerService` - Web Worker management
- `WebSocketService` - WebSocket connection handling
- `WebStorageService` - LocalStorage and SessionStorage helpers
- `WebShareService` - Native Web Share API support
- `ClipboardService` - System clipboard access

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
