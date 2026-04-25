---
title: 'worker-http v1.0.0: The Journey from Proof-of-Concept to Production'
publishedAt: '2026-04-25'
tags: ['worker-http', 'v1.0', 'web-workers', 'angular', 'esbuild', 'schematics', 'safari']
excerpt: 'Five phases, three new entry points, one schematic, and a lot of lessons learned. The complete story of how @angular-helpers/worker-http went from a promising experiment to a production-ready toolkit for off-main-thread HTTP.'
---

# worker-http v1.0.0: The Journey from Proof-of-Concept to Production

Five phases. Three new entry points. One schematic. And a lot of lessons learned along the way.

Today we are shipping **@angular-helpers/worker-http v1.0.0** — a production-ready toolkit for running HTTP requests off the main thread in Angular applications. This is not just a version bump; it is the culmination of a deliberate journey from "promising experiment" to "ready for real workloads."

Here is the complete story.

---

## Phase 0: The Foundation (v0.1 — v0.6)

Before we get to 1.0, we need to acknowledge what came before. The worker-http package started as a simple question: _what if `HttpClient` ran in a Web Worker?_

The early versions established the core architecture:

- **`/transport`** — A typed RPC bridge between main thread and worker
- **`/interceptors`** — Pure-function middleware that runs inside the worker
- **`/backend`** — An `HttpBackend` replacement that routes requests to workers
- **`/crypto`** — WebCrypto primitives (HMAC, AES, hashing) that never touch the main thread
- **`/serializer`** — Pluggable serialization for complex payloads

The pattern was solid: developers use `HttpClient` normally, but `fetch()` runs on a separate OS thread. The main thread only pays for the `postMessage` handoff.

But "solid pattern" is not "production ready." We needed hardening.

---

## Phase 1: Hardening (v0.7)

Version 0.7.0 was a full audit. We found three bugs hiding in plain sight:

### Bug 1: Cancellation That Did Not Cancel

The API advertised Observable-based cancellation. Unsubscribe from the request, and the worker should stop. **It did not.** The worker kept the `AbortSignal` to itself; unsubscribing only ignored the response.

**The fix:** Thread the signal through. The transport now posts a `cancel` message; the worker-side message loop propagates it into `fetch()`. The HTTP request actually aborts.

### Bug 2: A Timeout Option That Did Nothing

`requestTimeout` was documented. It was in the config interface. It was even destructured in the code. **It was never used.**

**The fix:** Actually implement the timeout. Now it rejects with `WorkerHttpTimeoutError` and sends a cancel message to the worker.

### Bug 3: A Latent AES Bug

The AES-CBC/CTR streaming path called `crypto.subtle.importKey` with `AesCbcParams` directly. That algorithm is not importable. **Every call threw.** Nobody noticed because the streaming path was never actually used.

**The fix:** Fix the algorithm name constant. Add test coverage. Ship with confidence.

**Lesson:** Documentation claims are liabilities. If the API says it does something, it must be tested. Full stop.

---

## Phase 2: Infrastructure (v1.0 Phase 1)

With the core hardened, we turned to developer experience. Three new entry points would make the package actually usable in real projects.

### Entry Point 1: `esbuild-plugin`

When you write interceptors, you need them in the worker bundle. Manually importing them is error-prone. The esbuild plugin auto-discovers interceptor files and injects them:

```typescript
// esbuild.config.ts
import { workerHttpPlugin } from '@angular-helpers/worker-http/esbuild-plugin';

export default {
  plugins: [
    workerHttpPlugin({
      autoDiscover: true, // Scan src/ for *interceptor*.ts
    }),
  ],
};
```

**Key decisions:**

- Same package, separate entry point — consistent with the rest of the library
- Explicit `interceptors` option for manual control
- Auto-discovery by filename pattern for convenience
- Test files (`.spec.ts`, `.test.ts`) automatically excluded

### Entry Point 2: `streams-polyfill`

Safari 16-17 lack transferable `ReadableStream`/`TransformStream` support. If your app uses streaming responses, you hit `DataCloneError` on those browsers.

The streams-polyfill entry point provides:

- `needsPolyfill()` — Feature detection for Safari 16-17
- `ponyfillStreams()` — Lazy-loaded polyfill via `web-streams-polyfill`

Enabled via the main backend:

```typescript
provideWorkerHttpClient(
  withWorkerConfigs([...]),
  withWorkerStreamsPolyfill(), // Opt-in for Safari compatibility
);
```

**Key decisions:**

- Ponyfill, not polyfill — we do not mutate globals unless necessary
- Lazy-loaded — 0 bytes for modern browsers
- Opt-in — explicit is better than implicit

### Entry Point 3: `schematics/ng-add`

The schematic is the crown jewel of v1.0. One command sets up everything:

```bash
ng add @angular-helpers/worker-http
```

This single command:

1. Installs the package
2. Creates `src/app/workers/http-api.worker.ts` from a template
3. Updates `tsconfig.json` with the `webworker` lib
4. Adds `provideWorkerHttpClient()` to `app.config.ts`

**Options:**

```bash
ng add @angular-helpers/worker-http \
  --workerPath=src/workers/api.worker.ts \
  --installEsbuildPlugin=true
```

**Key decisions:**

- Default worker path: `src/app/workers/http-api.worker.ts`
- Configurable via CLI options
- Safe to run multiple times (checks for existing configuration)
- Only updates files that need updating

---

## Phase 3: Integration (v1.0 Phases 2-4)

Infrastructure is only useful if it is wired together. We spent significant time on integration:

