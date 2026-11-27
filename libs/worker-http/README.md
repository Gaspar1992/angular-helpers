# 🚀 @angular-helpers/worker-http

Off-main-thread Angular `HttpClient` and `httpResource` transport powered by Web Workers — keeping JSON parsing, retries, caching, and WebCrypto HMAC signing off the UI thread.

---

## Quick Path

### 1. Installation & Schematic

```bash
pnpm add @angular-helpers/worker-http
ng add @angular-helpers/worker-http
```

### 2. Provider Setup (`app.config.ts`)

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  provideWorkerHttpClient,
  withWorkerConfigs,
  withWorkerRoutes,
} from '@angular-helpers/worker-http/backend';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideWorkerHttpClient(
      withWorkerConfigs([
        {
          id: 'http',
          workerUrl: new URL('./app.worker', import.meta.url),
          maxInstances: 2,
        },
      ]),
      withWorkerRoutes([{ pattern: /^\/api\//, worker: 'http' }]),
    ),
  ],
};
```

### 3. Worker Entry (`app.worker.ts`)

```typescript
import {
  createWorkerMessageLoop,
  retryInterceptor,
  loggingInterceptor,
} from '@angular-helpers/worker-http/backend';

createWorkerMessageLoop({
  interceptors: [loggingInterceptor(), retryInterceptor({ maxRetries: 2 })],
});
```

### 4. Targeting Workers with `httpResource`

```typescript
import { httpResource, HttpContext } from '@angular/common/http';
import { WORKER_TARGET } from '@angular-helpers/worker-http/backend';

readonly users = httpResource(() => ({
  url: '/api/users',
  context: new HttpContext().set(WORKER_TARGET, 'http'),
}));
```

---

## Secondary Entry Points

| Entry Point                                 | Description                                                                                                     |
| :------------------------------------------ | :-------------------------------------------------------------------------------------------------------------- |
| `@angular-helpers/worker-http/backend`      | `provideWorkerHttpClient`, `withWorkerConfigs`, `withWorkerRoutes`, `WORKER_TARGET`, `createWorkerMessageLoop`. |
| `@angular-helpers/worker-http/transport`    | Low-level typed RPC bridge and worker pool primitives.                                                          |
| `@angular-helpers/worker-http/interceptors` | Composable worker-side interceptors (retry, cache, logging, offline queue).                                     |
| `@angular-helpers/worker-http/serializer`   | Zero-copy serializers (Structured Clone, TOON, auto-detect).                                                    |
| `@angular-helpers/worker-http/crypto`       | Worker-isolated WebCrypto HMAC signing and SHA hashing.                                                         |
| `@angular-helpers/worker-http/realtime`     | Off-main-thread WebSocket and SSE clients.                                                                      |

---

## Interactive Documentation & Demo

👉 **[Worker HTTP Docs](https://gaspar1992.github.io/angular-helpers/docs/worker-http)**
👉 **[Worker HTTP Benchmark Demo](https://gaspar1992.github.io/angular-helpers/demo/worker-http-benchmark)**

## License

MIT
