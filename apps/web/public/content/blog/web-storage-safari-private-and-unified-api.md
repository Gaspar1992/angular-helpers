---
title: 'browser-web-apis v21.7: WebStorage that survives Safari private mode + a unified API'
publishedAt: '2026-04-18'
tags: ['browser-web-apis', 'web-storage', 'safari', 'bugfix', 'angular']
excerpt: 'Two changes: every storage access is now wrapped in try/catch (Safari private mode and sandboxed iframes degrade gracefully instead of crashing), and the public API is unified into local and session namespaces sharing one method surface.'
---

# WebStorage, but it actually works in Safari private mode

`localStorage` access can throw `SecurityError` in environments you don't control:

- Safari in private browsing mode
- Sandboxed iframes (`sandbox="allow-scripts"` without `allow-same-origin`)
- Browsers with storage explicitly disabled

The previous `WebStorageService` checked `typeof Storage === 'undefined'` and assumed it was safe to call `localStorage.setItem`. It wasn't. Any of those environments would crash on the first write.

`v21.7` fixes that and unifies the API at the same time.

## SecurityError safety

Every native call now lives inside try/catch. A probe (`setItem` + `removeItem` of a `__bwa_probe_*` key) runs once per namespace; if it throws, `isSupported()` returns `false` for that namespace, every subsequent operation returns the default value (or `false` for writes), and a single warn is emitted explaining the most likely causes.

```ts
const storage = inject(WebStorageService);

// In Safari private mode this returns 'fallback' instead of crashing
const theme = storage.local.get<'dark' | 'light'>('theme', 'fallback');
```

The probe result is cached, so `isSupported()` and every subsequent read pay no extra cost.

## Unified API: namespaces

The public API now exposes two `StorageNamespace` instances sharing one method surface:

```ts
storage.local.set('user', { id: 1 });
storage.local.get<{ id: number }>('user');
storage.local.remove('user');
storage.local.clear({ prefix: 'app' });
storage.local.size({ prefix: 'app' });
storage.local.watch<{ id: number }>('user').subscribe(console.log);

storage.session.set('draft', { title: '...' });
// ...same surface for sessionStorage
```

Both namespaces share one event bus, so cross-tab `StorageEvent`s and same-tab mutations flow through the same `getStorageEvents()` stream.

## Backward compatibility

The old methods (`setLocalStorage`, `getLocalStorage`, `setSessionStorage`, ...) remain as deprecated wrappers calling into the namespaces. First call logs a one-time deprecation warn. Removal slated for **v22**.

## Coverage

`storage-namespace.spec.ts` covers:

- set/get round-trip with JSON serialization
- default value when key missing
- SecurityError fallback (every method returns the safe default + warn)
- `isSupported()` caching (probe runs only once)
- prefix scoping on set/get/remove/size/clear
- event emission on set/remove/clear
- deserialize raw-string fallback when JSON.parse fails

## Roadmap

PR2 of 8. Up next: PR3 standardizing the `isSupported()` / `ensureSupported()` pattern across the 30 services.
