# Deep Research: Angular HTTP Web Workers — Weak Points and Libraries

> Date: 2026-03-30  
> Status: Research complete  
> Parent document: [SDD — Angular HTTP over Web Workers](../sdd-angular-http-web-workers.md)

---

## 1. Serialization Overhead — Real-World Benchmarks

The `postMessage` overhead is **quantifiable**. Surma (Google Chrome team) published benchmarks ([surma.dev/things/is-postmessage-slow](https://surma.dev/things/is-postmessage-slow/)):

| Payload size    | Budget (RAIL)       | Fits within budget?   | Notes                                  |
| --------------- | ------------------- | --------------------- | -------------------------------------- |
| ≤ 10 KiB        | 16ms (animation)    | ✅ Yes                | Safe even with JS-driven animations    |
| ≤ 100 KiB       | 100ms (interaction) | ✅ Yes                | Safe for user-interaction response     |
| 100 KiB – 1 MiB | 100ms               | ⚠️ Device-dependent   | Low-end mobile may exceed budget       |
| > 1 MiB         | —                   | ❌ Needs optimization | Must use Transferable or binary format |

**Key insight**: Structured clone cost scales with _object complexity_ (depth, number of keys), not just byte size. A flat array of 10,000 numbers is far cheaper than a deeply nested object of the same JSON size.

### Libraries for enhanced serialization

| Library                   | Size    | Key advantage                                               | Gap                                            |
| ------------------------- | ------- | ----------------------------------------------------------- | ---------------------------------------------- |
| **superjson**             | ~3 KiB  | Preserves `Date`, `Map`, `Set`, `BigInt`; `registerClass()` | No circular ref support                        |
| **seroval**               | ~5 KiB  | Circular refs, `ReadableStream`, custom serializers         | More complex API                               |
| **devalue** (Rich Harris) | ~1 KiB  | Circular refs, used in SvelteKit; very small                | No `registerClass()` equivalent                |
| **codablejson**           | ~2 KiB  | 3x faster than superjson, declarative schema                | Newer, smaller community                       |
| **FlatBuffers** (Google)  | ~15 KiB | **Zero-copy** from `ArrayBuffer`; schema-compiled           | Requires `.fbs` schema; overkill for most HTTP |

### TOON (Token-Oriented Object Notation)

[TOON](https://github.com/toon-format/toon) (spec v3.0, 2025-11) is a compact serialization format that **declares the schema once and then provides values as rows**, avoiding key repetition in uniform arrays:

```
// JSON — keys repeated per object (redundant)
[{"sku":"A1","qty":2,"price":9.99},{"sku":"B2","qty":1,"price":14.5}]

// TOON — schema declared once, values as CSV-like rows
[2]{sku,qty,price}:
A1,2,9.99
B2,1,14.5
```

**Why TOON matters for this library**: API responses that return arrays of objects (the most common pattern — `User[]`, `Product[]`, paginated lists) have massive key repetition in JSON. TOON eliminates this.

**Benchmarks** (from TOON spec):

- 30–60% size reduction vs JSON for uniform arrays
- Negligible encoding/decoding overhead (simple CSV-like parsing)
- Reference implementation in TypeScript: [`@byjohann/toon`](https://www.npmjs.com/package/@byjohann/toon)

**Applicability for worker↔main boundary**:

| Scenario                           | JSON + structured clone | TOON + ArrayBuffer transfer           |
| ---------------------------------- | ----------------------- | ------------------------------------- |
| `GET /api/users` (1000 users)      | ~200 KiB cloned (slow)  | ~80 KiB transferred (fast, zero-copy) |
| `GET /api/user/1` (single object)  | ~0.5 KiB (fast)         | Overhead not justified                |
| `GET /api/reports` (large dataset) | > 1 MiB (too slow)      | ~400 KiB transferred (viable)         |

**Flow**: Worker fetches → parses JSON → TOON.stringify (compact) → TextEncoder → ArrayBuffer → `postMessage` with transfer (zero-copy) → Main thread receives → TextDecoder → TOON.parse → Angular HttpResponse.

**Limitation**: TOON spec is still "Working Draft" (v3.0). The ecosystem is young — `@byjohann/toon` is the reference implementation. For production, the library should use TOON internally but keep it as a swappable serializer via `withWorkerSerialization()`.

---

## 2. Transferable Objects — The Zero-Copy Escape Hatch

When structured clone is too slow, `postMessage` supports **transferring** ownership of specific objects at near-zero cost:

```typescript
worker.postMessage(buffer, [buffer]);
// After transfer, buffer.byteLength === 0 on the sending side
```

**Transferable types relevant to this library**:

| Type             | Use case                                               | Browser support                    |
| ---------------- | ------------------------------------------------------ | ---------------------------------- |
| `ArrayBuffer`    | Binary response bodies (`responseType: 'arraybuffer'`) | ✅ All modern browsers             |
| `MessagePort`    | Dedicated communication channel per request            | ✅ All modern browsers             |
| `ReadableStream` | Streaming large responses chunk-by-chunk               | ⚠️ See §3                          |
| `ImageBitmap`    | Image processing results                               | ✅ All modern (iOS Safari partial) |

**Optimization strategy**:

```typescript
if (response.responseType === 'arraybuffer') {
  postMessage({ ...meta, body: response.body }, [response.body]);
} else if (jsonSize > TRANSFER_THRESHOLD) {
  const encoded = new TextEncoder().encode(TOON.stringify(response.body));
  postMessage({ ...meta, body: encoded.buffer }, [encoded.buffer]);
} else {
  postMessage(serializedResponse);
}
```

---

## 3. Transferable Streams — Critical Browser Gap

**Browser support (as of March 2026)**:

| Browser           | Transferable ReadableStream | Notes                       |
| ----------------- | --------------------------- | --------------------------- |
| Chrome/Edge 87+   | ✅ Supported                | Since Dec 2020              |
| Firefox 103+      | ✅ Supported                | Since Jul 2022              |
| **Safari**        | ❌ **Not supported**        | No signal of implementation |
| **Safari on iOS** | ❌ **Not supported**        | Same WebKit limitation      |
| Global coverage   | **~80.86%**                 | Safari is the blocker       |

Source: [caniuse.com/mdn-api_readablestream_transferable](https://caniuse.com/mdn-api_readablestream_transferable)

### Polyfill: remote-web-streams

[`remote-web-streams`](https://github.com/MattiasBuelens/remote-web-streams) provides a `MessageChannel`-based polyfill:

```typescript
import { RemoteReadableStream, RemoteWritableStream } from 'remote-web-streams';

const { writable, readablePort } = new RemoteWritableStream();
const { readable, writablePort } = new RemoteReadableStream();

worker.postMessage({ readablePort, writablePort }, [readablePort, writablePort]);
```

**Trade-off**: Each chunk requires a `postMessage` round-trip. Still better than buffering the entire response.

---

## 4. Request Cancellation — A Missing Primitive

`AbortSignal` is **NOT transferable** via `postMessage` ([WHATWG DOM issue #948](https://github.com/whatwg/dom/issues/948), open since 2021).

### Cancellation strategies

| Strategy                         | Mechanism                                    | Pros                    | Cons                         |
| -------------------------------- | -------------------------------------------- | ----------------------- | ---------------------------- |
| **Cancel message**               | `postMessage({ type: 'cancel', requestId })` | Simple, no special APIs | Async — race window          |
| **SharedArrayBuffer + Atomics**  | Shared flag checked synchronously            | Synchronous signaling   | Requires COOP/COEP headers   |
| **MessagePort per request**      | Closing port signals cancellation            | Clean lifecycle         | More overhead                |
| **Worker.terminate() + respawn** | Nuclear option                               | Guaranteed              | Kills ALL in-flight requests |

**Recommended**: Cancel message + `AbortController` inside worker:

```typescript
// Worker side
const controllers = new Map<string, AbortController>();

self.onmessage = async (event) => {
  if (event.data.type === 'cancel') {
    controllers.get(event.data.requestId)?.abort();
    controllers.delete(event.data.requestId);
    return;
  }

  const controller = new AbortController();
  controllers.set(event.data.requestId, controller);

  try {
    const response = await fetch(event.data.url, { signal: controller.signal });
    // ... process and return
  } finally {
    controllers.delete(event.data.requestId);
  }
};
```

---

## 5. Cross-Origin Isolation (COOP/COEP)

`SharedArrayBuffer` requires:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Many CDNs and third-party services do NOT set these headers. **Decision**: `SharedArrayBuffer` must be opt-in only.

---

## 6. Worker Pool Libraries

| Library                  | Platform            | Key features                                                       | Size    |
| ------------------------ | ------------------- | ------------------------------------------------------------------ | ------- |
| **poolifier-web-worker** | Browser (Deno, Bun) | Round-robin, weighted, fair-share; dynamic scaling                 | ~12 KiB |
| **workerpool**           | Browser + Node      | Task queuing, auto-scaling, timeout, cancellation                  | ~20 KiB |
| **observable-webworker** | Browser (RxJS)      | `fromWorkerPool()`, Observable-native, Transferable auto-detection | ~4 KiB  |

`navigator.hardwareConcurrency` returns logical CPU count (typically 4–16). Workers beyond core count waste memory (~2–5 MB each).

---

## 7. RxJS / Observable Integration

### observable-webworker

[`observable-webworker`](https://github.com/cloudnc/observable-webworker) (~4 KiB) provides RxJS ↔ Worker bridge with `fromWorkerPool()` and Transferable support. **Gap**: class-based `DoWork` interface, not pure-fn.

### DIY bridge (recommended)

```typescript
function workerRequest(
  worker: Worker,
  request: SerializableRequest,
): Observable<SerializableResponse> {
  const requestId = crypto.randomUUID();

  return new Observable<SerializableResponse>((subscriber) => {
    const handler = (event: MessageEvent) => {
      if (event.data.requestId !== requestId) return;
      if (event.data.type === 'error') subscriber.error(event.data.error);
      else {
        subscriber.next(event.data.response);
        subscriber.complete();
      }
      worker.removeEventListener('message', handler);
    };
    worker.addEventListener('message', handler);
    worker.postMessage({ ...request, requestId });
    return () => worker.postMessage({ type: 'cancel', requestId });
  });
}
```

---

## 8. WebCrypto API in Workers

`SubtleCrypto` (HMAC, AES, RSA, ECDSA) is **fully available in Web Workers** ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)). Requires HTTPS.

**Security advantage**: Signing keys live only in worker memory. A compromised main thread (XSS) cannot access them — a **genuine security boundary**.

Viable operations: HMAC signing, AES-GCM encryption, content integrity verification (SHA-256), token generation/rotation.

---

## 9. Partytown — Architecture Lessons

[Partytown](https://partytown.qwik.dev/) (Builder.io) moves third-party scripts to workers using synchronous XHR + Service Worker trick for DOM access.

**Takeaway**: Proves complex worker architectures work at scale, but also demonstrates the fragility of over-engineering the worker boundary. Keep the boundary simple.

---

## 10. RPC Libraries — Comlink and Alternatives

| Feature              | Comlink                  | web-worker-proxy | DIY postMessage |
| -------------------- | ------------------------ | ---------------- | --------------- |
| Size                 | **1.1 KiB**              | ~2 KiB           | 0 KiB           |
| Transferable support | ✅ `Comlink.transfer()`  | ❌               | Manual          |
| Proxy-based API      | ✅ ES6 Proxy             | ✅               | ❌              |
| Observable support   | ❌                       | ❌               | Custom          |
| Vite integration     | ✅ `vite-plugin-comlink` | ❌               | Native          |

**Comlink gap**: No Observable support. Would need wrapper for `HttpEvent` streaming.

---

## 11. Worker Lifecycle and Memory

Workers are NOT garbage-collected. Each consumes ~2–5 MB. Must be explicitly terminated via `DestroyRef`. Lazy creation recommended.

---

## 12. Error Handling Across Threads

| Error type                    | Structured clone? | Handling                               |
| ----------------------------- | ----------------- | -------------------------------------- |
| Network error (`fetch` fails) | ❌ partial        | Serialize error details manually       |
| HTTP error (4xx/5xx)          | ✅                | Return as `SerializableResponse`       |
| Interceptor error (thrown)    | ❌ partial        | Catch, serialize `.message` + `.stack` |
| Worker crash (unhandled)      | N/A               | `worker.onerror` on main thread        |
| Worker OOM / timeout          | N/A               | Needs heartbeat or timeout             |

Errors must be reconstructed as `HttpErrorResponse` so existing Angular error handling works.

---

## 13. Debugging and DevTools

Worker `fetch()` calls **appear in the Network tab** across all major browsers. Breakpoints available in Chrome/Firefox. Safari limited.

---

## 14. Testing Strategy

- **Unit tests**: Pure-fn interceptors testable without workers (Vitest/Jasmine)
- **Integration tests**: Real workers + [MSW](https://mswjs.io/) (intercepts fetch from workers via Service Worker) + Playwright
- **Benchmark tests**: Serialization overhead validation with varying payload sizes

---

## 15. Full Library Ecosystem

| Project                            | How it helps                       | Gap                        |
| ---------------------------------- | ---------------------------------- | -------------------------- |
| **Comlink** (1.1 KiB)              | RPC via ES6 Proxy                  | No Observable support      |
| **vite-plugin-comlink**            | Zero-config worker bundling        | Tied to Comlink            |
| **observable-webworker** (~4 KiB)  | RxJS bridge, pool, Transferable    | Class-based DoWork         |
| **remote-web-streams**             | Streaming polyfill for Safari      | Extra round-trip per chunk |
| **poolifier-web-worker** (~12 KiB) | Worker pool strategies             | May be overkill            |
| **seroval** (~5 KiB)               | Circular refs, custom serializers  | Complex API                |
| **TOON** (`@byjohann/toon`)        | Key-dedup for uniform arrays       | Spec still draft           |
| **FlatBuffers** (~15 KiB)          | Zero-copy binary                   | Requires `.fbs` schema     |
| **MSW**                            | Mocks fetch in workers for testing | Test-only                  |
| **Web Crypto API** (native)        | HMAC, AES, RSA in workers          | Requires HTTPS             |
