[Leer en Español](./README.es.md)

# @angular-helpers/worker-http

Move HTTP requests off the main thread. A composable toolkit for Angular that runs `fetch()` inside Web Workers, protecting your UI from network latency while adding security primitives (HMAC signing, content integrity, rate limiting) that live entirely in the worker's isolated scope.

---

## Why?

Every `HttpClient` request blocks a shared thread budget. When a slow API stalls, your animations stutter and user interactions queue up. Web Workers solve this at the architecture level: they run on a separate OS thread, so a 2-second network call costs the main thread nothing.

On top of that, workers provide a natural isolation boundary for security-sensitive logic: HMAC keys, request signing, and content verification never touch the main thread's memory.

---

## Package map

| Entry point                                     | Description                                                      | Status       |
| ----------------------------------------------- | ---------------------------------------------------------------- | ------------ |
| `@angular-helpers/worker-http/transport`        | Typed RPC bridge, round-robin pool, cancellation                 | ✅ Available |
| `@angular-helpers/worker-http/serializer`       | Pluggable serialization (structured clone, seroval, auto-detect) | ✅ Available |
| `@angular-helpers/worker-http/interceptors`     | Pure-function interceptor pipeline for workers                   | ✅ Available |
| `@angular-helpers/worker-http/crypto`           | WebCrypto primitives (HMAC, AES-GCM, SHA hashing)                | ✅ Available |
| `@angular-helpers/worker-http/backend`          | Angular `HttpBackend` replacement — `provideWorkerHttpClient()`  | ✅ Available |
| `@angular-helpers/worker-http/esbuild-plugin`   | esbuild plugin for auto-bundling interceptors into workers       | ✅ Available |
| `@angular-helpers/worker-http/streams-polyfill` | Safari streams ponyfill for transferable stream support          | ✅ Available |

---

## Architecture at a glance

```
Main thread                          Web Worker
────────────────────────────         ──────────────────────────────────
Angular HttpClient                   createWorkerPipeline([
  └─ WorkerHttpBackend                 loggingInterceptor(),
       └─ WorkerTransport              retryInterceptor({ maxRetries: 3 }),
            └─ postMessage   ───────►  hmacSigningInterceptor({ keyMaterial }),
                             ◄───────  cacheInterceptor({ ttl: 60000 }),
                             transfer ])
                             (zero-copy)
                                     fetch() ──► API Server
```

---

## Installation

### Quick setup with ng-add

The easiest way to get started is using the Angular CLI schematic:

```bash
ng add @angular-helpers/worker-http
```

This will:

1. Install the package
2. Create a worker file at `src/app/workers/http-api.worker.ts`
3. Update `tsconfig.json` with webworker lib
4. Add `provideWorkerHttpClient()` to your `app.config.ts`

**Options:**

```bash
# Custom worker path
ng add @angular-helpers/worker-http --workerPath=src/workers/api.worker.ts

# Configure esbuild plugin (for custom build setups)
ng add @angular-helpers/worker-http --installEsbuildPlugin=true
```

### Manual installation

```bash
npm install @angular-helpers/worker-http
```

Then follow the setup in the `/backend` section below.

---

## Entry points

### `/transport` — Typed RPC bridge

A framework-agnostic, type-safe bridge between the main thread and a Web Worker. Wraps `postMessage` with request/response correlation, Observable API, and automatic cancellation on unsubscribe.

<details>
<summary><strong>API and examples</strong></summary>

```typescript
import { createWorkerTransport } from '@angular-helpers/worker-http/transport';

const transport = createWorkerTransport({
  workerUrl: new URL('./workers/api.worker', import.meta.url),
  maxInstances: 2,
});

// Returns Observable — unsubscribe sends a cancel message to the worker
const response$ = transport.execute(request);

// Clean up
transport.terminate();
```

**Features:**

- Round-robin pool (`maxInstances`) for parallel request handling
- Lazy worker instantiation — no worker created until first request
- **Cancellation that actually aborts `fetch()`** — unsubscribing posts a
  cancel message; the worker-side message loop threads an `AbortSignal` all
  the way into `fetch()` so the in-flight HTTP request is truly aborted
