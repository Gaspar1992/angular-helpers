# Product Breakdown: Angular HTTP Web Workers

> Date: 2026-03-31  
> Status: Draft  
> Parent document: [SDD — Angular HTTP over Web Workers](../sdd-angular-http-web-workers.md)

---

## Rationale

The full vision (configurable interceptor pipelines in multiple workers with Angular-compatible API) is too complex for a single monolithic package. Breaking it into **independent, composable packages** provides:

- Incremental delivery — each package is useful on its own
- Lower adoption barrier — teams pick only what they need
- Independent versioning and testing
- Clearer responsibility boundaries

---

## Package Map

```
@angular-helpers/
├── worker-transport        ← P1: Core postMessage bridge (black box)
├── worker-serializer       ← P2: Pluggable serialization (TOON, seroval, etc.)
├── worker-http-backend     ← P3: Angular HttpBackend replacement
├── worker-interceptors     ← P4: Build-time interceptor pipeline for workers
└── worker-crypto           ← P5: WebCrypto security primitives in workers
```

---

## P1: `@angular-helpers/worker-transport`

**The foundation.** A framework-agnostic, type-safe RPC bridge between main thread and web workers.

### Scope

- Typed `postMessage` wrapper with request/response correlation (`requestId`)
- Automatic `Transferable` detection and zero-copy transfer for `ArrayBuffer`
- Request cancellation via cancel-message + `AbortController` in worker
- Worker lifecycle management (lazy creation, termination, health monitoring)
- `MessagePort`-per-request option for isolation
- Observable-based API (returns `Observable`, teardown sends cancel)

### Does NOT include

