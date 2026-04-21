# Spec: worker-http Hardening

**Linked proposal**: `.sdd/proposal.md`
**Target package**: `@angular-helpers/worker-http`
**Target version**: `0.7.0`

---

## Functional Requirements

### FR-1 — Request cancellation must abort the underlying `fetch()`

When the main thread unsubscribes from an Observable returned by `transport.execute(request)`, the in-flight `fetch()` inside the worker **MUST** be aborted.

**Acceptance**:

- Given a worker is executing `fetch()` with a slow backend
- When the main thread unsubscribes before the response arrives
- Then the worker's `AbortController.abort()` is called on the signal that was passed to `fetch()`
- And the worker posts an `error` message with `name: 'AbortError'` (or doesn't post anything; decided in design)
- And no `response` message for that `requestId` reaches the main thread
- And the pending controller entry in the worker is cleaned up

### FR-2 — `requestTimeout` must reject after the configured duration

When a consumer provides `requestTimeout: N` to `createWorkerTransport`, an `execute()` Observable **MUST** emit an error if the response doesn't arrive within N ms.

**Acceptance**:

- Given `createWorkerTransport({ requestTimeout: 100 })`
- When a worker doesn't respond within 100 ms
- Then the Observable errors with an instance of `WorkerHttpTimeoutError`
- And the error message includes the timeout value (e.g. `"Worker request timed out after 100 ms"`)
- And the transport posts `{ type: 'cancel', requestId }` to the worker
- And the timer is cleared if the response arrives within the window (no double reject)
- And default timeout is `30000` ms when `requestTimeout` is omitted

### FR-3 — `transferDetection: 'auto'` must pass transferables on `postMessage`

When `transferDetection: 'auto'` is set, `postMessage` **MUST** include a transfer list containing every `ArrayBuffer` / `MessagePort` / `ImageBitmap` / `OffscreenCanvas` found by shallow inspection of the payload.

**Acceptance**:

- Given `createWorkerTransport({ transferDetection: 'auto' })`
- And a request payload containing an `ArrayBuffer` at any top-level or one-level-nested field
- When `execute()` is called
- Then `worker.postMessage(msg, transferList)` is invoked with `transferList` containing the buffer instance
- And the buffer's `byteLength` becomes `0` in the main thread after post (transferred, not cloned)

When `transferDetection: 'none'` (default), no transfer list is passed — current behavior preserved.

### FR-4 — `executeFetch()` must receive and honor `AbortSignal`

The internal `executeFetch(req, signal?)` already accepts a signal. **MUST** be called with a signal that is connected to the request's per-request `AbortController` from `worker-message-loop.ts`.

**Acceptance**:

- The `RequestHandler` type (or its wrapper) carries the signal from the message loop into `executeFetch`.
- Unit test: calling `buildChain(fns, (req) => executeFetch(req, signal))` with an already-aborted signal causes the first `await next(req)` inside any interceptor to throw `AbortError`.

### FR-5 — `WORKER_HTTP_VERSION` must be removed

The constant `WORKER_HTTP_VERSION = '0.0.1'` **MUST** be removed from `packages/worker-http/src/public-api.ts`.

**Acceptance**:

- `grep -r "WORKER_HTTP_VERSION" packages/worker-http` returns no matches in source (excluding `dist/`).
- The package still builds with `npm run build` in `packages/worker-http/`.

### FR-6 — Unit test coverage for `transport/`

The file `packages/worker-http/transport/src/create-worker-transport.spec.ts` **MUST** exist and cover at minimum:

- Lazy worker creation (no worker created until first `execute()`)
- Round-robin dispatch with `maxInstances = 2`
- Response correlation isolation (parallel requests don't cross-talk)
- Cancel on unsubscribe (posts `{ type: 'cancel', requestId }`)
- `requestTimeout` rejects after N ms with `WorkerHttpTimeoutError`
- `transferDetection: 'auto'` passes detected ArrayBuffers as transfer list
- `transferDetection: 'none'` (default) passes no transfer list
- Error from worker `error` event rejects the Observable
- `terminate()` terminates all workers; subsequent `execute()` rejects synchronously
- `initMessage` is posted before any request message

**Acceptance**: 10+ passing tests, all green in `npm test` inside `packages/worker-http/`.

### FR-7 — Unit test coverage for `crypto/`

Three new spec files:

- `packages/worker-http/crypto/src/hmac-signer.spec.ts` — round-trip sign + verify for SHA-256/384/512, reject on invalid key material.
- `packages/worker-http/crypto/src/aes-encryptor.spec.ts` — round-trip encrypt + decrypt for GCM/CBC/CTR, reject tampered ciphertext on GCM, verify IV length.
- `packages/worker-http/crypto/src/content-hasher.spec.ts` — known-vector assertions for SHA-256/384/512 against standard test vectors (e.g. NIST "abc").

**Acceptance**: All three files exist, all tests pass, at least 3 tests per file.

### FR-8 — Unit test coverage for `serializer/` variants

Two new spec files:

- `packages/worker-http/serializer/src/seroval-serializer.spec.ts` — class instance round-trip, circular reference handling, `Map` and `Set` round-trip.
- `packages/worker-http/serializer/src/structured-clone-serializer.spec.ts` — plain object round-trip, primitives + `Date` + `ArrayBuffer`, behavior on unsupported types (functions, symbols).

**Acceptance**: Both files exist, all tests pass.

### FR-9 — README accuracy

Both `packages/worker-http/README.md` and `README.es.md` **MUST** reflect the hardened behavior:

- Cancellation: document that `AbortSignal` is plumbed to `fetch()` and the in-flight request is aborted.
- Timeout: document default (30 s) and how to override, including the `WorkerHttpTimeoutError` name.
- Transferables: document that `transferDetection` defaults to `'none'`, opt-in to `'auto'` for zero-copy ArrayBuffer.

**Acceptance**: A reviewer reading only the READMEs can predict the behavior of each feature without consulting source.

### FR-10 — Hardening blog post

New file at `public/content/blog/worker-http-hardening.md` with YAML frontmatter (`title`, `publishedAt`, `tags`, `excerpt`) and a body covering:

- The three bugs found (brief reproduction steps)
- Root cause of each
- How we fixed them (1-paragraph per fix)
- Test strategy added in this PR

Registered in `src/app/blog/config/posts.data.ts`.

**Acceptance**: Post visible on the blog route; `test/browser/blog.spec.ts` (or equivalent) still passes.

### FR-11 — Version bump

`packages/worker-http/package.json` **MUST** be updated from `0.6.0` to `0.7.0`. Conventional commits emitted across the PR MUST include at least one `feat:` to trigger the minor bump via semantic-release.

**Acceptance**: `grep '"version"' packages/worker-http/package.json` returns `"0.7.0"`.

### FR-12 — GitHub Project #1 sync

The GitHub Project at `https://github.com/users/Gaspar1992/projects/1` **MUST** be updated:

- **Mark as Done (new items)**: benchmark suite (PR #63), `withWorkerInterceptors()` (PR #67), SSR + TransferState (PR #75), Telemetry hooks (PR #78), benchmark 6-stage instrumentation (PR #82).
- **Add new Backlog items**: the 7 work items listed in the proposal (cancellation fix, timeout, transferables, tests ×3 sub-packages, version constant removal).
- **Keep existing Backlog items**: `ng add` schematic, v1.0 closing blog, API docs / migration guide, Safari streams polyfill, esbuild plugin for interceptor pipeline.

**Acceptance**: After this change, `gh project item-list 1 --owner Gaspar1992` shows every landed PR reflected and every in-flight work item tracked.

---

## Non-Functional Requirements

### NFR-1 — No runtime performance regression

Timeout implementation MUST add ≤1 timer per request. Transferable detection MUST walk at most one level deep and cost ≤ O(n) in the number of top-level keys. Benchmark (`src/app/demo/worker-http-benchmark`) MUST show no regression > 5% on the p50 of the 6-stage pipeline.

### NFR-2 — No new runtime dependencies

No new entries in `packages/worker-http/package.json#peerDependencies` or `devDependencies` beyond what already exists.

### NFR-3 — Tree-shaking preserved

The `transport`, `serializer`, `backend`, `interceptors`, `crypto` sub-entries MUST remain independently importable. Bundle size MUST NOT increase > 2% on any sub-entry (measured via `dist/worker-http/*/fesm2022/*.mjs` byte size).

### NFR-4 — Zoneless compatibility

All new code MUST be zoneless-safe (no `NgZone` touches, no `detectChanges` calls). Existing code is already zoneless-safe; we preserve that invariant.

### NFR-5 — Accessibility (blog post)

The blog post MUST pass the repo's AXE checks (same pipeline as other blog posts; no new burden beyond the existing tests).

### NFR-6 — Lint / format

`npm run format:check` and `npm run lint` MUST pass before any commit. Follow the repo rule (see memory `967948ff`).

---

## Scenarios

### S-1 — Typical cancellation (HTTP GET aborted mid-flight)

1. Main thread subscribes to `http.get('/api/slow')` via `WorkerHttpClient`.
2. Backend takes 5 s to respond; main thread unsubscribes after 100 ms.
3. Transport posts `{ type: 'cancel', requestId }` to the worker.
4. Worker calls `controller.abort()` on the controller whose signal was passed to `fetch()`.
5. `fetch()` throws `AbortError`.
6. Worker does NOT post a `response` message.
7. Main thread subscriber never receives `next` for this request.

### S-2 — Request times out

1. `createWorkerTransport({ requestTimeout: 1000 })`.
2. `execute(req)` dispatched. Worker takes 2 s (simulated with slow fake).
3. At t=1000, transport clears listeners, posts cancel, rejects with `WorkerHttpTimeoutError('Worker request timed out after 1000 ms')`.
4. Worker eventually aborts its own `fetch()` (via cancel); no late `response` leaks.

### S-3 — Transferable auto-detection

1. `createWorkerTransport({ transferDetection: 'auto' })`.
2. Request body contains `{ data: ArrayBuffer }` with `byteLength = 1_000_000`.
3. `postMessage(msg, [buffer])` is called.
4. After post: `buffer.byteLength === 0` in the main thread.
5. Worker receives the buffer and can `new Uint8Array(req.data)` with full data.

### S-4 — Transferable detection disabled (default, backwards-compat)

1. `createWorkerTransport({})` — no `transferDetection` specified.
2. Same payload as S-3.
3. `postMessage(msg)` — no transfer list.
4. After post: `buffer.byteLength === 1_000_000` in both threads (cloned).

### S-5 — Remove stale version constant

1. Consumer upgrades from `@angular-helpers/worker-http@0.6.0` to `0.7.0`.
2. If their code does `import { WORKER_HTTP_VERSION } from '@angular-helpers/worker-http'`, TypeScript fails with "has no exported member".
3. Consumer migrates to reading `package.json.version` (or removes the usage).
4. CHANGELOG entry explicitly mentions removal.

### S-6 — Interceptor chain respects abort signal

1. `createConfigurableWorkerPipeline()` with a `retryInterceptor`.
2. Main thread cancels mid-retry.
3. The `delay()` inside retry interceptor should resolve — then the next `await next(req)` call propagates the abort because the signal-aware `finalHandler` passes the now-aborted signal to `fetch()`.
4. User sees `AbortError` propagate out. No hanging retries.

(Note: this scenario proves that approach B — signal threaded via closure around the final handler — suffices without touching interceptor signatures.)

---

## Acceptance Criteria Summary

| ID    | Description                                           | How to verify                                              |
| ----- | ----------------------------------------------------- | ---------------------------------------------------------- |
| AC-1  | Cancel aborts underlying fetch                        | New transport test + manual demo                           |
| AC-2  | `requestTimeout` rejects + cleans up                  | New transport test                                         |
| AC-3  | `transferDetection: 'auto'` transfers ArrayBuffers    | New transport test checking buffer detachment              |
| AC-4  | `transferDetection: 'none'` default preserved         | New transport test                                         |
| AC-5  | `WORKER_HTTP_VERSION` removed                         | `grep` returns empty in `packages/worker-http/src/`        |
| AC-6  | Transport test file ≥ 10 tests                        | `npm test` in `packages/worker-http/`                      |
| AC-7  | Crypto test files (3) all pass                        | `npm test` in `packages/worker-http/`                      |
| AC-8  | Serializer test files (2) all pass                    | `npm test` in `packages/worker-http/`                      |
| AC-9  | README (EN + ES) describes new behavior correctly     | Manual review                                              |
| AC-10 | Blog post rendered on `/blog/worker-http-hardening`   | `test/browser/blog.spec.ts` passes                         |
| AC-11 | Package version is `0.7.0`                            | `grep version packages/worker-http/package.json`           |
| AC-12 | GitHub Project #1 reflects all merged PRs and backlog | `gh project item-list 1 --owner Gaspar1992` diff vs before |
| AC-13 | `npm run format:check && npm run lint` pass           | CI green                                                   |
| AC-14 | No regression > 5% in benchmark p50                   | `npm run benchmark` (manual check)                         |
| AC-15 | Bundle size regression ≤ 2% per sub-entry             | `ls -la dist/worker-http/*/fesm2022/*.mjs` before/after    |

---

## Technical Constraints

- **Node / browser dual**: crypto tests run with `@vitest-environment node` and `webcrypto` from `node:crypto`. No jsdom crypto stubs.
- **jsdom limitations**: `postMessage` in jsdom doesn't natively transfer `ArrayBuffer`; tests for FR-3 MUST assert the `transfer` argument passed to the fake worker's `postMessage`, not the actual detachment. Detachment can be validated manually in the demo or in a Playwright test.
- **Playwright coverage**: Add optional smoke test in `test/browser/` that exercises `AbortSignal` end-to-end in Chromium if feasible without too much flake. If flaky, keep as `describe.skip` with a TODO.
- **Semantic-release**: the commit at the end of the PR MUST be a `chore(release)` generated by the automation (or manual version bump + `fix:` + `feat:` commits). Follow existing repo pattern.
- **No breaking changes in `0.7.0`**: every change is additive or non-behavioral-breaking. `transferDetection` default stays `'none'`. `WORKER_HTTP_VERSION` removal is the only technical breaking change, mitigated by the fact it's unused.

---

## Known Edge Cases

1. **Zero-length `ArrayBuffer`** in payload with `transferDetection: 'auto'`: detection should still include it. Zero-length is valid.
2. **Same `ArrayBuffer` referenced twice** in payload: only pass once in transfer list (deduplicate).
3. **`transferDetection: 'auto'` with `responseType: 'arraybuffer'`**: response flow is worker→main; transfer list on response MUST also be populated once the worker-side emits transferables (out of scope for this PR; note in docs).
4. **Race: timeout fires at the same instant as response**: first terminal state wins; subsequent messages for that `requestId` are ignored by the removed listener (already the case).
5. **Worker throws before init-interceptors completes**: error message arrives before response; current code handles this via the error listener. Test must cover this path.
6. **Signal already aborted when `execute()` is called** (pre-aborted signal): this PR does NOT introduce caller-side signals. The abort source is always unsubscribe. No new edge case.
7. **Interceptor swallows the abort** (e.g. a retry interceptor that catches all errors): documented limitation. The hardening fixes the plumbing; it doesn't force interceptors to respect it. Follow-up for v1.0.
