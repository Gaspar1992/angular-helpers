# Technical Design: Device Orientation and Motion APIs

## Technical Approach

We introduce [DeviceOrientationService](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/services/device-orientation.service.ts) and [DeviceMotionService](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/services/device-motion.service.ts) alongside functional injection helpers [injectDeviceOrientation()](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-device-orientation.ts) and [injectDeviceMotion()](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-device-motion.ts). All event listeners, NgZone scheduling, and throttling logic are centralized inside a shared helper utility file [device-orientation.utils.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/utils/device-orientation.utils.ts) to keep implementations DRY.

---

## Architecture Decisions

| Decision Area          | Choices Considered                                           | Selected Option & Rationale                                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zone Management**    | Run listeners inside zone vs. run outside by default         | **Run outside zone by default**. Device motion/orientation events emit at high frequency. Executing them inside Angular's zone triggers excessive change detection, degrading UI performance. |
| **Throttling**         | Throttle on every event vs. optional RxJS `throttleTime`     | **Optional RxJS `throttleTime`**. Allows consumers to limit the emission rate (e.g. 100ms) for performance-sensitive components, defaulting to unthrottled streams.                           |
| **Permissions**        | Pre-emptively request permissions vs. User-gesture triggered | **User-gesture triggered**. iOS Safari blocks programmatic permission checks. We expose `requestPermission()` methods for developers to invoke on button clicks.                              |
| **SSR & Environments** | Throw on Server/HTTP vs. Graceful fallback                   | **Graceful fallback**. In SSR/HTTP non-secure contexts, capabilities evaluate to `false`, returning `null`/empty state without runtime reference errors.                                      |

---

## Data Flow Diagram

```
[Browser Events: deviceorientation/devicemotion]
       │
       ▼ (Runs outside NgZone if runOutsideAngular = true)
[device-orientation.utils.ts] ──(Optional throttleTime)──► [RxJS Observable]
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
[DeviceOrientation/MotionService]   [injectDeviceOrientation/Motion()]
(Observables / permissionState)     (Signal-based Ref / requestPermission)
```

---

## Detailed File Changes

1. **`browser-capability.service.ts`**:
   - Add `'deviceOrientation'` and `'deviceMotion'` to `BrowserCapabilityId`.
   - Update `BROWSER_CAPABILITIES` registry.
   - Implement capability checks in `isSupported()`.
2. **`device-orientation.utils.ts`**:
   - Create shared functions `isDeviceOrientationSupported()`, `isDeviceMotionSupported()`.
   - Implement `createDeviceOrientationStream()` and `createDeviceMotionStream()` encapsulating `NgZone.runOutsideAngular` and `throttleTime`.
   - Safe reference helper to call static `.requestPermission()` on event classes.
3. **`device-orientation.service.ts` / `device-motion.service.ts`**:
   - Classes extending `BrowserApiBaseService` exposing `watch()` and `requestPermission()`.
4. **`inject-device-orientation.ts` / `inject-device-motion.ts`**:
   - Functions utilizing signals and `DestroyRef` to clean up event listeners automatically.
5. **`providers/` & `providers.ts` & `public-api.ts`**:
   - Expose the services, functions, and providers (`provideDeviceOrientation`, `provideDeviceMotion`).

---

## Code Contracts

```typescript
export interface DeviceSensorConfig {
  runOutsideAngular?: boolean;
  throttleTime?: number;
}

export interface DeviceOrientationData {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  absolute: boolean;
}

export interface DeviceMotionData {
  acceleration: DeviceMotionEventAcceleration | null;
  accelerationIncludingGravity: DeviceMotionEventAcceleration | null;
  rotationRate: DeviceMotionEventRotationRate | null;
  interval: number;
}

export interface DeviceOrientationRef {
  readonly isSupported: Signal<boolean>;
  readonly data: Signal<DeviceOrientationData | null>;
  readonly error: Signal<Error | null>;
  readonly permissionState: Signal<PermissionState>;
  requestPermission(): Promise<PermissionState>;
  start(config?: DeviceSensorConfig): void;
  stop(): void;
}

export interface DeviceMotionRef {
  readonly isSupported: Signal<boolean>;
  readonly data: Signal<DeviceMotionData | null>;
  readonly error: Signal<Error | null>;
  readonly permissionState: Signal<PermissionState>;
  requestPermission(): Promise<PermissionState>;
  start(config?: DeviceSensorConfig): void;
  stop(): void;
}
```

Service APIs mirror this signature:

- `watch(config?: DeviceSensorConfig): Observable<T>`
- `requestPermission(): Promise<PermissionState>`
- `permissionState: Signal<PermissionState>`

---

## Testing Strategy

Using **Vitest**, we will:

1. **Mock Global Objects**: Stub `window.DeviceOrientationEvent` and `window.DeviceMotionEvent`.
2. **Permission Handling**: Mock the presence/absence of `.requestPermission()` to test both iOS Safari (resolves via mock promise) and Android/Desktop (resolves immediately to `'granted'`).
3. **Zone Checking**: Spy on `NgZone.runOutsideAngular` to assert callbacks execute outside the Angular zone.
4. **Throttling Verification**: Use virtual time or timers to test `throttleTime` correctly drops events.
5. **SSR Safe Execution**: Set `PLATFORM_ID` to `'server'` and assert no runtime reference errors are thrown and signals initialize to `null`.