- Angular DI integration
- HTTP-specific logic
- Serialization beyond structured clone (that's P2)

### Public API sketch

```typescript
// Create a typed transport to a worker
const transport = createWorkerTransport<RequestType, ResponseType>({
  workerUrl: new URL('./my.worker', import.meta.url),
  maxInstances: 2, // optional pool
  transferDetection: 'auto',
});

// Send a request — returns Observable
const result$ = transport.execute(request);

// Teardown (unsubscribe cancels the request in the worker)
subscription.unsubscribe();

// Lifecycle
transport.terminate();
```

### Dependencies

- `rxjs` (peer)
- Zero other dependencies

---

## P2: `@angular-helpers/worker-serializer`

**Pluggable serialization layer** for crossing the worker boundary. Handles the structured clone limitations.

### Scope

- `WorkerSerializer` interface with `serialize()` / `deserialize()` methods
- Built-in implementations:
  - `StructuredCloneSerializer` — default, zero overhead, uses native `postMessage`
  - `ToonSerializer` — TOON format for uniform arrays, key deduplication, smaller payloads
  - `SerovalSerializer` — full type fidelity (`Date`, `Map`, `Set`, circular refs)
- Auto-strategy: detects payload shape and picks the best serializer
  - Uniform array of objects → TOON
  - Complex types (`Date`, `Map`) → seroval
  - Small/simple → structured clone (no serialization step)
- Encode-to-`ArrayBuffer` + transfer for large payloads

### Public API sketch

```typescript
export interface WorkerSerializer {
  serialize(data: unknown): SerializedPayload;
  deserialize(payload: SerializedPayload): unknown;
}

export interface SerializedPayload {
  data: unknown; // serialized form
  transferables?: Transferable[]; // ArrayBuffers to transfer
  format: 'structured-clone' | 'toon' | 'seroval' | 'custom';
}

// Built-in
export const toonSerializer: WorkerSerializer;
export const serovalSerializer: WorkerSerializer;
export const autoSerializer: WorkerSerializer; // picks best per payload
```

### Dependencies

- `@byjohann/toon` (optional peer — only if ToonSerializer used)
- `seroval` (optional peer — only if SerovalSerializer used)

---

## P3: `@angular-helpers/worker-http-backend`

**The Angular integration layer.** Replaces `HttpBackend` with a worker-backed implementation. This is the "black box" — the developer uses `HttpClient` as normal.

### Scope

- `WorkerHttpBackend` implementing Angular's `HttpBackend`
- `provideWorkerHttpClient(...features)` — mirrors `provideHttpClient()`
- `withWorkerConfigs()`, `withWorkerRoutes()`, `withWorkerFallback()`
- `withWorkerSerialization()` — plugs in P2 serializers
- `WORKER_TARGET` `HttpContextToken` for per-request worker selection
- `WorkerHttpClient` — convenience wrapper with `{ worker: 'id' }` option
- Automatic SSR fallback (`typeof Worker === 'undefined'` → `FetchBackend`)
- `HttpErrorResponse` reconstruction from worker errors
- `DestroyRef`-based worker lifecycle

### Black-box principle

The developer writes:

```typescript
// app.config.ts — config looks Angular-native
provideWorkerHttpClient(
  withWorkerConfigs([
    { id: 'secure', workerUrl: new URL('./workers/secure.worker', import.meta.url) },
  ]),
  withWorkerRoutes([{ pattern: /\/api\/secure\//, worker: 'secure' }]),
  withWorkerFallback('main-thread'),
);

// data.service.ts — identical to normal HttpClient usage
this.http.get<Report>('/api/secure/reports');
```

Everything below that (`postMessage`, serialization, worker lifecycle, cancellation) is invisible.

### Build-time transpilation

Like Angular CLI does with `ng generate web-worker` (generates the worker file + updates `angular.json`), this package provides:

- **Schematic**: `ng generate @angular-helpers/worker-http-backend:worker secure` → generates `workers/secure.worker.ts` with the correct boilerplate
- **esbuild plugin** (or Angular builder integration): at build time, reads the worker config and bundles the interceptor pipeline into the worker file automatically
- The developer writes interceptor config in Angular-land; the build tool produces the worker bundle

```
Developer writes:                     Build tool generates:
─────────────────                     ─────────────────────
withWorkerConfigs([{                  workers/secure.worker.ts
  id: 'secure',                       ├── import { createWorkerPipeline }
  interceptors: [hmac, validate],     ├── import { hmac, validate }
}])                                   └── createWorkerPipeline([hmac, validate])
```

### Dependencies

- `@angular/common/http` (peer)
- `@angular-helpers/worker-transport` (P1)
- `@angular-helpers/worker-serializer` (P2, optional)

---

## P4: `@angular-helpers/worker-interceptors`

**Pre-built pure-function interceptors** designed to run inside workers. Each is independent and composable.

### Scope

- `WorkerInterceptorFn` type definition (pure function, no DI, no DOM)
- Built-in interceptors:
  - `hmacSigningInterceptor` — HMAC-SHA256 request signing via WebCrypto
  - `schemaValidationInterceptor` — JSON Schema validation of responses
  - `retryInterceptor` — retry with exponential backoff
  - `cacheInterceptor` — in-worker response caching (Map-based or IndexedDB)
  - `loggingInterceptor` — structured logging for debugging
  - `rateLimitInterceptor` — client-side rate limiting
  - `contentIntegrityInterceptor` — SHA-256 verification of response body
- Interceptor composition: `composeInterceptors(...fns)` utility
- `createWorkerPipeline(interceptors)` — the worker-side entry point

### Public API sketch

```typescript
export type WorkerInterceptorFn = (
  req: SerializableRequest,
  next: (req: SerializableRequest) => Promise<SerializableResponse>,
) => Promise<SerializableResponse>;

// Pre-built interceptors
export function hmacSigningInterceptor(config: HmacConfig): WorkerInterceptorFn;
export function retryInterceptor(config?: RetryConfig): WorkerInterceptorFn;
export function cacheInterceptor(config?: CacheConfig): WorkerInterceptorFn;

// Worker-side entry point
export function createWorkerPipeline(interceptors: WorkerInterceptorFn[]): void;
```

### Dependencies

- Zero runtime dependencies (WebCrypto is native)
- P1 transport protocol types only (interfaces, no runtime)

---

## P5: `@angular-helpers/worker-crypto`

**Standalone WebCrypto primitives** for use in workers or main thread. Useful independently of the HTTP pipeline.

### Scope

- `HmacSigner` — sign/verify with HMAC-SHA256/384/512
- `AesEncryptor` — encrypt/decrypt with AES-GCM
- `ContentHasher` — SHA-256/384/512 hashing
- `KeyStore` — secure key management in worker memory (import, derive, rotate)
- All operations async (WebCrypto is async)
- Works in both main thread and workers (but workers provide isolation)

### Dependencies

- Zero (WebCrypto is native)

---

## Composition Diagram

```
App developer uses P3 (or P3 + P4 for pre-built interceptors)
Everything else is internal:

┌─────────────────────────────────────────────────────┐
│  P3: worker-http-backend                            │
│  (Angular integration — the "black box")            │
│                                                     │
│  provideWorkerHttpClient()  WorkerHttpClient        │
│  withWorkerConfigs()        withWorkerRoutes()      │
│  ┌───────────────────┐  ┌────────────────────────┐  │
│  │ P1: transport     │  │ P2: serializer         │  │
│  │ (postMessage RPC, │  │ (TOON, seroval, auto)  │  │
│  │  pool, lifecycle) │  │                        │  │
│  └───────────────────┘  └────────────────────────┘  │
└──────────────────────────┬──────────────────────────┘
                           │ postMessage
                           ▼
┌─────────────────────────────────────────────────────┐
│  Worker (generated at build time)                   │
│  ┌────────────────────────────────────────────────┐ │
│  │ P4: worker-interceptors                        │ │
│  │ (hmac, cache, retry, validation, logging)      │ │
│  │ ┌──────────────────────────────────┐           │ │
│  │ │ P5: worker-crypto (optional)     │           │ │
│  │ │ (HMAC, AES, hashing, key store) │           │ │
│  │ └──────────────────────────────────┘           │ │
│  └────────────────────────────────────────────────┘ │
│  fetch()                                            │
└─────────────────────────────────────────────────────┘
```

---

## Delivery Order

| Phase       | Package                  | Deliverable                         | Why first                            |
| ----------- | ------------------------ | ----------------------------------- | ------------------------------------ |
| **Phase 1** | P1 `worker-transport`    | Typed RPC bridge + pool + lifecycle | Foundation for everything            |
| **Phase 1** | P5 `worker-crypto`       | WebCrypto primitives                | Independent, highest value, no deps  |
| **Phase 2** | P2 `worker-serializer`   | TOON + seroval + auto-detect        | Needed before P3 for large payloads  |
| **Phase 2** | P4 `worker-interceptors` | Pure-fn interceptor kit             | Needed before P3 for worker pipeline |
| **Phase 3** | P3 `worker-http-backend` | Angular HttpBackend + schematic     | Composes P1+P2+P4, the "product"     |

---

## Adoption Paths

| User profile                                 | Packages needed                | Effort                   |
| -------------------------------------------- | ------------------------------ | ------------------------ |
| **"I just want secure HTTP"**                | P3 + P4 (P1/P2 are transitive) | `npm install` + config   |
| **"I want worker transport for my own use"** | P1 only                        | Framework-agnostic       |
| **"I need WebCrypto helpers"**               | P5 only                        | No worker needed         |
| **"I want TOON serialization"**              | P2 only                        | Framework-agnostic       |
| **"I want the full stack"**                  | P3 + P4 + P5                   | Full Angular integration |
