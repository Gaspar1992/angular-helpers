# 🌐 @angular-helpers/browser-web-apis

Signal-first, SSR-safe wrappers for modern Browser Web APIs — observers, permissions, sensors, media, clipboard, fullscreen, notifications, and Web Share — built for zoneless Angular 22+.

---

## Quick Path

### 1. Installation

```bash
pnpm add @angular-helpers/browser-web-apis
```

### 2. Signal-First `inject*()` Primitives

```typescript
import { Component } from '@angular/core';
import {
  injectFullscreen,
  injectNotifications,
  injectWebShare,
  injectNetworkInformation,
} from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-device-bar',
  template: `
    <button type="button" (click)="fullscreen.toggle()">
      {{ fullscreen.isFullscreen() ? 'Exit Fullscreen' : 'Enter Fullscreen' }}
    </button>
    <span>Online: {{ network.isOnline() }}</span>
  `,
})
export class DeviceBarComponent {
  readonly fullscreen = injectFullscreen();
  readonly notifications = injectNotifications();
  readonly share = injectWebShare();
  readonly network = injectNetworkInformation();
}
```

### 3. Provider Setup (Optional)

```typescript
import { provideBrowserWebApis } from '@angular-helpers/browser-web-apis';

export const appConfig = {
  providers: [provideBrowserWebApis()],
};
```

---

## Core Primitives

| Primitive                                             | Category          | Description                                                                               |
| :---------------------------------------------------- | :---------------- | :---------------------------------------------------------------------------------------- |
| `injectFullscreen()`                                  | **UI / Viewport** | Reactive `isFullscreen()`, `isSupported()`, `enter()`, `exit()`, `toggle()` with cleanup. |
| `injectNotifications()`                               | **Messaging**     | Reactive `permission()`, `isSupported()`, `requestPermission()`, `show()`.                |
| `injectWebShare()`                                    | **Sharing**       | Reactive `isSupported()`, `canShareFiles()`, `isSharing()`, `share(data)`.                |
| `injectIntersectionObserver()`                        | **Observers**     | Signal-driven element visibility tracking with `DestroyRef` cleanup.                      |
| `injectResizeObserver()`                              | **Observers**     | Reactive element dimension signals (`width`, `height`).                                   |
| `injectNetworkInformation()`                          | **Connectivity**  | Online state, `effectiveType`, `downlink`, and `saveData` signals.                        |
| `injectGeolocation()` / `injectGeolocationResource()` | **Location**      | Signal and `resource()` wrappers for Geolocation API.                                     |
| `injectMediaQuery()` / `injectBreakpoints()`          | **Responsive**    | Reactive CSS media query and breakpoint signals.                                          |
| `@angular-helpers/browser-web-apis/experimental`      | **Experimental**  | Web Locks, Storage Manager, Compression Streams, and emerging APIs.                       |

---

## Guarantees

- **Zoneless & SSR Safe**: Optional `NgZone` injection and platform guards prevent server crashes.
- **Automatic Cleanup**: Event listeners and observers disconnect automatically via `DestroyRef`.

---

## Interactive Documentation & Demo

👉 **[Browser Web APIs Docs](https://gaspar1992.github.io/angular-helpers/docs/browser-web-apis)**
👉 **[Browser Web APIs Live Demo](https://gasparrv92.github.io/angular-helpers/demo/browser-apis)**

## License

MIT
