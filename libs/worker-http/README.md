# 🚀 @angular-helpers/worker-http

Move Angular HTTP requests and real-time streams off the main thread. Runs `fetch()`, WebSockets, SSE, and request interceptors inside Web Workers, protecting UI frame rates from network and serialization latency while keeping cryptographic signing keys isolated from the main thread.

---

## Quick Path

### 1. Installation

```bash
pnpm add @angular-helpers/worker-http
```

### 2. Provider Setup (Main Thread)

Replace or augment your default Angular `HttpBackend` with `provideWorkerHttpClient`:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideWorkerHttpClient } from '@angular-helpers/worker-http/backend';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideWorkerHttpClient({
      workerUrl: new URL('./workers/http-api.worker', import.meta.url),
      poolSize: 2, // Automatic round-robin worker pool
    }),
  ],
};
```

### 3. Worker Implementation (`http-api.worker.ts`)

```typescript
import {
  createWorkerPipeline,
  loggingInterceptor,
  retryInterceptor,
} from '@angular-helpers/worker-http/interceptors';

createWorkerPipeline({
  interceptors: [loggingInterceptor(), retryInterceptor({ maxRetries: 3, backoffMs: 500 })],
});
```

Now, every standard `HttpClient` call in your Angular components automatically routes through the worker pipeline with zero changes to your application code.

---

## Architecture at a Glance

```
Main Thread (Angular UI)                 Dedicated Web Worker
─────────────────────────                 ──────────────────────────────────
HttpClient                                WorkerHttpBackend
  └─ inject(HttpClient)                    └─ createWorkerPipeline([
       └─ WorkerTransport                       retryInterceptor(),
            └─ postMessage (zero-copy)  ──────►  hmacSigningInterceptor(),
                                        ◄──────  cacheInterceptor()
                                               ])
                                                 └─ fetch() ──► API Server
```

---

## Secondary Entry Points

| Entry Point                                     | Description                                                                           |
| :---------------------------------------------- | :------------------------------------------------------------------------------------ |
| `@angular-helpers/worker-http/backend`          | Angular `HttpBackend` replacement — `provideWorkerHttpClient()`.                      |
| `@angular-helpers/worker-http/transport`        | Low-level typed RPC bridge, round-robin worker pool, and cancellation controller.     |
| `@angular-helpers/worker-http/interceptors`     | Composable, pure-function worker interceptors (retry, cache, logging, offline queue). |
| `@angular-helpers/worker-http/serializer`       | Zero-copy serializers (Structured Clone, TOON, auto-detect).                          |
| `@angular-helpers/worker-http/crypto`           | Isolated WebCrypto primitives (HMAC signing, SHA hashing) within the worker thread.   |
| `@angular-helpers/worker-http/realtime`         | Off-main-thread WebSocket and Server-Sent Events clients.                             |
| `@angular-helpers/worker-http/streams-polyfill` | Transferable streams polyfill for cross-browser stream compatibility.                 |

---

## Key Guarantees

- **Zero UI Stalls**: Heavy JSON parsing, chunk decoding, and network handling run on a separate OS thread.
- **Cryptographic Isolation**: API signing keys never touch main thread memory, mitigating DOM-based XSS token theft.
- **Zero-Copy Performance**: Uses native `Transferable` buffers for high-throughput responses.
- **Drop-in Compatibility**: Works transparently with existing Angular `HttpClient` services.

---

## Interactive Documentation & Benchmarks

Explore live benchmarks comparing main thread vs worker HTTP throughput:
👉 **[Angular Helpers Worker HTTP Docs](https://gaspar1992.github.io/angular-helpers/docs/worker-http)**
👉 **[Worker HTTP Benchmark Suite](https://gaspar1992.github.io/angular-helpers/demo/worker-http-benchmark)**

---

## License

MIT
