# Specification: Device Orientation and Motion APIs (device-orientation-api)

## Purpose

Define the behavior, API signature, zone orchestration, permissions, and fallback mechanisms for reactive device orientation and motion events in `@angular-helpers/browser-web-apis`.

## Requirements

1. **Services**:
   - `DeviceOrientationService` and `DeviceMotionService` MUST be injectable Angular services.
   - They MUST map `deviceorientation` and `devicemotion` events respectively.

2. **Functional Primitives**:
   - `injectDeviceOrientation` and `injectDeviceMotion` MUST be functional injection primitives (using `inject()`) that return references to their respective services or data streams.

3. **Zone Execution**:
   - Both services and primitives MUST support a `runOutsideAngular` option (defaulting to `true`).
   - If `runOutsideAngular` is `true`, event listeners MUST be registered outside `NgZone` using `NgZone.runOutsideAngular()`.

4. **Rate Limiting**:
   - Both services and primitives MUST support an optional `throttleTime` parameter.
   - When provided, emissions MUST be throttled using RxJS `throttleTime` to avoid excessive change detection updates.

5. **Permission Management**:
   - On iOS/Safari where runtime permissions are required, services and functional refs MUST expose:
     - A read-only `permissionState: Signal<'prompt' | 'granted' | 'denied'>`.
     - A `requestPermission(): Promise<'granted' | 'denied' | 'prompt'>` method.
   - The `requestPermission` method MUST leverage static `DeviceOrientationEvent.requestPermission` / `DeviceMotionEvent.requestPermission` if present on the window/event classes.
   - On other compatible platforms (e.g., Android, desktop), `requestPermission` MUST resolve immediately to `'granted'` and the status MUST be `'granted'`.

6. **Fallback Behavior**:
   - If the API is executed under SSR, a non-secure HTTP context, or if the device lacks hardware sensors:
     - The APIs MUST NOT throw runtime reference errors.
     - The returned streams and signals MUST emit `null`.

## Scenarios

### Scenario 1: Event Listeners run outside NgZone by default

```gherkin
Given the angular application is bootstrapped with NgZone
And `DeviceOrientationService` is initialized with default options (runOutsideAngular = true)
When a device orientation event is fired by the browser
Then the listener callback MUST execute outside NgZone
And it MUST NOT trigger Angular's change detection cycles.
```

### Scenario 2: Rate limiting emissions with throttleTime

```gherkin
Given a `DeviceMotionService` is configured with `throttleTime` of 100ms
When the browser fires device motion events at a frequency of 10ms
Then the service stream MUST emit at most once every 100ms.
```

### Scenario 3: Permission requesting on iOS/Safari

```gherkin
Given the application is running in iOS Safari
And `DeviceOrientationEvent.requestPermission` exists on the window object
When `requestPermission()` is called on `DeviceOrientationService`
Then the service MUST invoke the static `DeviceOrientationEvent.requestPermission` method
And update the `permissionState` signal based on the resolved promise.
```

### Scenario 4: Permission requesting on other platforms

```gherkin
Given the application is running in Android Chrome
And `DeviceOrientationEvent.requestPermission` is undefined
When `requestPermission()` is called on `DeviceOrientationService`
Then the service MUST immediately resolve the returned promise to `'granted'`
And set the `permissionState` signal to `'granted'`.
```

### Scenario 5: Graceful fallback on SSR or non-secure contexts

```gherkin
Given the application is running in an SSR environment
Or running in an HTTP non-secure context
When the `DeviceOrientationService` is instantiated
Then the service MUST NOT throw any runtime reference errors
And the data signals MUST emit `null` values.
```
