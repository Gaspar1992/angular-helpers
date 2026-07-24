---
title: 'browser-web-apis v21.10: Web Locks, Storage Manager, Compression Streams'
publishedAt: '2026-04-18'
tags: ['browser-web-apis', 'web-locks', 'storage', 'compression', 'angular']
excerpt: 'Three new services land: WebLocksService coordinates exclusive access across tabs and workers, StorageManagerService exposes quota estimates and persistence requests, and CompressionService wraps CompressionStream/DecompressionStream for gzip/deflate.'
---

# Three more web platform APIs, wrapped

`v21.10` of `@angular-helpers/browser-web-apis` ships three small services for capabilities that have been shipping in browsers for a while but were missing first-class Angular wrappers.

## WebLocksService — coordinate critical sections across tabs

```ts
const locks = inject(WebLocksService);

await locks.acquire('user-cache', async () => {
  // Critical section. No other tab or worker is in this block at the same time.
  const cache = await loadCache();
  cache.lastSeen = Date.now();
  await saveCache(cache);
});
```

Behind the scenes: `navigator.locks.request(name, callback)`. Lock is released when the callback resolves or rejects. Pass `{ mode: 'shared' }` for read-only access, `{ ifAvailable: true }` to skip if already held, `{ steal: true }` to break an existing lock.

`locks.query()` returns a snapshot of held + pending locks for diagnostics.

## StorageManagerService — persistent storage and quotas

```ts
const sm = inject(StorageManagerService);

const { usage, quota } = await sm.estimate();
console.log(
  `Using ${(usage / 1024 / 1024).toFixed(1)} MB of ${(quota / 1024 / 1024).toFixed(1)} MB`,
);

if (!(await sm.persisted())) {
  await sm.persist(); // Ask the browser to make storage eviction-protected.
}
```

`estimate()` returns `{ usage, quota, usageDetails? }`. `persist()` is a request — the browser may grant or deny based on heuristics. `persisted()` reads the current state.

## CompressionService — gzip and deflate without a dependency

```ts
const cmp = inject(CompressionService);

const compressed = await cmp.compressString(JSON.stringify(payload), 'gzip');
// → Uint8Array, ~5x smaller for typical JSON

const restored = JSON.parse(await cmp.decompressString(compressed, 'gzip'));
```

Backed by `CompressionStream`/`DecompressionStream`. Supports `'gzip'`, `'deflate'`, `'deflate-raw'`. The byte versions (`compress` / `decompress`) accept and return `Uint8Array`; the string versions wrap UTF-8 encoding/decoding.

## Capability registry

Three new ids registered in `BrowserCapabilityService`: `webLocks`, `storageManager`, `compressionStreams`. They show up in `getAllStatuses()` along with the rest.

## Providers

```ts
provideBrowserWebApis({
  // ...existing config
});

// Or, à la carte:
provideWebLocks();
provideStorageManager();
provideCompression();
```

## Roadmap

PR7 of 8. Up next: PR8 — `@experimental` policy, logger levels, and composition-first providers.