- **Per-request timeout** (default `30_000` ms) via `requestTimeout`; errors
  with `WorkerHttpTimeoutError` and sends a cancel message to the worker.
  Set to `0` to disable.
- **Opt-in transferable detection** via `transferDetection: 'auto'` — passes
  detected `ArrayBuffer` / `MessagePort` / `ImageBitmap` /
  `OffscreenCanvas` / streams as the transfer list of `postMessage`, enabling
  zero-copy transfer of large buffers. Default is `'none'` to preserve the
  caller's access to the original data after post.

```typescript
import {
  createWorkerTransport,
  WorkerHttpTimeoutError,
} from '@angular-helpers/worker-http/transport';

const transport = createWorkerTransport({
  workerUrl: new URL('./workers/api.worker', import.meta.url),
  maxInstances: 2,
  requestTimeout: 10_000, // override default 30 s
  transferDetection: 'auto', // zero-copy ArrayBuffer at postMessage
});

transport.execute(request).subscribe({
  error: (err) => {
    if (err instanceof WorkerHttpTimeoutError) {
      // dedicated timeout handling
    }
  },
});
```

</details>

---

### `/interceptors` — Worker-side pipeline

Pure-function interceptors that run inside the worker. No Angular DI, no DOM access — just `(req, next) => Promise<response>`.

<details>
<summary><strong>Setup, built-in interceptors, and custom interceptors</strong></summary>

#### Setup in your worker file

```typescript
// workers/secure.worker.ts
import { createWorkerPipeline } from '@angular-helpers/worker-http/interceptors';
import {
  hmacSigningInterceptor,
  retryInterceptor,
  loggingInterceptor,
} from '@angular-helpers/worker-http/interceptors';

createWorkerPipeline([
  loggingInterceptor(),
  retryInterceptor({ maxRetries: 3, initialDelay: 500 }),
  hmacSigningInterceptor({
    keyMaterial: new TextEncoder().encode(self.HMAC_SECRET),
    headerName: 'X-HMAC-Signature',
  }),
]);
```

#### Available interceptors

##### `retryInterceptor(config?)`

Retries failed requests with exponential backoff. Respects the `Retry-After` header.

```typescript
retryInterceptor({
  maxRetries: 3, // default: 3 (0 = disabled, returns response as-is)
  initialDelay: 1000, // ms, default: 1000
  backoffMultiplier: 2, // default: 2 → delays: 1s, 2s, 4s
  retryStatusCodes: [408, 429, 500, 502, 503, 504], // default list
  retryOnNetworkError: true, // retry on fetch() throws (default: true)
});
```

##### `cacheInterceptor(config?)`

In-worker response cache. State is per-factory-instance and resets when the worker is terminated.

```typescript
cacheInterceptor({
  ttl: 60000, // ms, default: 60000 (1 min). 0 = never cache
  maxEntries: 100, // default: 100. Eviction: FIFO (insertion order)
  methods: ['GET'], // default: ['GET']
});
```

##### `hmacSigningInterceptor(config)`

Signs outgoing requests with HMAC-SHA256/384/512 via the native WebCrypto API. The `CryptoKey` is imported once per factory instance and reused across requests.

```typescript
hmacSigningInterceptor({
  keyMaterial: rawKeyBytes, // ArrayBuffer | Uint8Array
  algorithm: 'SHA-256', // default: 'SHA-256'
  headerName: 'X-HMAC-Signature', // default: 'X-HMAC-Signature'
  payloadBuilder: (
    req, // optional: what to sign
  ) => `${req.method}:${req.url}:${JSON.stringify(req.body)}`,
});
```

##### `loggingInterceptor(config?)`

Logs request/response to `console.log` (or a custom logger). Logger exceptions are swallowed — a logging failure never interrupts the pipeline.

```typescript
loggingInterceptor({
  logger: (msg, data) => myMonitoring.log(msg, data), // default: console.log
  includeHeaders: false, // default: false
});
// Output: [worker] → GET https://api.example.com (0ms)
//         [worker] ← 200 https://api.example.com (47ms)
```

##### `rateLimitInterceptor(config?)`

Client-side sliding-window rate limiter. Throws `{ status: 429 }` when the limit is exceeded.

