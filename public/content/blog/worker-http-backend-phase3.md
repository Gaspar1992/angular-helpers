---
title: 'worker-http v0.3.0: Angular HttpBackend integration — HTTP off the main thread'
publishedAt: 2026-04-13
tags: [worker-http, performance, angular, web-workers, architecture]
excerpt: How we replaced Angular's HttpBackend to route HTTP requests through Web Workers — zero API change for the developer, zero cost for the main thread.
---

Every `HttpClient` call runs on the main thread. That's fine for a fast API. It's invisible when responses come back in 50ms. But the main thread has a finite event loop budget, and under load — slow APIs, large payloads, burst traffic — those network callbacks compete with your rendering, your animations, your user interactions.

This is the problem `worker-http` Phase 3 solves. Not by changing how you write HTTP calls. By moving where they run.

## The objective

Make Angular's `HttpClient` work off the main thread **without changing the developer's code**.

That's a strong constraint. The developer shouldn't have to:

- Learn a new HTTP client API
- Change how they write services
- Manually manage Workers
- Add per-request configuration (unless they want to)

The result should feel like adding one provider to `app.config.ts` and getting off-main-thread HTTP for free.

## How Angular's HttpBackend works

Angular's HTTP stack is layered:

```
HttpClient
  └─ HttpInterceptorHandler (interceptor chain)
       └─ HttpBackend (sends the actual request)
```

`HttpBackend` is the lowest layer — it's what actually calls `fetch()`. Angular ships one implementation: `FetchBackend`.

If you replace `HttpBackend` with your own implementation, you control where requests go. That's the seam we exploit.

## What we built

### `WorkerHttpBackend`

An `HttpBackend` implementation that, instead of calling `fetch()` directly, serializes the request into a structured-clone-safe POJO and dispatches it to a Web Worker via `postMessage`.

```
Main thread                             Web Worker
──────────────────────────────────────  ─────────────────────────────────
HttpClient                              createWorkerPipeline([
  └─ interceptor chain                    loggingInterceptor(),
       └─ WorkerHttpBackend               retryInterceptor({ maxRetries: 3 }),
            └─ WorkerTransport            cacheInterceptor({ ttl: 60000 }),
                 └─ postMessage ───────►  hmacSigningInterceptor(...),
                                ◄───────  ])
                                transfer
                                (zero-copy)
                                         fetch() ──► API Server
```

The main thread sends a serialized request. The worker runs the interceptor pipeline, calls `fetch()`, and posts the response back. The `WorkerHttpBackend` receives the response, converts it to an `HttpResponse`, and returns it through the observable chain.

The main thread never blocked. The network operation ran entirely on a separate OS thread.

### `provideWorkerHttpClient()`

A provider function that replaces `provideHttpClient()`:

```ts
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideWorkerHttpClient(
      withWorkerConfigs([
        {
          id: 'api',
          workerUrl: new URL('./workers/api.worker', import.meta.url),
          maxInstances: 2,
        },
      ]),
      withWorkerRoutes([{ pattern: /\/api\//, worker: 'api', priority: 1 }]),
      withWorkerFallback('main-thread'),
    ),
  ],
};
```

And in your service — nothing changes:

```ts
export class DataService {
  private http = inject(WorkerHttpClient);

  getUsers() {
    return this.http.get<User[]>('/api/users');
  }
}
```

`WorkerHttpClient` is a thin wrapper over `HttpClient` that adds an optional `{ worker: string }` field. If you don't use it, the URL routing rules decide which worker handles the request. If no rule matches, the fallback strategy applies — either `'main-thread'` (SSR-safe) or `'error'`.

## The feature composition model

`provideWorkerHttpClient` takes optional features as arguments, following the same pattern Angular itself uses for `provideHttpClient(withInterceptors(...))`. This keeps the API composable and tree-shakable.

| Feature                               | What it does                                 |
| ------------------------------------- | -------------------------------------------- |
| `withWorkerConfigs(configs)`          | Registers named worker definitions           |
| `withWorkerRoutes(routes)`            | URL-pattern → worker routing                 |
| `withWorkerFallback(strategy)`        | SSR / unsupported-browser behavior           |
| `withWorkerSerialization(serializer)` | Custom serializer for complex request bodies |

