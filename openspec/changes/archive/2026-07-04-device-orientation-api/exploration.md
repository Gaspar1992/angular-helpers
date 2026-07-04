## Exploration: Implement Device Orientation and Motion APIs

### Current State

Currently, the `@angular-helpers/browser-web-apis` package wraps several browser APIs such as `Geolocation`, `Battery`, `ScreenOrientation`, and `IdleDetector`. It provides:

1. **Services** (e.g., `ScreenOrientationService`) extending `BrowserApiBaseService` to handle capability checks, safe error handling, and RxJS-based streams.
2. **Functional inject functions** (e.g., `injectScreenOrientation`) to provide reactive, signal-based hooks that work safely across SSR and browser environments.

However, the library currently does not have wrapper services or functional inject primitives for the `DeviceOrientation` and `DeviceMotion` APIs.

### Affected Areas

To implement this feature, the following files will be added or modified:

- `packages/browser-web-apis/src/services/browser-capability.service.ts` — Add `deviceOrientation` and `deviceMotion` support detection capability IDs.
- `packages/browser-web-apis/src/services/device-orientation.service.ts` — (New) Service to wrap `DeviceOrientationEvent` and handle iOS Safari permission requests.
- `packages/browser-web-apis/src/services/device-motion.service.ts` — (New) Service to wrap `DeviceMotionEvent` and handle iOS Safari permission requests.
- `packages/browser-web-apis/src/fns/inject-device-orientation.ts` — (New) Signal-based functional injection wrapper for device orientation.
- `packages/browser-web-apis/src/fns/inject-device-motion.ts` — (New) Signal-based functional injection wrapper for device motion.
- `packages/browser-web-apis/src/utils/device-orientation.utils.ts` — (New) Shared utility streams and checkers wrapping window event listeners and type definitions.
- `packages/browser-web-apis/src/providers/device-orientation.ts` — (New) Individual provider `provideDeviceOrientation`.
- `packages/browser-web-apis/src/providers/device-motion.ts` — (New) Individual provider `provideDeviceMotion`.
- `packages/browser-web-apis/src/providers.ts` — Export the new individual providers.
- `packages/browser-web-apis/src/public-api.ts` — Export all new services, inject functions, types, and providers.

### Approaches

1. **Approach A: Direct Independent Wrappers**
   - Directly implement the event listeners and state management within both the services and the functional inject files without a shared utility file.
   - **Pros**: Matches simple packages where utilities are not used. No extra file is introduced.
   - **Cons**: Code duplication of event listener callbacks and event mapping logic between services and inject functions.
   - **Effort**: Low

2. **Approach B: Shared Utility Streams (Recommended)**
   - Extract the event listener registrations, default fallbacks, and RxJS streams to a shared utility file (`device-orientation.utils.ts`). Services and inject functions will consume these shared utilities.
   - **Pros**: Highly DRY. Matches the architecture used in `ScreenOrientationService` and `injectScreenOrientation`. Promotes modularity and testability.
   - **Cons**: Introduces a new utility file in the package.
   - **Effort**: Medium

### Recommendation

We recommend **Approach B (Shared Utility Streams)**. It aligns perfectly with the cleaner design conventions established in the package (e.g., `screen-orientation` architecture). It also makes it easier to mock the streams in unit tests.

For permissions on iOS 13+, the services and functional inject ref objects must expose:

- `requestPermission(): Promise<'granted' | 'denied' | 'default'>` which accesses the static `requestPermission()` method on `DeviceOrientationEvent` or `DeviceMotionEvent` class.
- Non-iOS browsers will immediately resolve this promise to `'granted'`.

For SSR safety, capability detection will run in the browser environment. In non-browser environments, `isSupported()` will safely return `false`, and any subscription to streams will result in an error or safe completion inside the Observable context (handled by `ensureSupported()`), preventing node/prerendering runtime crashes.

### Risks

- **Transient User Gesture Constraint**: On iOS Safari, permissions must be requested from a direct user interaction event (e.g. click). If called in lifecycle hooks like `ngOnInit`, the promise will immediately resolve to `'denied'`.
- **Secure Context (HTTPS)**: These APIs require a secure context. During local development without HTTPS enabled, the APIs will report as unsupported.
- **Hardware Limitations**: Many desktop environments or virtualized machines do not emit orientation or motion events. Automated testing (e.g. Vitest) must mock these window events.

### Ready for Proposal

Yes — The technical design and codebase integration pattern are clear. The orchestrator should proceed to create the change proposal.