### Transport Integration

The `streamsPolyfill` option in `WorkerTransportConfig` enables the polyfill at the transport layer. The transport lazy-loads it on first request, ensuring zero overhead until needed.

### Backend Integration

`withWorkerStreamsPolyfill()` is a new feature function that sets the `WORKER_HTTP_STREAMS_POLYFILL_TOKEN`. The backend passes this to the transport automatically.

### Schematic Integration

The schematic does more than copy files. It:

- Parses and modifies `angular.json` (for esbuild plugin config)
- Parses and modifies `tsconfig.json` (for webworker lib)
- Parses and modifies `app.config.ts` (for provider injection)
- Handles edge cases (file already exists, already configured, etc.)

**Lesson:** A schematic that only works in the "happy path" is a support burden. Handle the edge cases.

---

## Phase 4: Documentation (v1.0 Phase 5)

Features are only features if people can find them. We updated:

- **`README.md`** — New Installation section with ng-add, esbuild-plugin docs, streams-polyfill docs
- **`README.es.md`** — Full Spanish translation
- **`MIGRATION.md`** — Guide for 0.7 → 1.0 (spoiler: zero breaking changes)

**Key decisions:**

- Installation first — ng-add is the recommended path
- Feature sections follow the same order as entry points
- Migration guide emphasizes compatibility — upgrading should be painless

---

## Phase 5: The Blog Post (You Are Reading It)

Every significant implementation in angular-helpers includes a blog post. This one serves two purposes:

1. **Technical retrospective** — Document the journey, the decisions, and the lessons
2. **User guide** — Explain why v1.0 matters and how to use it

The blog post must cover:

- The problem being solved (HTTP on the main thread blocks UI)
- The objective (move it to workers, keep the same API)
- Key architecture decisions (pure functions, lazy loading, opt-in features)
- API surface with examples
- What is NOT in scope (WebSocket support, HTTP/2 push, etc.)

---

## What Is New in v1.0.0

| Feature                 | Entry Point                    | Description                          |
| ----------------------- | ------------------------------ | ------------------------------------ |
| ng-add schematic        | `@angular-helpers/worker-http` | One-command setup                    |
| esbuild plugin          | `/esbuild-plugin`              | Auto-bundle interceptors             |
| Safari streams polyfill | `/streams-polyfill`            | Transferable streams on Safari 16-17 |

### API Quick Reference

**Setup with ng-add (recommended):**

```bash
ng add @angular-helpers/worker-http
```

**Setup manually:**

```typescript
// app.config.ts
import { provideWorkerHttpClient, withWorkerConfigs } from '@angular-helpers/worker-http/backend';

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
    ),
  ],
};
```

**Using the client:**

```typescript
// Any component — drop-in replacement for HttpClient
export class DataService {
  private http = inject(WorkerHttpClient);

  getUsers() {
    return this.http.get<User[]>('/api/users');
  }
}
```

**Optional Safari polyfill:**

```typescript
import { withWorkerStreamsPolyfill } from '@angular-helpers/worker-http/backend';

provideWorkerHttpClient(
  withWorkerConfigs([...]),
  withWorkerStreamsPolyfill(),
);
```

**Optional esbuild plugin:**

```typescript
import { workerHttpPlugin } from '@angular-helpers/worker-http/esbuild-plugin';

export default {
  plugins: [workerHttpPlugin({ autoDiscover: true })],
};
```

---

## What Is NOT in Scope

Explicit bounds are as important as features:

- **WebSocket support** — Out of scope for 1.0. The architecture supports it, but the API needs more design.
- **HTTP/2 Server Push** — Deprecated by browsers; not supported.
- **Automatic Worker Pool Sizing** — `maxInstances` is manual. Auto-scaling based on load is future work.
- **Main-Thread Interceptors** — Interceptors run in the worker only. Main-thread "interceptors" should use `withTelemetry()` or standard Angular HTTP interceptors.

---

## Lessons Learned

1. **Test the claims.** If the API says it cancels, test cancellation. If it says it times out, test timeouts. Documentation is a contract.

2. **Schematics are user experience.** A library that requires five manual steps to set up will have lower adoption than one that uses `ng add`.

3. **Polyfills should be ponyfills.** Do not mutate globals unless absolutely necessary. And always lazy-load.

4. **Feature detection over user-agent sniffing.** `needsPolyfill()` checks capabilities, not browser versions. This is more robust and forward-compatible.

5. **Integration is the hard part.** Getting the esbuild plugin to correctly inject imports into worker files required understanding esbuild's plugin lifecycle, onLoad hooks, and filter patterns.

---

## What Is Next

Version 1.0.0 is a **stable foundation**, not a final destination. Future work might include:

- Worker pool auto-scaling based on request load
- WebSocket support for real-time data
- Additional serialization formats (MessagePack, Protobuf)
- Performance profiling tools for worker overhead

But for now, the toolkit is complete. It handles the 95% use case: moving HTTP off the main thread with minimal friction.

---

## Try It Today

```bash
ng add @angular-helpers/worker-http
```

Or if you prefer manual setup:

```bash
npm install @angular-helpers/worker-http
```

Full documentation: [README](https://github.com/Gaspar1992/angular-helpers/blob/main/packages/worker-http/README.md)

Migration guide: [MIGRATION.md](https://github.com/Gaspar1992/angular-helpers/blob/main/packages/worker-http/MIGRATION.md)

---

**Five phases. Three entry points. One schematic. Production ready.**

Happy coding. 🚀