Each `with*` function returns a `WorkerHttpFeature<Kind>` value. The `provideWorkerHttpClient` function collects all features and flattens their providers into an `EnvironmentProviders` object.

## URL routing

Route matching uses `matchWorkerRoute(url, routes)` — a pure function, independently testable, no Angular involved:

```ts
const routes: WorkerRoute[] = [
  { pattern: /\/api\/secure\//, worker: 'secure', priority: 10 },
  { pattern: /\/api\//, worker: 'api', priority: 5 },
];

matchWorkerRoute('/api/secure/payments', routes); // → 'secure'
matchWorkerRoute('/api/users', routes); // → 'api'
matchWorkerRoute('/public/logo.png', routes); // → null (fallback)
```

Routes are sorted by `priority` descending before evaluation. Patterns can be `RegExp` (uses `.test()`) or `string` (prefix match with `.includes()`).

## Per-request override

For cases where routing rules aren't enough, `WorkerHttpClient` accepts an explicit `worker` field:

```ts
this.http.get('/api/secure/payments', { worker: 'secure' });
```

Internally, this sets the `WORKER_TARGET` `HttpContextToken`, which `WorkerHttpBackend` reads to bypass URL routing.

## Serialization boundary

Worker communication uses `postMessage`, which runs the browser's structured clone algorithm by default. Structured clone handles most primitive types, arrays, and plain objects well. But it silently loses `Date` (converts to epoch), `Map`, `Set`, `RegExp`, and `undefined` values.

The `withWorkerSerialization(serializer)` feature lets you plug in a custom serializer that runs on the main-thread side before the `postMessage` call. The worker side receives the serialized form — adding a worker interceptor to deserialize is the developer's responsibility.

For most use cases, structured clone is sufficient. For complex bodies (e.g., `Date` objects in request payloads), pair with `createSerovalSerializer()` from `@angular-helpers/worker-http/serializer`.

## SSR

When `typeof Worker === 'undefined'` (Node.js, SSR), `WorkerHttpBackend` falls back depending on the strategy:

- `'main-thread'`: delegates to Angular's `FetchBackend`, which `ng serve --ssr` provides. Requests still complete, just on the main thread.
- `'error'`: throws immediately. Use this if you need hard guarantees that requests never run main-thread.

The default is `'main-thread'`. If you don't call `withWorkerFallback()`, that's what you get.

## What's NOT in this release

To keep the scope focused:

- **No Angular interceptor bridge**: Worker-side interceptors (`createWorkerPipeline`) are pure functions. They don't integrate with Angular's DI-based interceptor chain. That's a deliberate boundary — worker code has no Angular runtime.
- **No response caching at the backend level**: Caching belongs in the worker interceptor pipeline, where it already exists via `cacheInterceptor`.
- **No automatic worker bundling**: Angular CLI doesn't detect `new Worker(url)` inside a library. You provide the `workerUrl` pointing to your pre-built worker file. The CLI doesn't touch it.

## Testing

79 unit tests cover:

- `matchWorkerRoute` edge cases (empty routes, priority ordering, string prefix vs RegExp)
- All `with*` feature functions (provider registration, token values)
- `WorkerHttpBackend` routing logic (mocked transport, SSR fallback, WORKER_TARGET context)
- `toSerializableRequest` / `toHttpResponse` round-trip fidelity

The test environment is Vitest with `vitest.setup.ts` bootstrapping Angular's JIT compiler for `TestBed` support.

## What comes next

Phase 4 will close the remaining gaps:

- **Response deserialization helper**: a worker interceptor that knows how to undo what `withWorkerSerialization` applied on the main-thread side
- **E2E test coverage**: Playwright test verifying a real HTTP call goes through the worker and back
- **Bundle analysis**: we want concrete kB numbers for each entry point

If you're using `@angular-helpers/worker-http` and hit a rough edge, [open an issue](https://github.com/Gaspar1992/angular-helpers/issues).
