# SDD — Feasibility Study: Angular HTTP over Web Workers

> Date: 2026-03-28  
> Status: Draft / Pre-analysis  
> Author: Gaspar

---

## 1. Idea Summary

Create an Angular library that allows configuring HTTP pipelines (with interceptors, context, and transformation logic) to run **inside Web Workers**, analogous to `provideHttpClient()` but with off-main-thread execution. Each worker could have its own independent interceptor chain and context.

---

## 2. Technical Context: How Angular HTTP Works Today

### The handler chain

`HttpClient` delegates to an `HttpHandler`, which is the interceptor chain assembled at DI time. At the end of that chain there is always an `HttpBackend`:

```typescript
// Angular internals (simplified)
const events$ = of(req).pipe(
  concatMap((req) => this.handler.handle(req)), // handler = interceptor chain + backend
);
```

Interceptors re-execute on every Observable subscription (this enables retries with full chain re-execution).

### The key extension point: `HttpBackend`

`HttpBackend` is the **last link** in the chain and is registered as a replaceable DI token:

```typescript
// Angular registers by default:
{ provide: HttpBackend, useExisting: HttpXhrBackend }
// Or with withFetch() since Angular 16+:
{ provide: HttpBackend, useExisting: FetchBackend }
```

This means you can **replace** the backend with a custom implementation without patching any framework internals. This is the main extension hook the library would exploit.

---

## 3. Strengths ✅

### 3.1 Clean and official technical hook

Angular exposes `HttpBackend` as a replaceable DI token. A `WorkerHttpBackend` implementing `HttpBackend` would be architecturally correct and aligned with the framework's design.

### 3.2 Workers CAN make HTTP requests

Web Workers have native access to `fetch()` and `XMLHttpRequest`. They do not need the main thread to execute network calls.

### 3.3 Real benefit for heavy processing scenarios

Cases where the benefit is measurable and real:

- **Large responses** (>1MB JSON): parsing, transformation, normalization → CPU on main thread
- **Multiple parallel requests** with complex transformations (mappings, schema validations)
- **Data streams** (aggressive polling, SSE, high-volume WebSockets)

