# 🌐 @angular-helpers/browser-web-apis

A modular, strongly typed, and reactive Angular suite for native Browser Web APIs (41 services and 23 inject() primitives). Provides signal-driven access, true tree-shaking, SSR protection, and automatic lifecycle management via `DestroyRef`.

---

## Quick Path

### 1. Installation

```bash
pnpm add @angular-helpers/browser-web-apis
```

### 2. Provider Configuration (Granular or All-in-One)

You can provide individual services for optimal bundle size, or use `provideBrowserWebApis` for rapid prototyping:

```typescript
// app.config.ts (Tree-shakeable configuration)
import { ApplicationConfig } from '@angular/core';
import {
  provideBrowserWebApis,
  provideCamera,
  provideGeolocation,
} from '@angular-helpers/browser-web-apis';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserWebApis({
      services: [provideCamera(), provideGeolocation()],
    }),
  ],
};
```

### 3. Usage in Components

```typescript
import { Component, inject } from '@angular/core';
import { GeolocationService, BatteryService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-device-status',
  template: `
    <div>
      <p>Latitude: {{ geo.latitude() }}</p>
      <p>Longitude: {{ geo.longitude() }}</p>
      <p>Battery: {{ battery.level() }}%</p>
    </div>
  `,
})
export class DeviceStatusComponent {
  readonly geo = inject(GeolocationService);
  readonly battery = inject(BatteryService);
}
```

---

## Available Services

| Category              | Service / Function            | Description & Key Signals                                                    |
| :-------------------- | :---------------------------- | :--------------------------------------------------------------------------- |
| **Media & Device**    | `CameraService`               | Video stream capture, photo snaps, facingMode, permission status.            |
|                       | `MediaDevicesService`         | Audio/video device enumeration and input switching.                          |
|                       | `GeolocationService`          | Real-time position tracking (`latitude()`, `longitude()`, `accuracy()`).     |
|                       | `NotificationService`         | Native desktop and push notifications with permission handling.              |
|                       | `MediaRecorderService`        | Reactive recording of audio/video streams with chunk emission.               |
| **Observers**         | `IntersectionObserverService` | Element viewport visibility tracking via Signals.                            |
|                       | `ResizeObserverService`       | Element dimension observation with content-box/border-box support.           |
|                       | `MutationObserverService`     | DOM mutation observation (attributes, childList, subtree).                   |
|                       | `PerformanceObserverService`  | Core Web Vitals (LCP, CLS, FID/INP) observation.                             |
| **System & Hardware** | `BatteryService`              | Battery level, charging state, and charging time signals.                    |
|                       | `ScreenWakeLockService`       | Prevents display sleep during media or active tasks.                         |
|                       | `ScreenOrientationService`    | Tracks orientation angles and handles orientation locking.                   |
|                       | `FullscreenService`           | Request, exit, and observe fullscreen state for elements.                    |
|                       | `PageVisibilityService`       | Tracks document visibility state changes (`visible()`, `hidden()`).          |
|                       | `VibrationService`            | Triggers haptic feedback patterns on supported mobile devices.               |
|                       | `SpeechSynthesisService`      | Text-to-speech engine with voice selection and pitch/rate controls.          |
|                       | `IdleDetectorService`         | User idle and screen lock detection for sensitive applications.              |
|                       | `GamepadService`              | Game controller polling, buttons, and joystick axes.                         |
|                       | `WebAudioService`             | Audio context, synthesizers, oscillators, and visualizer analysers.          |
|                       | `WebLocksService`             | Cross-tab resource coordination and cooperative locking.                     |
|                       | `StorageManagerService`       | Quota estimation, persistent storage permissions, and storage info.          |
|                       | `CompressionService`          | Gzip and Deflate streaming compression/decompression.                        |
| **Network & Comms**   | `WebSocketService`            | Reactive WebSocket connections with automated reconnect and message signals. |
|                       | `ServerSentEventsService`     | Typed Server-Sent Events client with auto-reconnect and stream handlers.     |
|                       | `injectWebTransportResource`  | Low-latency HTTP/3 & QUIC streams and datagrams via `rxResource`.            |
|                       | `BroadcastChannelService`     | Reactive multi-tab communication channels.                                   |
|                       | `NetworkInformationService`   | Connection speed, effective type (4G/3G), and online/offline signals.        |
| **Storage & I/O**     | `WebStorageService`           | Reactive wrappers for `localStorage` and `sessionStorage`.                   |
|                       | `ClipboardService`            | Reading and writing text/blobs to the system clipboard.                      |
|                       | `FileSystemAccessService`     | Native file picker, directory reader, and file saver.                        |
|                       | `EyeDropperService`           | Color picker tool from screen pixels.                                        |

---

## Architectural Guarantees

- **Granular Tree-Shaking**: Each API has its own `provide<Service>()` factory. Services you don't provide won't end up in your bundle.
- **SSR & Hydration Safe**: Every service checks `isPlatformBrowser` internally and gracefully degrades on the server without throwing or stalling SSR.
- **Automatic Cleanup**: Event listeners and active subscriptions are torn down on component destroy via `DestroyRef`.
- **Zoneless Ready**: Built with native Angular Signals for seamless Zoneless Change Detection.

---

## Interactive Documentation & Demos

Live interactive playgrounds for each browser API are available at:
👉 **[Angular Helpers Browser Web APIs Docs](https://gaspar1992.github.io/angular-helpers/docs/browser-web-apis)**
👉 **[Interactive Browser APIs Demo](https://gaspar1992.github.io/angular-helpers/demo/browser-apis)**

---

## License

MIT
