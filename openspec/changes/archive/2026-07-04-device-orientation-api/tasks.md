# Tasks: Device Orientation and Motion APIs

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

## Work Unit 1: Infrastructure & Services (PR 1)

Target branch: `feature/device-orientation-foundation`

1. [x] **Capabilities Register**: Update [browser-capability.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/services/browser-capability.service.ts) to define and check `deviceOrientation` and `deviceMotion` capabilities.
2. [x] **Utilities Centralization**: Create [device-orientation.utils.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/utils/device-orientation.utils.ts). Implement feature detection, event listeners executing outside `NgZone` based on config, optional `throttleTime` throttling via RxJS, and static permission helpers.
3. [x] **Orientation Service**: Create [device-orientation.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/services/device-orientation.service.ts) extending `BrowserApiBaseService` mapping `deviceorientation` event, and exposing permissions.
4. [x] **Motion Service**: Create [device-motion.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/services/device-motion.service.ts) mapping `devicemotion` events, mirroring orientation service pattern.
5. [x] **Testing**: Create test specs for services and utils. Mock iOS Permission API and verify zone execution and throttling behavior.

## Work Unit 2: Functional APIs & Providers (PR 2)

Target branch: `feature/device-orientation-api` (PR 2 targets PR 1's branch)

6. [x] **Inject Orientation**: Create [inject-device-orientation.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-device-orientation.ts) returning `DeviceOrientationRef` managing lifecycle via `DestroyRef`.
7. [x] **Inject Motion**: Create [inject-device-motion.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-device-motion.ts) returning `DeviceMotionRef` managing lifecycle.
8. [x] **Providers**: Create [device-orientation.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/providers/device-orientation.ts) and [device-motion.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/providers/device-motion.ts) exporting provider functions.
9. [x] **Exports**: Register exports in [providers.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/providers.ts) and [public-api.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/public-api.ts).
10. [x] **Testing**: Add tests for functional injection helper functions and provider setup.