The [web.dev/off-main-thread](https://web.dev/articles/off-main-thread) project documents **INP (Interaction to Next Paint)** improvements by moving heavy work to workers.

### 3.4 The security case is the most differentiating

This is the most innovative and solid angle of the proposal:

- Request/response validation in an isolated context
- Request signing/HMAC in a worker without exposing keys to the main thread
- A compromised worker has no access to the DOM or application state
- Rate limiting and anomaly detection without penalizing the UI
- **No existing Angular library does this** — a real gap in the ecosystem

### 3.5 Multiple workers with independent pipelines

Different workers with different interceptor chains have real value:

- Worker A: OAuth authentication + logging → public API
- Worker B: mTLS + strict validation → critical/sensitive API
- Worker C: aggressive caching + retry → low-priority API

### 3.6 No direct prior art in Angular

After reviewing npm, GitHub, and Angular documentation: **no library does exactly this**.  
Comlink (Google, ~19.5k npm dependents) solves worker RPC generically but has no specific integration with Angular HTTP or interceptors.

---

## 4. Weaknesses ⚠️

### 4.1 The fundamental problem: Angular DI does NOT exist in the Worker

This is the **biggest technical obstacle**. Web Workers are isolated JS execution contexts. Angular's injector tree, tokens, providers — none of that exists in the worker. A typical interceptor like this:

```typescript
// Typical Angular interceptor — NOT transferable to a worker
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService); // inject() → requires Angular DI
  const token = authService.getToken(); // accesses main thread state
  return next.handle(req.clone({ headers: req.headers.set('Authorization', token) }));
};
```

Cannot run in a worker because `inject()` requires Angular's injector context.

### 4.2 The structured clone algorithm blocks functions and prototypes

Thread communication uses `postMessage` + structured clone. Restrictions confirmed by MDN:

- **Functions cannot be cloned** → `DataCloneError`
- The prototype chain is not preserved
- Property descriptors, getters, and setters are not duplicated
- Class private fields are not transferred

Interceptors (which are functions) **cannot be dynamically sent to the worker**. They must be compiled as part of the worker bundle at build time.

### 4.3 Most HTTP calls do not noticeably block the main thread

HTTP in Angular is already **inherently asynchronous**. The main thread does not block waiting for the response; it blocks during _processing_ of the response. For standard CRUD with small responses, the `postMessage` serialization overhead + round-trip to the worker would be greater than the benefit.

### 4.4 Serialization overhead

Every request and response must cross the worker boundary via structured clone (deep copy). For large payloads, this copy itself consumes CPU. The alternative is `Transferable` objects (`ArrayBuffer`), but Angular's `HttpResponse` objects are not directly transferable.

### 4.5 `HttpContext` is not trivially transferable

`HttpContext` is a `Map` with tokens (class references) as keys. Tokens are references that do not survive standard serialization. It would need its own serialization/deserialization system.

### 4.6 Change detection and Zone.js

When the worker returns the response, the main thread must receive it and notify Angular. Zone.js patches asynchronous APIs on the main thread, not on the worker. With signals (zoneless) this is less problematic, but requires explicit handling of the return flow.

### 4.7 Does not work with SSR

`@angular/platform-server` **does not support Web Workers** (confirmed by official documentation). Any app with SSR would need a complete fallback route to the traditional `HttpClient`.

### 4.8 Build complexity

Workers are separate bundles. "Serializable" interceptors must be in files included in the worker bundle, not the main bundle. This complicates `angular.json` configuration and DX.

---

## 5. Prior Art and Related Technologies

| Project                                     | Relation                           | Gap                                                                                     |
| ------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| **Comlink** (Google, ~1.1kB)                | Generic worker RPC via ES6 Proxy   | No interceptor concept, no Angular HTTP integration                                     |
| **Angular Service Worker** (`@angular/pwa`) | Network proxy for offline caching  | Not usable as a custom interceptor                                                      |
| **withFetch()** (Angular 16+)               | Replaces XHR with native Fetch     | Still on main thread; network JSON parsing already happens in browser's internal thread |
| **NgRx Effects**                            | Handles async side-effects         | Does not move HTTP to a worker                                                          |
| **react-query / TanStack**                  | Background fetching                | Still on main thread                                                                    |
| **serialize-javascript** (Yahoo)            | Serializes JS to executable string | Explicitly discourages use for passing functions to workers                             |

**Conclusion**: The specific niche — configurable interceptors in multiple workers with an Angular-compatible API — does not exist. The building blocks (Comlink, Service Workers, FetchBackend) exist but nobody has assembled them this way.

---

## 6. Advanced Serialization: superjson / seroval

### What they solve (request/response data)

Extended serialization libraries like `superjson` or `seroval` solve the type-fidelity problem when crossing the worker boundary:

| Type                          | Native JSON | superjson                 | seroval   |
| ----------------------------- | ----------- | ------------------------- | --------- |
| `Date` in body                | ❌ string   | ✅ `Date`                 | ✅        |
| `Map` / `Set`                 | ❌ `{}`     | ✅                        | ✅        |
| `BigInt`                      | ❌ error    | ✅                        | ✅        |
| `HttpHeaders` (class)         | ❌ `{}`     | ✅ with `registerClass()` | ✅ custom |
| `HttpParams` (class)          | ❌ `{}`     | ✅ with `registerClass()` | ✅        |
| `Error` / `HttpErrorResponse` | ❌ partial  | ✅                        | ✅        |
| Circular references           | ❌ error    | ❌                        | ✅        |

With `superjson.registerClass(HttpHeaders)` + `superjson.registerClass(HttpParams)` you could serialize and reconstruct a complete `HttpRequest` in the worker without losing information.

`seroval` is more powerful: supports circular references, `ReadableStream`, and has a more expressive custom serializer API.

### What they do NOT solve (interceptors as functions)

No library can serialize functions/closures in an executable and safe way across threads. Functions capture references to the heap of the thread that created them. The architectural constraint remains: **interceptors must be bundled into the worker at compile time**, not transferred at runtime.

---

## 7. Proposed Viable Architecture

The viable proposal is not "move Angular to the worker" but rather creating a **layer of serializable interceptors** that can run in the worker.

### Layer diagram

```
Build time:
  worker.bundle.ts  ←── pure function interceptors (bundled)
  main.bundle.ts    ←── Angular DI interceptors + WorkerHttpBackend

Runtime:
  Main Thread                           Web Worker
  ─────────────────────────────         ──────────────────────────────
  Angular DI interceptors               WorkerHttpPipeline
    (auth token, UI spinners,             (pure fn interceptors:
     error dialogs, etc.)                  signing, validation,
                                           retry, cache, logging)
          │                                       │
          ▼                                       ▼
  WorkerHttpBackend ─── postMessage ──►  fetch() + pipeline execution
  (implements HttpBackend)                        │
          │                          seroval/superjson serialize
          └──────── response ◄───────────────────┘
```

### Proposed public API (draft)

```typescript
// app.config.ts
provideHttpClient(
  withWorkerBackend({
    workers: [
      {
        id: 'public-api',
        workerUrl: new URL('./workers/public-api.worker', import.meta.url),
        urlPattern: /^https:\/\/api\.example\.com\/public/,
        interceptors: [loggingInterceptor, cacheInterceptor], // pure functions
      },
      {
        id: 'secure-api',
        workerUrl: new URL('./workers/secure-api.worker', import.meta.url),
        urlPattern: /^https:\/\/api\.example\.com\/secure/,
        interceptors: [hmacSigningInterceptor, strictValidationInterceptor],
      },
    ],
    fallback: 'main-thread', // if worker unavailable (SSR, etc.)
  }),
);
```

### Serializable interceptor type

```typescript
// Pure functions only — no inject(), no DOM, no closures over external state
export type WorkerInterceptorFn = (
  req: SerializableHttpRequest, // POJO version of HttpRequest
  next: (req: SerializableHttpRequest) => Promise<SerializableHttpResponse>,
) => Promise<SerializableHttpResponse>;
```

### Internal worker (generated/configured by the lib)

```typescript
// public-api.worker.ts
import { createWorkerPipeline } from '@angular-helpers/http-worker';
import { loggingInterceptor, cacheInterceptor } from './interceptors';

createWorkerPipeline([loggingInterceptor, cacheInterceptor]);
```

---

## 8. Feasibility Verdict

| Dimension                              | Assessment                                                               |
| -------------------------------------- | ------------------------------------------------------------------------ |
| **Technical feasibility**              | ✅ Viable — the `HttpBackend` hook exists and is clean                   |
| **Benefit for standard CRUD**          | ❌ Not justified — overhead outweighs the gain                           |
| **Benefit for heavy processing**       | ✅ Real and measurable                                                   |
| **Security case (signing/validation)** | ✅✅ Clear differentiator — no prior art in Angular                      |
| **SSR compatibility**                  | ❌ Mandatory fallback required                                           |
| **DX (developer experience)**          | ⚠️ Complex — serializable interceptor constraint breaks current patterns |
| **Ecosystem novelty**                  | ✅ Nothing equivalent exists                                             |
| **Adoption risk**                      | ⚠️ High — new mental model for interceptors                              |

---

## 9. Investigation: Performance & Utility Weak Points in Current Implementations

This section documents the concrete performance bottlenecks and utility gaps in Angular's current HTTP stack, based on research of Angular issues, browser internals, community benchmarks, and real-world reports.

---

### 9.1 JSON Parsing Blocks the Main Thread

**The core problem**: `JSON.parse()` is synchronous and runs on the main thread regardless of whether XHR or Fetch is used. For large payloads this directly degrades INP (Interaction to Next Paint).

| Payload size | `JSON.parse` time (approx) | User-visible impact                     |
| ------------ | -------------------------- | --------------------------------------- |
| 10 KB        | < 1 ms                     | None                                    |
| 100 KB       | 3–8 ms                     | None for most apps                      |
| 1 MB         | 20–80 ms                   | Noticeable jank on mid-range devices    |
| 10 MB        | 200–800 ms                 | UI freezes, missed frames, degraded INP |
| 50 MB+       | 2–5 seconds                | Application appears unresponsive        |

_Source: Stack Overflow benchmarks ([#73631367](https://stackoverflow.com/questions/73631367/js-worker-performance-parsing-json)), Hacker News threads, and Chrome DevTools profiling reports._

**Angular-specific context**: When `responseType: 'json'` (the default), Angular's `HttpXhrBackend` calls `JSON.parse(body)` directly on the main thread in `xhr.ts`. With `withFetch()`, the browser's `response.json()` is used — but **contrary to popular belief**, V8 still executes `JSON.parse` on the main thread for the final object construction. The network I/O and initial byte reception happen off-thread, but the actual parse-to-JS-object step blocks.

**Key finding**: A common misconception (repeated in Reddit threads and blog posts) is that `fetch().json()` parses "in a worker". In reality, the browser handles the _network layer_ off-thread, but `JSON.parse` always runs on the calling thread. This was confirmed by Chrome DevTools traces and V8 source analysis.

---

### 9.2 No Custom JSON Parser Support

Angular's `HttpClient` hardcodes `JSON.parse` with no extension point for custom parsers. This is documented in multiple open issues:

- **[#21079](https://github.com/angular/angular/issues/21079)** (2017, still open): Request for custom `JSON.parse` reviver — `Date` objects deserialize as strings, requiring manual post-processing.
- **[#24942](https://github.com/angular/angular/issues/24942)** (2018, still open): Large numbers (`BigInt`) are silently truncated by `JSON.parse`. No way to use `lossless-json` or similar.
- **[#48167](https://github.com/angular/angular/issues/48167)** (2022): Request for configurable JSON parser injection token — rejected by Angular team, recommending a workaround interceptor that forces `responseType: 'text'` and manually parses.

**Impact**: Developers must choose between:

1. Using `responseType: 'text'` + manual `JSON.parse` (loses typed response inference)
2. Writing a global interceptor that overrides response handling (brittle, breaks `observe: 'events'`)
3. Accepting data loss for `BigInt` / incorrect `Date` types

A worker-based backend could transparently support custom parsers (superjson, seroval, lossless-json) since the parsing happens in an isolated context anyway.

---

### 9.3 No Streaming Response Support

Angular's `HttpClient` buffers the **entire response body** before emitting. There is no built-in way to process chunked/streaming responses incrementally.

- **[#44143](https://github.com/angular/angular/issues/44143)** (2021, 158+ upvotes): Feature request for first-class HTTP streaming via `ReadableStream`. Still open.
- **[#32906](https://github.com/angular/angular/issues/32906)** (2019): Request to handle each chunk of a chunked response separately.
- **[#26289](https://github.com/angular/angular/issues/26289)** (2018): Problematic concatenation of chunked HTTP responses.

**Workaround**: Developers must bypass `HttpClient` entirely and use raw `fetch()` + `ReadableStream`, losing all interceptor, XSRF, and testing infrastructure.

**Opportunity for worker-based backend**: A worker performing `fetch()` internally has native access to `ReadableStream` and could incrementally post parsed chunks back to the main thread via `postMessage`, enabling streaming without abandoning Angular's HTTP stack.

---

### 9.4 XHR vs Fetch Backend: The Real Differences

| Aspect                     | `HttpXhrBackend` (default)                  | `FetchBackend` (`withFetch()`)                         |
| -------------------------- | ------------------------------------------- | ------------------------------------------------------ |
| **Upload progress**        | ✅ Native `progress` events                 | ❌ Not supported by Fetch spec                         |
| **Download progress**      | ✅ Via `onprogress`                         | ⚠️ Requires `ReadableStream` workaround                |
| **Request cancellation**   | ✅ `xhr.abort()`                            | ✅ `AbortController`                                   |
| **Streaming responses**    | ❌ Buffers complete body                    | ❌ Angular still buffers (despite Fetch supporting it) |
| **JSON parsing thread**    | Main thread (`JSON.parse`)                  | Main thread (`response.json()` → still main thread)    |
| **HTTP/2+ support**        | ⚠️ Via browser, but no multiplexing control | ⚠️ Same                                                |
| **Service Worker interop** | ✅ Interceptable                            | ✅ Interceptable                                       |
| **SSR compatibility**      | ✅ Via `xhr2` package                       | ✅ Via `node-fetch` / Node 18+ native                  |

**Key insight**: Neither backend solves the main-thread-blocking problem for JSON parsing. `withFetch()` is primarily useful for:

- SSR with modern Node.js (no `xhr2` dependency)
- Slightly simpler browser internals
- Future streaming support (not yet exposed by Angular)

---

### 9.5 Interceptor Chain: Cold Observable Re-execution

Angular's interceptor chain is a **cold Observable pipeline**. Every subscription re-executes the entire chain including the HTTP request itself. This is by design (enables retry operators), but creates subtle performance and correctness issues:

1. **Accidental duplicate requests**: If a component subscribes twice (e.g., `| async` in template + `subscribe()` in code), the request fires twice.
2. **No built-in deduplication**: Unlike React Query/TanStack, Angular has no request deduplication layer. Developers must manually `shareReplay()` or implement caching interceptors.
3. **Interceptor overhead scales linearly**: Each interceptor adds an RxJS `pipe` + `concatMap` + function call per request. For apps with 5–10 interceptors, the overhead per request is measurable in profiler traces (1–3ms additional per request on mobile).

**Community patterns**: The absence of built-in caching/deduplication has spawned:

- `@ngneat/cashew` (HTTP caching interceptor)
- `@angular/common/http` + custom `TransferState` for SSR
- Manual `shareReplay(1)` patterns that are error-prone

---

### 9.6 postMessage Overhead: The Worker Transfer Tax

Benchmarks from Stack Overflow and Joji.me reveal the real cost of crossing the worker boundary:

| Transfer method                               | 1 KB     | 100 KB   | 1 MB     | 10 MB     | 100 MB      |
| --------------------------------------------- | -------- | -------- | -------- | --------- | ----------- |
| **Structured clone** (default `postMessage`)  | < 1 ms   | 1–3 ms   | 5–15 ms  | 50–150 ms | 500–1500 ms |
| **Transferable** (`ArrayBuffer`)              | < 0.1 ms | < 0.1 ms | < 0.1 ms | < 0.1 ms  | < 0.1 ms    |
| **String transfer** (JSON string, not parsed) | < 1 ms   | 1–2 ms   | 3–8 ms   | 30–80 ms  | 300–800 ms  |

_Source: [joji.me benchmarks](https://joji.me/en-us/blog/performance-issue-of-using-massive-transferable-objects-in-web-worker/), SO [#73631367](https://stackoverflow.com/questions/73631367/js-worker-performance-parsing-json)_

**Critical finding**: Sending the **parsed JSON object** back from the worker via `postMessage` triggers structured clone, which is essentially a second serialization pass. This can negate the benefit of off-thread parsing.

**Optimal strategy for the library**:

1. Worker receives URL → performs `fetch()` → gets response as `ArrayBuffer` or string
2. Worker parses JSON in its own thread (main thread is free)
3. Worker sends back **the raw string** via `postMessage` (cheap string copy)
4. Main thread does a final `JSON.parse` — but this is now the **only** main-thread cost

**Or even better**: Worker sends back `ArrayBuffer` via `Transferable` (near-zero copy), and main thread parses from `ArrayBuffer`. Total main-thread cost: just the `JSON.parse` — same as today, but the network I/O, response decompression, interceptor logic, and any transformations ran off-thread.

For the **security use case** (HMAC, signing, validation), the worker never needs to send back the full parsed object — only a validation result or signed request — making the transfer tax negligible.

---

### 9.7 No Request-Level Isolation or Sandboxing

Current `HttpClient` runs all interceptors in the same JavaScript context with full access to:

- The DOM
- `window` / `document`
- All application state
- The Angular injector tree

**Security implications**:

- A compromised third-party interceptor (from an npm package) has full application access
- API keys and tokens processed in interceptors are visible in memory dumps
- No Content Security Policy enforcement at the interceptor level

**Worker advantage**: Code running in a Web Worker has **no DOM access**, no `window`, no `document`. A worker-based interceptor pipeline is inherently sandboxed. This is the strongest differentiator identified in the feasibility study (section 3.4).

---

### 9.8 Summary: Where Workers Add Real Value

| Weak point                      | Current impact                                  | Worker solution viability             |
| ------------------------------- | ----------------------------------------------- | ------------------------------------- |
| JSON parsing blocks main thread | **High** for >1MB payloads                      | ✅ Parse in worker, transfer result   |
| No custom JSON parser           | **Medium** — workarounds exist but are fragile  | ✅ Worker can use any parser          |
| No streaming responses          | **High** for real-time apps                     | ✅ Worker has native `ReadableStream` |
| No request deduplication        | **Medium** — manual patterns required           | ⚠️ Possible but adds complexity       |
| Interceptor security isolation  | **Low** day-to-day, **High** for sensitive apps | ✅✅ Workers are sandboxed by design  |
| postMessage transfer overhead   | —                                               | ⚠️ Must be managed carefully          |
| Cold Observable re-execution    | **Medium** — common footgun                     | ❌ Orthogonal to worker architecture  |

**Conclusion**: The strongest case for a worker-based HTTP backend is the combination of:

1. **Heavy payload processing** (>1MB JSON with transformations)
2. **Security-sensitive operations** (HMAC signing, token validation, schema enforcement)
3. **Streaming use cases** (NDJSON, SSE proxy, chunked responses)

For standard CRUD with small payloads (<100KB), the worker overhead exceeds the benefit.

---

## 10. Next Steps if Moving Forward

1. **Minimal POC**: `WorkerHttpBackend` that serializes `HttpRequest` with `seroval`, dispatches to a worker with `fetch()`, and returns `HttpResponse` to the main thread.
2. **Validate real overhead**: benchmark with 10KB, 100KB, 1MB payloads to determine the threshold where the worker is beneficial.
3. **Design `SerializableHttpRequest`**: POJO version compatible with structured clone, with transformers for `HttpHeaders`, `HttpParams`, `HttpContext`.
4. **Define the `WorkerInterceptorFn` contract**: no DI, no DOM, pure data only + `fetch`.
5. **Routing mechanism**: decide if request routing to the correct worker is by URL pattern, header, or `HttpContext` tag.
6. **Automatic SSR fallback**: detect `typeof Worker === 'undefined'` and degrade to `FetchBackend` transparently.

---

## 11. API Design

The goal is that using this library feels like a natural extension of Angular's own HTTP stack — not a foreign API. Two Angular conventions drive the design:

- **Environmental providers pattern**: `provideWorkerHttpClient(...features)` mirrors `provideHttpClient(...features)`.
- **`HttpContextToken`**: Angular's existing mechanism for per-request metadata — used internally by `WorkerHttpClient` to carry the target worker ID through the interceptor chain.

---

### 11.1 Dual interceptor layers

Before the API, an important architectural clarification. Since `HttpBackend` sits **after** Angular's interceptor chain, the library creates two independent layers:

```
HttpClient.get()
    │
    ▼
 [Main thread Angular interceptors]   ← DI-capable, UI-aware
   • auth token injection               (existing interceptors keep working)
   • loading spinners
   • error dialogs
   • CSRF
    │
    ▼
 WorkerHttpBackend.handle()           ← routes to the target worker
    │
    ▼ postMessage (seroval)
 [Worker interceptor pipeline]        ← pure functions, isolated
   • HMAC / request signing
   • schema validation
   • cache
   • retry with backoff
    │
    ▼
  fetch()
```

This means **existing interceptors do not break**. The worker pipeline is an additional layer, not a replacement.

---

### 11.2 Types

Mirroring Angular's own discriminated union pattern for HTTP features:

```typescript
// Discriminated union for feature kinds — mirrors HttpFeatureKind in @angular/common/http
export type WorkerHttpFeatureKind =
  | 'WorkerConfigs'
  | 'WorkerRoutes'
  | 'WorkerFallback'
  | 'WorkerSerialization';

// Feature object — mirrors HttpFeature<K> shape (ɵ prefix = Angular convention)
export interface WorkerHttpFeature<K extends WorkerHttpFeatureKind> {
  ɵkind: K;
  ɵproviders: Provider[];
}

// Single worker definition
export interface WorkerConfig {
  id: string; // unique identifier used for routing / explicit selection
  workerUrl: URL; // passed to new Worker(url)
  interceptors?: WorkerInterceptorFn[]; // pure function interceptors bundled in the worker
  maxInstances?: number; // optional worker pool size (default: 1)
}

// URL-pattern → worker auto-routing rule
export interface WorkerRoute {
  pattern: RegExp | string;
  worker: string; // must match a WorkerConfig.id
  priority?: number; // higher = evaluated first (default: 0)
}

// Fallback when workers are unavailable (SSR, old browsers)
export type WorkerFallbackStrategy = 'main-thread' | 'error';

// Pure-function interceptor — the only kind that can run inside a worker
// No inject(), no DOM, no closures over external mutable state
export type WorkerInterceptorFn = (
  req: SerializableRequest,
  next: (req: SerializableRequest) => Promise<SerializableResponse>,
) => Promise<SerializableResponse>;

// POJO versions of Angular's HttpRequest / HttpResponse (structured-clone safe)
export interface SerializableRequest {
  method: string;
  url: string;
  headers: Record<string, string[]>;
  params: Record<string, string[]>;
  body: unknown; // serialized by seroval before crossing boundary
  responseType: 'json' | 'text' | 'blob' | 'arraybuffer';
  withCredentials: boolean;
  context: Record<string, unknown>; // serialized HttpContext entries
}

export interface SerializableResponse {
  status: number;
  statusText: string;
  headers: Record<string, string[]>;
  body: unknown;
  url: string;
}
```

---

### 11.3 Feature functions (`with*()`)

Matching Angular's exact ergonomic pattern:

```typescript
// Registers worker definitions
export function withWorkerConfigs(configs: WorkerConfig[]): WorkerHttpFeature<'WorkerConfigs'>;

// Declares URL-pattern → worker routing rules (evaluated in priority order)
export function withWorkerRoutes(routes: WorkerRoute[]): WorkerHttpFeature<'WorkerRoutes'>;

// Strategy when typeof Worker === 'undefined' (SSR, old browsers)
// 'main-thread' → silently falls back to FetchBackend
// 'error'       → throws, forces explicit handling
export function withWorkerFallback(
  strategy: WorkerFallbackStrategy,
): WorkerHttpFeature<'WorkerFallback'>;

// Replace the default seroval serializer with a custom implementation
export function withWorkerSerialization(
  serializer: WorkerSerializer,
): WorkerHttpFeature<'WorkerSerialization'>;
```

---

### 11.4 `provideWorkerHttpClient()`

Drop-in companion to Angular's `provideHttpClient()`. Returns `EnvironmentProviders` so it can only be used at root / route level — same restriction Angular enforces.

```typescript
export function provideWorkerHttpClient(
  ...features: WorkerHttpFeature<WorkerHttpFeatureKind>[]
): EnvironmentProviders;
```

It registers `WorkerHttpBackend` under the `HttpBackend` token, keeping the rest of the Angular HTTP stack (interceptors, `HttpClient` itself, XSRF, etc.) intact.

> **Compatibility**: `provideWorkerHttpClient()` can be used **instead of** `provideHttpClient()` — it registers `HttpClient` as well, so no double-registration is needed.

---

### 11.5 Per-request worker selection: `WORKER_TARGET`

The `HttpContextToken` that carries the target worker ID. Used internally by `WorkerHttpClient`, but also available to power users who prefer the standard `HttpClient`:

```typescript
export const WORKER_TARGET = new HttpContextToken<string | null>(() => null);
// null → auto-routing by URL pattern (or fallback to main thread if no route matches)
```

---

### 11.6 `WorkerHttpClient`

A service that mirrors `HttpClient`'s API exactly and adds an optional `worker?` field to every options object. Under the hood it sets `WORKER_TARGET` on the `HttpContext` — the user never touches the context manually.

```typescript
@Injectable({ providedIn: 'root' })
export class WorkerHttpClient {
  private readonly http = inject(HttpClient);

  get<T>(url: string, options?: WorkerGetOptions): Observable<T> {
    return this.http.get<T>(url, this.withWorker(options));
  }

  post<T>(url: string, body: unknown, options?: WorkerPostOptions): Observable<T> {
    return this.http.post<T>(url, body, this.withWorker(options));
  }

  put<T>(url: string, body: unknown, options?: WorkerPutOptions): Observable<T> {
    return this.http.put<T>(url, body, this.withWorker(options));
  }

  patch<T>(url: string, body: unknown, options?: WorkerPatchOptions): Observable<T> {
    return this.http.patch<T>(url, body, this.withWorker(options));
  }

  delete<T>(url: string, options?: WorkerDeleteOptions): Observable<T> {
    return this.http.delete<T>(url, this.withWorker(options));
  }

  head<T>(url: string, options?: WorkerHeadOptions): Observable<T> {
    return this.http.head<T>(url, this.withWorker(options));
  }

  // Injects the WORKER_TARGET token into the request context, then strips
  // the 'worker' key so the underlying HttpClient never sees an unknown option.
  private withWorker<T extends { worker?: string; context?: HttpContext }>(
    options?: T,
  ): Omit<T, 'worker'> & { context: HttpContext } {
    const { worker = null, context, ...rest } = options ?? ({} as T);
    return {
      ...(rest as Omit<T, 'worker'>),
      context: (context ?? new HttpContext()).set(WORKER_TARGET, worker),
    };
  }
}

// Option types: Angular's own option shape + { worker?: string }
// (Full overloads matching HttpClient's signatures are defined in the implementation)
export type WorkerGetOptions = Parameters<HttpClient['get']>[1] & { worker?: string };
export type WorkerPostOptions = Parameters<HttpClient['post']>[2] & { worker?: string };
export type WorkerPutOptions = Parameters<HttpClient['put']>[2] & { worker?: string };
export type WorkerPatchOptions = Parameters<HttpClient['patch']>[2] & { worker?: string };
export type WorkerDeleteOptions = Parameters<HttpClient['delete']>[1] & { worker?: string };
export type WorkerHeadOptions = Parameters<HttpClient['head']>[1] & { worker?: string };
```

---

### 11.7 End-to-end usage example

**`app.config.ts`** — provider setup follows Angular's environmental providers convention:

```typescript
import {
  provideWorkerHttpClient,
  withWorkerConfigs,
  withWorkerRoutes,
  withWorkerFallback,
} from '@angular-helpers/http-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideWorkerHttpClient(
      withWorkerConfigs([
        {
          id: 'public',
          workerUrl: new URL('./workers/public.worker', import.meta.url),
          interceptors: [cacheInterceptor, loggingInterceptor],
        },
        {
          id: 'secure',
          workerUrl: new URL('./workers/secure.worker', import.meta.url),
          interceptors: [hmacSigningInterceptor, schemaValidationInterceptor],
          maxInstances: 2,
        },
      ]),
      withWorkerRoutes([
        { pattern: /\/api\/secure\//, worker: 'secure', priority: 10 },
        { pattern: /\/api\//, worker: 'public', priority: 1 },
      ]),
      withWorkerFallback('main-thread'), // SSR / unsupported environments
    ),
  ],
};
```

**`workers/secure.worker.ts`** — separate bundle, interceptors defined here:

```typescript
import { createWorkerPipeline } from '@angular-helpers/http-worker';
import { hmacSigningInterceptor, schemaValidationInterceptor } from './interceptors/secure';

// No Angular, no DI — just pure functions + fetch
createWorkerPipeline([hmacSigningInterceptor, schemaValidationInterceptor]);
```

**`data.service.ts`** — consumer code, identical ergonomics to `HttpClient`:

```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(WorkerHttpClient);

  // Auto-routed to 'public' worker via URL pattern
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }

  // Explicitly routed to 'secure' worker, overrides auto-routing
  getSensitiveReport(): Observable<Report> {
    return this.http.get<Report>('/api/secure/reports', { worker: 'secure' });
  }

  // POST — same familiar shape, worker param is the only addition
  submitSecureForm(payload: FormPayload): Observable<void> {
    return this.http.post<void>('/api/secure/submit', payload, { worker: 'secure' });
  }
}
```

**Power user — standard `HttpClient` with `WORKER_TARGET` directly:**

```typescript
// For users who don't want WorkerHttpClient but need explicit control
this.http.get<Data>('/api/secure/data', {
  context: new HttpContext().set(WORKER_TARGET, 'secure'),
});
```

---

### 11.8 Revised DX assessment

With this API design, the DX concern from section 8 changes:

| Concern                      | Previous assessment | With API design                                                            |
| ---------------------------- | ------------------- | -------------------------------------------------------------------------- |
| Feels like Angular HTTP      | ⚠️ Unknown          | ✅ `provideWorkerHttpClient()` + `WorkerHttpClient` mirror Angular exactly |
| Per-request worker selection | ⚠️ Manual context   | ✅ `{ worker: 'id' }` option on every method                               |
| Existing interceptors broken | ⚠️ Risk             | ✅ Dual-layer — main thread interceptors unaffected                        |
| SSR                          | ❌ No support       | ✅ `withWorkerFallback('main-thread')` handles it transparently            |
| Learning curve               | ⚠️ High             | ⚠️ Medium — provider setup is new; usage is identical to HttpClient        |

---

## 11. Architectural Decisions (Post-Research)

> Date: 2026-03-31  
> Deep research: [research/http-worker-deep-research.md](research/http-worker-deep-research.md)  
> Product breakdown: [research/http-worker-product-breakdown.md](research/http-worker-product-breakdown.md)

---

### 11.1 Design Principle: Worker as a Black Box

The developer must never feel they are working with a worker. The worker is an **implementation detail** — the API surface must feel identical to Angular's `HttpClient`.

- **RxJS, Observables, DI** — all stay on the Angular (main thread) side
- **Worker internals** (postMessage, serialization, fetch, cancellation) — completely hidden
- **Interceptors** — the developer configures them in `app.config.ts`; a build-time tool generates the worker bundle

```
What the developer sees:          What the library does internally:
─────────────────────────         ──────────────────────────────────
provideWorkerHttpClient(...)      → registers WorkerHttpBackend
this.http.get<User[]>(url)        → serialize → postMessage → worker fetch → deserialize → Observable
{ worker: 'secure' }              → routes to correct worker via HttpContext
```

---

### 11.2 Build-Time Transpilation for Interceptors

Interceptors cannot be dynamically sent to workers (functions are not serializable). Instead of requiring the developer to manually write worker files, the library uses **build-time code generation** — the same approach Angular CLI uses with `ng generate web-worker`.

#### How it works

1. Developer declares interceptors in `withWorkerConfigs()` (Angular config)
2. A **schematic** (`ng generate @angular-helpers/worker-http-backend:worker secure`) generates the worker file
3. An **esbuild plugin** (or Angular builder hook) reads the config at build time and bundles interceptors into the worker

```
Developer writes:                     Build tool generates:
─────────────────                     ─────────────────────
withWorkerConfigs([{                  workers/secure.worker.ts
  id: 'secure',                       ├── import { createWorkerPipeline }
  interceptors: [hmac, validate],     ├── import { hmac, validate }
}])                                   └── createWorkerPipeline([hmac, validate])
```

**Key benefit**: The developer never writes `postMessage`, never imports `createWorkerPipeline`, never touches worker code. They configure interceptors in Angular-land; the build tool does the rest.

---

### 11.3 Serialization Strategy: TOON for Large Payloads

Standard `postMessage` structured clone works fine for small payloads (< 100 KiB, per [Surma's benchmarks](https://surma.dev/things/is-postmessage-slow/)). For large array responses, **TOON** ([Token-Oriented Object Notation](https://github.com/toon-format/toon)) provides significant size reduction by declaring the schema once:

```
// JSON — keys repeated per object
[{"id":1,"name":"Alice","role":"admin"},{"id":2,"name":"Bob","role":"user"}]

// TOON — schema once, values as rows (30–60% smaller for uniform arrays)
[2]{id,name,role}:
1,Alice,admin
2,Bob,user
```

**Auto-detection strategy** (internal, invisible to the developer):

| Payload shape                 | Serialization                    | Transfer method                         |
| ----------------------------- | -------------------------------- | --------------------------------------- |
| Small object (< 100 KiB)      | Structured clone (native)        | `postMessage` (copy)                    |
| Uniform array (e.g. `User[]`) | TOON → TextEncoder → ArrayBuffer | `postMessage` with transfer (zero-copy) |
| Complex types (`Date`, `Map`) | seroval                          | `postMessage` (copy)                    |
| Binary data                   | None                             | `ArrayBuffer` transfer (zero-copy)      |

The developer never chooses — the serializer auto-detects. Overridable via `withWorkerSerialization()`.

---

### 11.4 Key Findings from Deep Research

Full details in [research/http-worker-deep-research.md](research/http-worker-deep-research.md). Summary:

| Topic                           | Finding                                                                   | Impact                                     |
| ------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| **postMessage overhead**        | ≤ 100 KiB within RAIL 100ms budget (Surma)                                | ✅ Not a blocker for standard APIs         |
| **WebCrypto in workers**        | `SubtleCrypto` fully available; genuine security boundary                 | ✅✅ Strongest differentiator              |
| **AbortSignal**                 | NOT transferable (WHATWG #948, open since 2021)                           | ⚠️ Cancel-message pattern needed           |
| **Transferable ReadableStream** | ~80.86% coverage; Safari missing                                          | ⚠️ `remote-web-streams` polyfill available |
| **Worker memory**               | ~2–5 MB each; not GC'd; must terminate via `DestroyRef`                   | ⚠️ Lifecycle management required           |
| **DevTools**                    | Worker `fetch()` visible in Network tab (all browsers)                    | ✅ Debugging preserved                     |
| **Testing**                     | Pure-fn interceptors testable without workers; MSW mocks fetch in workers | ✅ Practical                               |
| **COOP/COEP**                   | `SharedArrayBuffer` requires cross-origin isolation headers               | ⚠️ Must be opt-in only                     |

---

### 11.5 Multi-Package Product Strategy

The full vision is too complex for one package. It breaks into **5 independent, composable packages**:

| Package                      | Responsibility                                      | Dependencies                   |
| ---------------------------- | --------------------------------------------------- | ------------------------------ |
| **P1** `worker-transport`    | Typed RPC bridge, pool, lifecycle, cancellation     | `rxjs`                         |
| **P2** `worker-serializer`   | TOON, seroval, auto-detect strategy                 | Optional peers                 |
| **P3** `worker-http-backend` | Angular `HttpBackend` replacement (the "black box") | P1, P2, `@angular/common/http` |
| **P4** `worker-interceptors` | Pre-built pure-fn interceptors (HMAC, cache, retry) | Zero deps                      |
| **P5** `worker-crypto`       | WebCrypto primitives (HMAC, AES, hashing)           | Zero deps                      |

**Delivery order**: P1 + P5 (foundation) → P2 + P4 (serialization + interceptors) → P3 (Angular integration).

Full breakdown in [research/http-worker-product-breakdown.md](research/http-worker-product-breakdown.md).

---

## 12. Revised Feasibility Verdict

| Dimension                 | §8 Assessment | Post-Research                            | Δ   |
| ------------------------- | ------------- | ---------------------------------------- | --- |
| **Technical feasibility** | ✅ Viable     | ✅ Confirmed with library ecosystem      | —   |
| **Serialization**         | ⚠️ Concern    | ✅ TOON + auto-detect + Transferable     | ⬆   |
| **Security (crypto)**     | ✅✅          | ✅✅✅ WebCrypto + genuine isolation     | ⬆   |
| **Request cancellation**  | —             | ⚠️ Cancel-message viable                 | 🆕  |
| **DX**                    | ⚠️ Complex    | ✅ Black box + build-time generation     | ⬆   |
| **SSR**                   | ❌ Fallback   | ❌ Still needs fallback                  | —   |
| **Ecosystem novelty**     | ✅            | ✅ Confirmed — nothing equivalent exists | —   |

**Verdict**: Move forward. Start with **P1 (worker-transport) + P5 (worker-crypto)** as independent, high-value deliverables.

---

## 13. Next Steps

1. **P1 POC**: `worker-transport` — typed postMessage bridge with Observable API, cancellation, and pool
2. **P5 POC**: `worker-crypto` — HMAC signing + AES encryption helpers using WebCrypto
3. **Benchmark**: Validate TOON vs JSON vs structured clone with real API payloads (10 KiB, 100 KiB, 1 MiB)
4. **P3 Schematic**: Prototype the `ng generate` schematic for worker file generation
5. **Integration test**: Full round-trip with Playwright + MSW
