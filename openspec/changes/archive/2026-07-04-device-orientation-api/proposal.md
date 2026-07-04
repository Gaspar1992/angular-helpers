# Proposal: Device Orientation and Motion APIs

## Intent

Integrate standard `DeviceOrientation` and `DeviceMotion` browser APIs into `@angular-helpers/browser-web-apis`. Expose clean, reactive, NgZone-aware, and throttle-configured Signals and Observables, including iOS Safari permission request orchestration.

## Scope

### In Scope

- **Services**: `DeviceOrientationService`, `DeviceMotionService`
- **Functional API Primitives**: `injectDeviceOrientation()`, `injectDeviceMotion()`
- **Configuration Options**: Support setting `runOutsideAngular: boolean` (defaults to `true`) and `throttleTime: number` (optional milliseconds).
- **Graceful Fallbacks**: Emit null/empty states for unsupported runtime environments (SSR, HTTP non-secure context) or if device hardware doesn't emit sensor values.
- **iOS Authorization Flow**: Signal exposing permission status (`'prompt' | 'granted' | 'denied'`) and `requestPermission()` method.

### Out of Scope

- Hardware emulator/mocking UI widgets.
- Auto-requesting permissions on lifecycle initialization (violates user gesture constraints).

## Capabilities

| Capability                 | Return Type            | Description                                                       |
| -------------------------- | ---------------------- | ----------------------------------------------------------------- |
| `injectDeviceOrientation`  | `DeviceOrientationRef` | Functional hook for orientation angles (`alpha`, `beta`, `gamma`) |
| `injectDeviceMotion`       | `DeviceMotionRef`      | Functional hook for acceleration and rotation metrics             |
| `DeviceOrientationService` | `class`                | Angular service mapping orientation events                        |
| `DeviceMotionService`      | `class`                | Angular service mapping motion events                             |

## Approach

1. **Utility Stream Layer**: Centralize event listeners in `device-orientation.utils.ts` using RxJS `fromEvent`.
2. **Zone Management**: Run listener callbacks outside Angular's zone (`NgZone.runOutsideAngular`) by default to prevent change detection cycles on every physical movement.
3. **Throttling**: Intercept streams with `throttleTime` operators if user configures a throttle limit.
4. **Permissions**: Expose `permissionState: Signal<'prompt' | 'granted' | 'denied'>`. Leverage `DeviceOrientationEvent.requestPermission` / `DeviceMotionEvent.requestPermission` on iOS. Immediately resolve to `'granted'` on other compatible environments.
5. **No-Support Fallback**: Fallback to `null` values if APIs are absent or sensors fail to publish data.

## Affected Areas

- `packages/browser-web-apis/src/services/browser-capability.service.ts` (Add capabilities)
- `packages/browser-web-apis/src/services/device-orientation.service.ts` (New service)
- `packages/browser-web-apis/src/services/device-motion.service.ts` (New service)
- `packages/browser-web-apis/src/fns/inject-device-orientation.ts` (New fn)
- `packages/browser-web-apis/src/fns/inject-device-motion.ts` (New fn)
- `packages/browser-web-apis/src/utils/device-orientation.utils.ts` (New utilities)
- `packages/browser-web-apis/src/providers/device-orientation.ts` (New provider)
- `packages/browser-web-apis/src/providers/device-motion.ts` (New provider)
- `packages/browser-web-apis/src/providers.ts` & `public-api.ts` (Exports)

## Risks & Mitigations

- **User Gesture Check**: Safari rejects permission triggers called programmatically outside a click listener. We mitigate by exposing `requestPermission` methods to call on buttons.
- **Secure Contexts**: HTTPS is mandatory. Local dev fallback is document-supported checks.

## Rollback Plan

Run `git checkout -- packages/` and delete new files.

## Success Criteria

- 100% test coverage on permission and event mapping.
- Vitest mock tests for iOS requestPermission.
- Code bundle compiles cleanly without SSR type issues.
