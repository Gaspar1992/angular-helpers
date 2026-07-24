---
title: 'browser-web-apis: robustness deep-dive — spec compliance, leak prevention, and unified architecture'
publishedAt: '2026-04-13'
tags: ['browser-web-apis', 'bugfix', 'mdn', 'architecture', 'angular']
excerpt: 'A deep look at what breaks silently in a Browser API wrapper library — from permission pre-checks that block native prompts to WebSocket connections that outlive their host component — and how we fixed it.'
---

## The problem with wrapping browser APIs

Wrapping browser APIs sounds straightforward: inject the service, call the method, get the result. But browser APIs carry a lot of implicit contracts — secure context requirements, permission flows, cross-browser behavioral differences, and lifecycle expectations — that are easy to get wrong and painful to debug in production.

This post documents the second pass of improvements to `@angular-helpers/browser-web-apis`, focused on correctness rather than features.

---

## What we fixed

### 1. Permission pre-checks that blocked native prompts

Both `CameraService` and `ClipboardService` had the same anti-pattern:

```ts
// ❌ Before — the browser never gets a chance to show its own prompt
const status = await permissionsService.query({ name: 'camera' });
if (status.state !== 'granted') {
  throw new Error('Camera permission required');
}
await navigator.mediaDevices.getUserMedia({ video: true });
```

This fails in three ways:

- On **first visit**: permission state is `'prompt'`, so the service throws before `getUserMedia()` runs — the browser never shows the native prompt
- On **Firefox**: `clipboard-read` and `clipboard-write` are not queryable via the Permissions API (MDN-confirmed); the query throws a `TypeError`, our Firefox fallback returns `'prompt'`, and the service throws again
- On **Safari**: same as Firefox for clipboard permissions

The fix: remove the pre-check entirely. Let the native API surface permissions through its own prompt flow. If the user denies, the API throws `NotAllowedError`, which the caller handles.

```ts
// ✅ After — the browser handles permissions natively
async startCamera(constraints?: MediaStreamConstraints): Promise<MediaStream> {
  this.ensureSupported(); // only checks HTTPS + browser environment
  return navigator.mediaDevices.getUserMedia(constraints ?? { video: true });
}
```

### 2. MDN compliance: secure context checks

MDN marks several APIs as **secure context only** — meaning `navigator.mediaDevices`, `navigator.clipboard`, and `navigator.geolocation` are `undefined` or restricted on plain HTTP, even in modern browsers that support them.

We updated `ensureSupported()` overrides to check for the actual API object rather than just the namespace:

```ts
// MediaDevices / Camera
protected override ensureSupported(): void {
  super.ensureSupported();
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera API not supported — a secure context (HTTPS) is required');
  }
}

// Clipboard
protected override ensureSupported(): void {
  super.ensureSupported();
  if (!navigator.clipboard) {
    throw new Error('Clipboard API not supported — a secure context (HTTPS) is required');
  }
}
```

### 3. Firefox fallback in PermissionsService

Firefox does not support querying `'camera'`, `'microphone'`, or `'speaker'` through the Permissions API. Calling `navigator.permissions.query({ name: 'camera' })` throws a `TypeError`.

The fix: catch `TypeError` and return a synthetic `'prompt'` state. This preserves the intent — the caller falls through to the native prompt — without crashing on Firefox.

```ts
try {
  return await navigator.permissions.query(descriptor);
} catch (error) {
  if (error instanceof TypeError) {
    return { state: 'prompt', onchange: null } as unknown as PermissionStatus;
  }
  throw error;
}
```

### 4. WebSocket and WebWorker resource leaks

Both `WebSocketService` and `WebWorkerService` were missing cleanup on service destruction. If either service was provided in a component scope (not root), destroying the component would leave the WebSocket connection open, reconnect timers running, and web workers alive.

Angular's `DestroyRef` is already injected in `BrowserApiBaseService`. One class field is enough:

```ts
// WebSocketService
private readonly _cleanup = this.destroyRef.onDestroy(() => this.disconnect());

// WebWorkerService
private readonly _cleanup = this.destroyRef.onDestroy(() => this.terminateAllWorkers());
```

### 5. WebStorageService: self-writes and clear events

