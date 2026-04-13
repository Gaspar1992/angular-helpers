---
title: 'browser-web-apis v21.5: real tree-shaking, bug fixes, and signal consistency'
publishedAt: '2026-04-13'
tags: ['browser-web-apis', 'tree-shaking', 'angular', 'architecture', 'signals']
excerpt: 'We fixed a double permission check bug, made filter signals truly readonly, unified logging across all services, and restructured providers so each provideX() only pulls in what it needs.'
---

## The problem

`@angular-helpers/browser-web-apis` exposed 36+ services through a single `providers.ts` file. Every import from that file — even `provideCamera()` — caused bundlers to include all 35 other services in the final bundle. The "Tree-shakable architecture" bullet point in the README was aspirational, not real.

We also found three concrete bugs during an internal audit:

1. **Double permission check**: `MediaDeviceBaseService.getUserMedia()` called `requestPermission()` twice if the first check returned `false`. The second call was identical and would never prompt the user — it just wasted a round trip.
2. **Mutable public signals**: `videoInputs`, `audioInputs`, and `audioOutputs` were exposed as raw `signal<T>()` — any consumer could call `.set()` on them.
3. **Inconsistent signal naming**: The public readonly wrappers used the RxJS `$` suffix convention (`devices$`, `activeStreams$`, `error$`) on signals, not observables.

And two consistency issues across services:

4. Five services (`WebSocketService`, `WebWorkerService`, `WebStorageService`, `CameraService`, `MediaDevicesService`) bypassed the centralized `logError/logInfo` methods from `BrowserApiBaseService` and wrote directly to `console`.
5. `WebStorageService` and `WebWorkerService` re-injected `DestroyRef` even though the base class already provides it as a `protected` member.

## What we changed

### Bug fixes

**Double permission check** — removed the redundant second call. If `requestPermission()` returns `false`, we throw immediately. There is no value in asking again.

```ts
// Before
const hasPermission = await this.requestPermission(permissionType);
if (!hasPermission) {
  const granted = await this.requestPermission(permissionType); // identical call
  if (!granted) throw new Error(`${permissionType} permission denied`);
}

// After
const hasPermission = await this.requestPermission(permissionType);
if (!hasPermission) throw new Error(`${permissionType} permission denied`);
```

**Readonly signals** — private writable, public readonly via `.asReadonly()`:

```ts
// Before (publicly writable)
readonly videoInputs = signal<MediaDevice[]>([]);

// After (encapsulated)
private readonly _videoInputs = signal<MediaDevice[]>([]);
readonly videoInputs = this._videoInputs.asReadonly();
```

**Signal naming** — removed the `$` suffix. That convention belongs to RxJS observables:

```ts
// Before
readonly devices$      = this._devices.asReadonly();
readonly activeStreams$ = this._activeStreams.asReadonly();
readonly error$        = this._error.asReadonly();

// After
readonly devices      = this._devices.asReadonly();
readonly activeStreams = this._activeStreams.asReadonly();
readonly error        = this._error.asReadonly();
```

**Centralized logging** — all five services now use `this.logError()` and `this.logInfo()` from the base class. This ensures consistent formatting (`[ServiceName] message`) and makes it easy to plug in a real logger later.

**Redundant injection** — removed `protected override destroyRef = inject(DestroyRef)` from `WebStorageService` and `WebWorkerService`. It's already in `BrowserApiBaseService`.

### True tree-shaking

The core change: each `provideX()` function now lives in its own file under `src/providers/`.

```
src/providers/
  camera.ts         → provideCamera()      imports only CameraService + PermissionsService
  geolocation.ts    → provideGeolocation() imports only GeolocationService + PermissionsService
  web-storage.ts    → provideWebStorage()  imports only WebStorageService
  ...37 files total
```

`providers.ts` re-exports all of them and keeps `provideBrowserWebApis()` — the all-in-one kitchen-sink that intentionally imports everything.

We also added `"sideEffects": false` to `package.json`. This tells webpack, Rollup, and Vite that no file in the package has side effects at import time, enabling module-level tree-shaking through re-export chains.

**Before:** `import { provideCamera } from '@angular-helpers/browser-web-apis'` → bundle includes all 36 services.

**After:** `import { provideCamera } from '@angular-helpers/browser-web-apis'` → bundle includes only `CameraService` and `PermissionsService`.

### Dead code removed

`MediaDeviceBaseService` was an abstract base class with full stream management, device enumeration, and permission handling. Neither `CameraService` nor `MediaDevicesService` extended it, and it wasn't exported in the public API. Deleted.

## How to use it

### Granular (recommended for production)

```typescript
import {
  provideCamera,
  provideGeolocation,
  provideWebStorage,
} from '@angular-helpers/browser-web-apis';

bootstrapApplication(AppComponent, {
  providers: [
    provideCamera(), // → CameraService + PermissionsService
    provideGeolocation(), // → GeolocationService + PermissionsService
    provideWebStorage(), // → WebStorageService
  ],
});
```

### All-in-one (zero bundle budget concern)

```typescript
import { provideBrowserWebApis } from '@angular-helpers/browser-web-apis';

bootstrapApplication(AppComponent, {
  providers: [
    provideBrowserWebApis({
      enableCamera: true,
      enableGeolocation: true,
      enableWebStorage: true,
    }),
  ],
});
```

### Combo providers

```typescript
import { provideMediaApis, provideStorageApis } from '@angular-helpers/browser-web-apis';

bootstrapApplication(AppComponent, {
  providers: [
    provideMediaApis(), // Camera + MediaDevices + Permissions
    provideStorageApis(), // Clipboard + WebStorage + Permissions
  ],
});
```

## What's NOT in scope

- **Secondary entry points** (`@angular-helpers/browser-web-apis/camera`) — the current re-export pattern with `sideEffects: false` is sufficient for the vast majority of bundlers. Secondary entry points are the next step if we find consumers whose bundler can't follow re-export chains.
- **Service API changes** — all existing service methods are unchanged. This is a pure provider and internal refactor.
- **New services** — no new services were added in this release.