```typescript
rateLimitInterceptor({
  maxRequests: 100, // default: 100
  windowMs: 60000, // default: 60000 (1 min)
});
```

##### `contentIntegrityInterceptor(config?)`

Verifies the SHA-256 hash of the response body against a server-provided header. Useful when the server signs responses.

```typescript
contentIntegrityInterceptor({
  algorithm: 'SHA-256', // default: 'SHA-256'
  headerName: 'X-Content-Hash', // default: 'X-Content-Hash'
  requireHash: false, // default: false. true = throw if header absent
});
```

##### `composeInterceptors(...fns)`

Composes multiple interceptors into a single `WorkerInterceptorFn`. Interceptors run left-to-right.

```typescript
import { composeInterceptors } from '@angular-helpers/worker-http/interceptors';

const securityLayer = composeInterceptors(
  rateLimitInterceptor({ maxRequests: 50 }),
  hmacSigningInterceptor({ keyMaterial }),
  contentIntegrityInterceptor({ requireHash: true }),
);

createWorkerPipeline([loggingInterceptor(), securityLayer]);
```

#### Custom interceptors

Implement `WorkerInterceptorFn` — a pure function with no external dependencies:

```typescript
import type { WorkerInterceptorFn } from '@angular-helpers/worker-http/interceptors';

export const authTokenInterceptor: WorkerInterceptorFn = (req, next) => {
  return next({
    ...req,
    headers: { ...req.headers, Authorization: [`Bearer ${TOKEN}`] },
  });
};
```

</details>

---

### `/serializer` — Pluggable serialization

Handles the `postMessage` serialization boundary. Three strategies, each with a clear sweet spot:

- `structuredCloneSerializer` — zero overhead, default
- `createToonSerializer()` — 30–60% smaller for uniform arrays of objects
- `createSerovalSerializer()` — full type fidelity (`Date`, `Map`, `Set`, circular refs)

The auto-serializer picks the best strategy per payload.

<details>
<summary><strong>Per-strategy API and examples</strong></summary>

#### `structuredCloneSerializer` (default)

Zero-overhead. Uses the browser's native structured clone algorithm. Best for simple objects and primitives.

```typescript
import { structuredCloneSerializer } from '@angular-helpers/worker-http/serializer';
// No setup needed — this is the default when no serializer is configured.
```

#### `createSerovalSerializer()` — Full type fidelity

Requires `seroval` as an optional peer dependency (`npm install seroval`).

Supports: `Date`, `Map`, `Set`, `BigInt`, `RegExp`, circular references, and more.

```typescript
import { createSerovalSerializer } from '@angular-helpers/worker-http/serializer';

// Factory is async — pre-loads the seroval module
const serializer = await createSerovalSerializer();

const payload = serializer.serialize({ date: new Date(), tags: new Set(['a', 'b']) });
const original = serializer.deserialize(payload);
// original.date instanceof Date → true
// original.tags instanceof Set → true
```

#### `createToonSerializer()` — Token-Oriented Object Notation

Requires `@toon-format/toon` as an optional peer dependency (`npm install @toon-format/toon`).