The native `storage` event only fires in **other tabs**. An app watching a key would never be notified of writes made by its own tab. We fixed this by emitting through the `storageEvents` signal after every `set`, `remove`, and `clear` operation.

Additionally, the `clear()` methods never notified watchers at all. We now follow the native spec: full clear emits a `key: null` event (same as the browser's native behavior), while prefix-scoped clear emits individual `key` events per removed entry.

```ts
// Watchers now receive null when a key is cleared
watchLocalStorage<T>('theme').subscribe((value) => {
  console.log(value); // null when clearLocalStorage() is called
});
```

The `StorageEvent.key` type was updated from `string` to `string | null` to reflect this.

### 6. WebStorageService: cross-tab remove and clear events

The cross-tab storage event handler had a silent bug in the condition that processed native `storage` events:

```ts
// ❌ Before — two entire event types were silently dropped
if (storageEvent.key && storageEvent.newValue !== null) { ... }
```

This filtered out:

- **`removeItem()` from another tab** — `key` is present but `newValue` is `null` → the `!== null` check drops it; watchers in the current tab never received `null`
- **`clear()` from another tab** — the native spec fires with `key: null`; the `storageEvent.key &&` truthy check drops it entirely

The fix removes the condition. All native storage events are forwarded unconditionally; routing is handled by the per-watcher `key === null || key === fullKey` filter already in place.

### 7. WebSocketService: getMessagesByType()

The `getMessages()` method had a filter predicate that always returned `true` — a no-op used as a type assertion. We removed it and added a proper `getMessagesByType<T>()` method that actually filters:

```ts
// Filter by message type — useful for multiplexed WebSocket channels
service.getMessagesByType<OrderUpdate>('order:update').subscribe((msg) => renderOrder(msg.data));
```

### 8. Injectable logger — BROWSER_API_LOGGER

All `console.error` and `console.log` calls across the package are now routed through an `InjectionToken`:

```ts
// Default: uses console
export const BROWSER_API_LOGGER = new InjectionToken<BrowserApiLogger>('BROWSER_API_LOGGER', {
  providedIn: 'root',
  factory: () => ({
    info: (msg) => console.info(msg),
    warn: (msg) => console.warn(msg),
    error: (msg, err) => console.error(msg, err),
  }),
});
```

To route logs to Sentry or any other sink:

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideBrowserWebApis(),
    {
      provide: BROWSER_API_LOGGER,
      useValue: {
        info: (msg) => Sentry.addBreadcrumb({ message: msg, level: 'info' }),
        warn: (msg) => Sentry.addBreadcrumb({ message: msg, level: 'warning' }),
        error: (msg, err) => Sentry.captureException(err, { extra: { msg } }),
      },
    },
  ],
});
```

### 9. Unified ensureSupported() Template Method

Every service previously had a private `ensureXxxSupport()` method. We replaced all of them with a consistent `override ensureSupported()` pattern:

```ts
protected override ensureSupported(): void {
  super.ensureSupported(); // SSR guard
  if (!navigator.geolocation) {
    throw new Error('Geolocation API not supported — a secure context (HTTPS) is required');
  }
}
```

This means every public method on every service calls the same `this.ensureSupported()`, which chains SSR detection through the base class and API availability through the override. One place to change, one place to test.

### 10. Dead code removed

`PermissionAwareBrowserApiBaseService` was a base class designed for services that query the Permissions API. After removing the pre-check anti-pattern from `CameraService` and `ClipboardService`, no service in the package extended it anymore. It was deleted and removed from the public API.

---

## What's NOT in scope

- **Streaming APIs**: no changes to `MediaRecorderService` or `WebAudioService` beyond the logger migration
- **Experimental APIs**: `IdleDetectorService`, `WebBluetoothService`, `WebNfcService`, and `WebUsbService` are documented as Chromium-only and remain unchanged in behavior
- **Error types**: no custom error class hierarchy — native errors are preserved and re-thrown

---

## Breaking changes

- `StorageEvent.key` is now `string | null` (was `string`) — update any code that reads the key from storage events without null checks
- `PermissionAwareBrowserApiBaseService` is removed from the public API — if you extended it, switch to `BrowserApiBaseService`
- `WebSocketService.getMessages()` return type is `Observable<WebSocketMessage<T>>` without the filter pipe — behavior is identical but the internal implementation changed