[TOON](https://toonformat.dev) declares object keys once and emits values as CSV-like rows. For uniform arrays of objects (the most common API response shape — `User[]`, `Product[]`, paginated lists), it cuts payload size by **30–60%** compared to JSON, with negligible parsing overhead.

```typescript
import { createToonSerializer } from '@angular-helpers/worker-http/serializer';

const serializer = await createToonSerializer();

const payload = serializer.serialize([
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'member' },
  { id: 3, name: 'Carol', role: 'member' },
  { id: 4, name: 'Dave', role: 'guest' },
  { id: 5, name: 'Eve', role: 'admin' },
]);

// payload.data is a TOON string:
//   [5]{id,name,role}:
//     1,Alice,admin
//     2,Bob,member
//     3,Carol,member
//     4,Dave,guest
//     5,Eve,admin
```

**When TOON shines**: uniform arrays of objects with primitive values (numbers, strings, booleans, nulls) at depth-1.

**When TOON does NOT help**: payloads with `Date`, `Map`, `Set`, nested objects, or single objects — use `seroval` or structured clone instead.

#### `createAutoSerializer()` — Smart auto-detection

Automatically picks the best strategy per payload. The factory is async (pre-loads `seroval` and `@toon-format/toon` during initialization, both optional), but the returned serializer is fully synchronous.

**Detection logic (depth-1, top-down, first match wins):**

1. Contains `Date`, `Map`, `Set`, or `RegExp` at the top level or as direct array/object values → `seroval`
2. Uniform array of plain objects with primitive values, length ≥ 5 → `toon`
3. Otherwise → structured clone (zero overhead)

The TOON threshold is conservative (length ≥ 5). Smaller arrays don't justify the encoding overhead.

Payloads larger than `transferThreshold` (default: 100 KiB) are encoded to `ArrayBuffer` and transferred zero-copy.

```typescript
import { createAutoSerializer } from '@angular-helpers/worker-http/serializer';

const auto = await createAutoSerializer({
  transferThreshold: 102400, // bytes, default: 100 KiB
});

// Simple object → structured-clone (no overhead)
auto.serialize({ id: 1, name: 'Alice' }); // format: 'structured-clone'

// Object with Date → seroval (type fidelity)
auto.serialize({ createdAt: new Date() }); // format: 'seroval'

// Large payload → ArrayBuffer transfer (zero-copy)
auto.serialize(hugeDataset); // transferables: [ArrayBuffer]
```

> **Depth-1 limitation**: `[{ createdAt: new Date() }]` — the `Date` is inside a nested object; not detected at depth-1. For deeply nested complex types, use `createSerovalSerializer()` directly.

</details>

---

### `/crypto` — WebCrypto primitives

Standalone WebCrypto utilities. Useful in both workers and the main thread, but workers provide memory isolation for key material.

<details>
<summary><strong>HMAC, AES, hashing examples</strong></summary>

#### `createHmacSigner(config)`

```typescript
import { createHmacSigner } from '@angular-helpers/worker-http/crypto';

const signer = await createHmacSigner({
  keyMaterial: rawKeyBytes,
  algorithm: 'SHA-256', // default
});

const signature = await signer.sign('GET:/api/users:');
const isValid = await signer.verify('GET:/api/users:', signature);
```

#### `createAesEncryptor(config)`

```typescript
import { createAesEncryptor } from '@angular-helpers/worker-http/crypto';

const encryptor = await createAesEncryptor({ keyLength: 256 });

const { ciphertext, iv } = await encryptor.encrypt('sensitive data');
const plaintext = await encryptor.decrypt(ciphertext, iv);
```

#### `createContentHasher()`

```typescript
import { createContentHasher } from '@angular-helpers/worker-http/crypto';

const hasher = createContentHasher();
const hash = await hasher.hash('SHA-256', data); // → hex string
```

</details>

---

### `/backend` — Angular `HttpBackend` replacement

Drop-in replacement for Angular's `HttpBackend` that transparently routes `HttpClient` requests to Web Workers. Use `WorkerHttpClient` exactly like `HttpClient` — the routing is invisible to application code.

<details>
<summary><strong>Configuration, providers, and consumer code</strong></summary>

```typescript
// app.config.ts
import {
  provideWorkerHttpClient,
  withWorkerConfigs,
  withWorkerRoutes,
  withWorkerFallback,
  withWorkerSerialization,
  withWorkerInterceptors,
} from '@angular-helpers/worker-http/backend';
import { createSerovalSerializer } from '@angular-helpers/worker-http/serializer';
import { workerLogging, workerRetry, workerCache } from '@angular-helpers/worker-http/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideWorkerHttpClient(
      withWorkerConfigs([
        {
          id: 'api',
          workerUrl: new URL('./workers/api.worker', import.meta.url),
          maxInstances: 2, // round-robin pool
        },
        {
          id: 'secure',
          workerUrl: new URL('./workers/secure.worker', import.meta.url),
        },
      ]),
      withWorkerRoutes([
        { pattern: /\/api\/secure\//, worker: 'secure', priority: 10 },
        { pattern: /\/api\//, worker: 'api', priority: 5 },
      ]),
      withWorkerFallback('main-thread'), // SSR-safe
      withWorkerSerialization(createSerovalSerializer()), // optional: complex bodies
      withWorkerInterceptors([
        workerLogging(),
        workerRetry({ maxRetries: 3 }),
        workerCache({ ttl: 60000 }),
      ]),
    ),
  ],
};

// data.service.ts — WorkerHttpClient is a drop-in for HttpClient
export class DataService {
  private http = inject(WorkerHttpClient);

  getUsers() {
    return this.http.get<User[]>('/api/users'); // auto-routed to 'api' worker
  }

  getSecureData() {
    // per-request override via { worker } option or WORKER_TARGET context token
    return this.http.get('/api/secure/payments', { worker: 'secure' });
  }
}

// workers/api.worker.ts — runs on a separate OS thread
import { createConfigurableWorkerPipeline } from '@angular-helpers/worker-http/interceptors';

// The pipeline is built at runtime from the specs configured via
// `withWorkerInterceptors([...])` in `app.config.ts`. Custom interceptors
// not covered by the built-in catalogue can be wired in here:
//
//   import { registerInterceptor } from '@angular-helpers/worker-http/interceptors';
//   registerInterceptor('auth-token', (config) => async (req, next) => { ... });
//
// then referenced from the main thread with `workerCustom('auth-token', config)`.
createConfigurableWorkerPipeline();
```

If you prefer to keep the pipeline composition inside the worker file, use
`createWorkerPipeline([interceptors])` instead — it stays available for full
manual control.

**Features:**

- `provideWorkerHttpClient(...features)` — replaces `provideHttpClient()`; do not use both
- `withWorkerConfigs(configs)` — register named workers with optional pool size
- `withWorkerRoutes(routes)` — URL-pattern routing with priority ordering
- `withWorkerFallback(strategy)` — `'main-thread'` (SSR-safe) or `'error'`
- `withWorkerSerialization(serializer)` — plug in `createSerovalSerializer()` for complex request bodies (`Date`, `Map`, `Set`)
- `withWorkerInterceptors(specs | specsByWorker)` — configure the worker-side pipeline from Angular DI; pairs with `createConfigurableWorkerPipeline()` in the worker file
- `WORKER_TARGET` — `HttpContextToken<string | null>` for per-request worker routing via `HttpContext`
- `WorkerHttpClient` — `HttpClient` wrapper with optional `{ worker: string }` routing field
- `WorkerHttpBackend` — the `HttpBackend` implementation (injectable for advanced use)
- `matchWorkerRoute(url, routes)` — pure utility to test routing rules

</details>

---

## Telemetry

Main-thread extension point for APM / metrics. `withTelemetry(...)` registers a subscriber that fires synchronously at three lifecycle points of every request handled by `WorkerHttpBackend` (`onRequest`, `onResponse`, `onError`).

<details>
<summary><strong>Subscriber semantics, examples, and event interface</strong></summary>

Lifecycle points:

- **`onRequest`** — after worker resolution, before dispatch
- **`onResponse`** — when a successful response is emitted
- **`onError`** — when the request fails (transport or non-2xx)

Events share a `requestId` so you can correlate the three emissions for one
request. `transport` is `'worker'` or `'fallback-fetch'` (SSR /
no-route). Errors in your subscriber are caught and logged — they **never**
affect the actual HTTP request.

Call `withTelemetry(...)` multiple times to attach independent subscribers
(e.g. one for Sentry, one for custom metrics). All subscribers receive every
event in registration order.

```ts
provideWorkerHttpClient(
  withWorkerConfigs([{ id: 'api', workerUrl: new URL('./workers/api.worker', import.meta.url) }]),
  withWorkerRoutes([{ pattern: /\/api\//, worker: 'api' }]),

  // Latency histogram
  withTelemetry({
    onResponse: (e) =>
      histogram.record(e.durationMs, {
        workerId: e.workerId,
        status: e.status,
        transport: e.transport,
      }),
    onError: (e) =>
      histogram.record(e.durationMs, {
        workerId: e.workerId,
        status: 'error',
      }),
  }),

  // Sentry breadcrumbs
  withTelemetry({
    onRequest: (e) =>
      Sentry.addBreadcrumb({
        category: 'worker-http',
        message: `${e.method} ${e.url}`,
        data: { requestId: e.requestId, workerId: e.workerId },
      }),
    onError: (e) =>
      Sentry.captureException(e.error, {
        tags: { workerId: e.workerId ?? 'fallback' },
      }),
  }),
);
```

Event interface:

```ts
interface WorkerHttpTelemetryEventBase {
  readonly requestId: string; // unique per request, correlates events
  readonly method: string;
  readonly url: string;
  readonly urlWithParams: string;
  readonly workerId: string | null; // null = fallback fetch
  readonly transport: 'worker' | 'fallback-fetch';
  readonly timestamp: number; // performance.now() at emission
}
// onResponse adds: kind: 'response', status, durationMs
// onError    adds: kind: 'error',    error,  durationMs
```

</details>

---

### `/esbuild-plugin` — Interceptor auto-bundling

An esbuild plugin that automatically discovers and bundles interceptor files into your worker builds. When using Angular with a custom webpack/esbuild configuration, this ensures your interceptors are included in the worker bundle without manual imports.

<details>
<summary><strong>Plugin options and example</strong></summary>

```typescript
// esbuild.config.ts
import { workerHttpPlugin } from '@angular-helpers/worker-http/esbuild-plugin';

export default {
  plugins: [
    workerHttpPlugin({
      // Explicit interceptors (relative to project root)
      interceptors: ['./src/interceptors/auth.ts', './src/interceptors/logging.ts'],

      // Or auto-discover all files matching interceptor naming pattern
      autoDiscover: true,
    }),
  ],
};
```

**Options:**

| Option         | Type       | Default | Description                                            |
| -------------- | ---------- | ------- | ------------------------------------------------------ |
| `interceptors` | `string[]` | `[]`    | Explicit list of interceptor paths to bundle           |
| `autoDiscover` | `boolean`  | `false` | Scan `src/` for files matching `*interceptor*` pattern |

Discovered interceptors are merged with explicit ones. Test files (`.spec.ts`, `.test.ts`) are automatically excluded.

</details>

---

### `/streams-polyfill` — Safari transferable streams

Safari 16-17 lack native transferable `ReadableStream`/`TransformStream` support. This ponyfill enables stream transfer in workers for those browsers, loaded lazily only when needed.

<details>
<summary><strong>Setup and bundle impact</strong></summary>

```typescript
// Enable in your app config (main thread)
import { withWorkerStreamsPolyfill } from '@angular-helpers/worker-http/backend';

provideWorkerHttpClient(
  withWorkerConfigs([...]),
  withWorkerStreamsPolyfill(), // Enable Safari 16-17 compatibility
);
```

**When to use:**

- Your app uses `responseType: 'stream'` and targets Safari 16-17
- You see `DataCloneError` when transferring streams to/from workers

**Bundle impact:** Zero for modern browsers. The polyfill is lazy-loaded only on affected Safari versions when streams are actually used.

</details>

---

## SSR + hydration

Worker HTTP integrates transparently with Angular SSR. SSR's two problems for worker-based HTTP — missing `Worker` global on the server and the post-hydration re-fetch — are both handled out of the box.

<details>
<summary><strong>How SSR fallback and the transfer cache work</strong></summary>

**1. Workers do not exist on the server.**
During SSR, `typeof Worker === 'undefined'`. `WorkerHttpBackend` detects this
and falls back to `FetchBackend` automatically (controlled by
`withWorkerFallback()`). The request is fulfilled on the server thread
exactly like a plain `HttpClient.get()` would do.

**2. Avoiding a re-fetch after hydration.**
Add `provideClientHydration()` from `@angular/platform-browser` at the app
root (standard Angular SSR setup). That enables Angular's HTTP transfer
cache by default. The transfer cache interceptor sits in the `HttpClient`
pipeline — **before** `WorkerHttpBackend`:

- On the server: `WorkerHttpBackend` falls back to fetch → returns a
  response → the interceptor captures it into `TransferState`.
- On the browser: a matching request hits the interceptor first → it replays
  the cached response synchronously, **without ever reaching
  `WorkerHttpBackend`**. No worker is booted for hydrated requests.

```ts
// app.config.server.ts (or your SSR bootstrap)
export const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideWorkerHttpClient(
      withWorkerConfigs([
        { id: 'api', workerUrl: new URL('./workers/api.worker', import.meta.url) },
      ]),
    ),
  ],
};

// app.config.ts (browser bootstrap)
export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(), // ← enables HTTP transfer cache automatically
    provideWorkerHttpClient(
      withWorkerConfigs([
        { id: 'api', workerUrl: new URL('./workers/api.worker', import.meta.url) },
      ]),
    ),
  ],
};
```

To customise which headers are captured or to cache `POST` requests, pass
`withHttpTransferCacheOptions(...)` to `provideClientHydration()` — both are
re-exported from `@angular/platform-browser`.

</details>

---

## Design principles

- **Zero main-thread cost** — `fetch()` runs entirely in the worker; the main thread only handles the `postMessage` handoff
- **Black box** — developers use `HttpClient` as normal; workers are an implementation detail
- **Pure-function interceptors** — no Angular DI, no DOM, no closures over mutable state; fully testable without a browser
- **Composable** — use only the sub-packages you need; each is independently useful
- **SSR-safe** — `typeof Worker === 'undefined'` falls back to a standard `FetchBackend` automatically

---

## Serialization strategy decision guide

| Payload type                               | Recommended serializer                 | Reason                      |
| ------------------------------------------ | -------------------------------------- | --------------------------- |
| Simple objects, arrays of primitives       | `structuredCloneSerializer` (default)  | Zero overhead               |
| Uniform array of plain objects (≥ 5 items) | `createToonSerializer()`               | 30–60% size reduction       |
| Objects with `Date`, `Map`, `Set`          | `createSerovalSerializer()`            | Full type fidelity          |
| Unknown payload shape                      | `createAutoSerializer()`               | Depth-1 auto-detect         |
| Large arrays (> 100 KiB)                   | `createAutoSerializer()`               | Auto ArrayBuffer transfer   |
| Deeply nested complex types                | `createSerovalSerializer()` explicitly | Auto-detect is depth-1 only |

---

## Browser support

All features require a browser that supports:

- **Web Workers** — all modern browsers (Chrome 4+, Firefox 3.5+, Safari 4+)
- **WebCrypto (`crypto.subtle`)** — requires HTTPS (or `localhost`)
- **`Transferable` objects** — `ArrayBuffer` transfer supported in all modern browsers

Server-Side Rendering (SSR) is supported via automatic fallback to the main thread.

---

## Benchmarks

A reproducible benchmark suite ships with the demo app at [`/demo/worker-http-benchmark`](../../src/app/demo/worker-http-benchmark).

<details>
<summary><strong>Modes, workloads, metrics, and how to run</strong></summary>

It compares three transport modes across four workloads:

| Mode            | What it measures                                           |
| --------------- | ---------------------------------------------------------- |
| `main-thread`   | Baseline — the same simulated work runs on the main thread |
| `worker-pool-1` | Single worker — measures pure transport overhead           |
| `worker-pool-4` | Four workers — measures the benefit of parallel dispatch   |

Each scenario simulates identical "server" work (synchronous CPU burn + async delay + payload
generation), so the only variable being compared is **where** the work runs.

**Workloads**:

- 100 small sequential requests — pure transport overhead
- 1 large response (10MB) — serialization / structured clone cost
- 50 parallel requests — pool benefit
- 20 parallel requests + 500ms main-thread CPU burn — real-world jank case

**Metrics collected**:

- **Long Tasks** (`PerformanceObserver` / `longtask`) — count and total duration (Chromium-only)
- **Dropped frames** (`requestAnimationFrame` deltas > 25 ms) — visible jank proxy, works in every browser
- **Wall-clock total** for the scenario
- **Success / failure** counts

To run locally:

```bash
npm run build:workers
npm start
# open https://localhost:4200/demo/worker-http-benchmark
```

Numbers vary by hardware, browser, and current system load — always run a scenario several times
and watch the trend, not a single value.

</details>

---

## Related documentation

- [Architecture & Feasibility Study](../../docs/sdd-angular-http-web-workers.md)
- [Deep Research: Serialization, Transferables, Benchmarks](../../docs/research/http-worker-deep-research.md)
- [Product Breakdown](../../docs/research/http-worker-product-breakdown.md)
