# Proposal: worker-http Hardening — Cancellation, Timeout, Transferables, Test Coverage

**Branch**: `fix/worker-http-hardening` (to be created)
**Target package**: `@angular-helpers/worker-http`
**Version bump**: minor (`0.6.0` → `0.7.0`)
**Status**: Draft — awaiting approval

---

## Problem

During a full audit of `packages/worker-http/` three **real correctness issues** were found, plus gaps in coverage and board sync.

### 1. Cancellation is broken end-to-end

`worker-message-loop.ts` creates an `AbortController` per request and stores it in a map, but its `signal` is **never passed** to the chain / `executeFetch` / `fetch()`. When the main thread unsubscribes:

- `create-worker-transport.ts:118` posts `{ type: 'cancel', requestId }` ✅
- `worker-message-loop.ts:22` calls `controller.abort()` ✅
- `fetch()` inside `executeFetch()` keeps running to completion ❌

The `executeFetch(req, signal?)` signature **accepts** an optional signal (line 33) but the `RequestHandler` type chain doesn't carry it. Net effect: `worker.postMessage({ type: 'cancel' })` does nothing observable.

The public README (EN + ES) advertises:

> "Request cancellation via `AbortController` in the worker"

This is currently a lie.

### 2. `requestTimeout` is advertised but never implemented

`worker-transport.types.ts:43` defines `requestTimeout?: number` with `default: 30000` in the JSDoc. `create-worker-transport.ts` never reads the field. **Real consumers already pass it**: the benchmark demo at `src/app/demo/worker-http-benchmark/services/benchmark-runner.service.ts:281,288` passes `requestTimeout: 60000`. Silent no-op.

Runaway worker requests hang forever — no built-in escape hatch.

### 3. `transferDetection` is documented but not wired

`worker-transport.types.ts:41` exposes `transferDetection?: 'auto' | 'manual' | 'none'`. `create-worker-transport.ts:112` calls `worker.postMessage({ type, requestId, payload })` with **no transfer list**. Large `ArrayBuffer` payloads are always structured-cloned, never transferred zero-copy. Both READMEs claim:

> "Automatic `Transferable` detection for zero-copy `ArrayBuffer` transfer"

### 4. `WORKER_HTTP_VERSION` exports the wrong value

`src/public-api.ts:15`:

```ts
export const WORKER_HTTP_VERSION = '0.0.1';
```

Actual package version is `0.6.0`. Shipped as public API, factually wrong, and not imported anywhere in the repo.

### 5. Test coverage gaps in sub-packages

- `packages/worker-http/transport/` — **0 spec files**. Covered indirectly via backend integration (FakeWorker), but the transport module itself (lazy creation, round-robin, terminate, error handler, cancel teardown, init handshake) has no direct unit test.
- `packages/worker-http/crypto/` — **0 spec files** for three primitives (`aes-encryptor`, `content-hasher`, `hmac-signer`).
- `packages/worker-http/serializer/` — tests only `auto-serializer.ts`; `seroval-serializer.ts` and `structured-clone-serializer.ts` have no individual specs.

### 6. GitHub Project board is stale

[`Worker HTTP Research & Future Work`](https://github.com/users/Gaspar1992/projects/1) reflects the state at Phase 3 (~4 months ago). Missing:

- ✅ PR #63 — Benchmark suite
- ✅ PR #67 — `withWorkerInterceptors()` (v0.4.0)
- ✅ PR #75 — SSR + TransferState hydration (v0.5.0)
- ✅ PR #78 — Telemetry hooks (v0.6.0)
- ✅ PR #82 — Benchmark 6-stage pipeline instrumentation

Also doesn't reflect the hardening items in this proposal.

## Objective

Close the correctness gaps between documented behavior and implementation, raise test coverage on untested sub-packages, sync the public roadmap on GitHub Projects, and bump the package to `0.7.0`.

Deliver a package whose README no longer advertises features that don't exist, with measurable unit-test coverage on the previously untested transport and crypto modules.

## In-Scope

### Code fixes (behavioral bugs)

1. **Cancellation plumbing** — `worker-message-loop.ts` + `worker-fetch-executor.ts` + `configurable-pipeline.ts` + `create-worker-pipeline.ts`:
   - Change `RequestHandler` type from `(req) => Promise<resp>` to `(req, signal?: AbortSignal) => Promise<resp>` OR wrap the chain with an outer signal-aware executor — pick the approach in design phase.
   - Pass `controller.signal` from the message loop into the chain.
   - `executeFetch` already supports `signal` — just needs to receive it.
   - On `cancel` message: `controller.abort()` AND ensure the abort propagates through any interceptor's `await next(req)`.

2. **`requestTimeout` implementation** — `create-worker-transport.ts`:
   - Start a `setTimeout(timeoutMs)` when posting the request.
   - On timeout: remove listeners, post `{ type: 'cancel', requestId }` to worker, emit `Error('Worker request timed out after N ms')` to subscriber.
   - Clear timer on successful response / error / unsubscribe.
   - Default: `30000`.

3. **`transferDetection` implementation** — `create-worker-transport.ts`:
   - `'auto'` (new default): walk the payload shallowly, collect `ArrayBuffer`/`MessagePort`/`ImageBitmap`/`OffscreenCanvas` instances, pass as `postMessage(..., transfer)`.
   - `'manual'`: caller supplies `transferables` explicitly on the request (needs API surface — deferred unless trivial).
   - `'none'`: current behavior (no transfer list).
   - Detection helper lives in its own file `detect-transferables.ts` so it's unit-testable.

4. **Stale version constant** — `src/public-api.ts`:
   - Remove `WORKER_HTTP_VERSION` (not imported anywhere, actively wrong). Alternative if we want to keep it: generate from `package.json` at build time. Proposal: remove.

### Test coverage additions

5. `transport/` unit tests (new file `create-worker-transport.spec.ts`):
   - Lazy worker creation.
   - Round-robin dispatch with `maxInstances > 1`.
   - Response correlation (different `requestId` → no cross-talk).
   - Cancel on unsubscribe (posts `{ type: 'cancel' }`).
   - **New**: `requestTimeout` rejects after N ms.
   - **New**: `transferDetection: 'auto'` passes ArrayBuffer as transfer list.
   - Error propagation from worker error event.
   - `init-interceptors` handshake ordering (handshake → request, never reverse).
   - `terminate()` stops all workers and rejects further `execute()`.

6. `crypto/` unit tests (new files):
   - `hmac-signer.spec.ts` — sign + verify round-trip, algorithm variants, invalid key material.
   - `aes-encryptor.spec.ts` — encrypt + decrypt round-trip, algorithm variants, IV handling, tampered ciphertext rejection (GCM).
   - `content-hasher.spec.ts` — SHA-256/384/512 known vectors, large-payload streaming if applicable.

7. `serializer/` unit tests (new files):
   - `seroval-serializer.spec.ts` — class instance round-trip, circular refs, Map/Set.
   - `structured-clone-serializer.spec.ts` — plain object round-trip, unsupported types rejection.

### Documentation

8. Update both READMEs (EN + ES) to describe cancellation, timeout, and transferables **accurately** after the fix.
9. Blog post at `public/content/blog/worker-http-hardening.md` (per repo convention):
   - The three bugs found.
   - Root cause of each (type-level plumbing failure, unimplemented config, no transfer list).
   - How we fixed them.
   - Testing strategy.

### Roadmap sync

10. Update GitHub Project #1 items:
    - Move `P3`, `P4`, `P5` already-Done items are fine; they match reality.
    - Add **new Done items** for PR #63, #67, #75, #78, #82.
    - Add **new Backlog items** created by this proposal:
      - 🔲 Fix cancellation AbortSignal plumbing
      - 🔲 Implement `requestTimeout`
      - 🔲 Implement `transferDetection: 'auto'`
      - 🔲 Transport unit tests
      - 🔲 Crypto unit tests
      - 🔲 Serializer unit tests
      - 🔲 Remove stale `WORKER_HTTP_VERSION` constant
    - Mark existing Backlog items as still pending with updated priority:
      - `ng add` schematic
      - v1.0 closing blog post
      - API docs + migration guide
      - Safari transferable streams polyfill (dependency of #3)
      - esbuild plugin for interceptor pipeline

### Version bump

11. `packages/worker-http/package.json`: `0.6.0` → `0.7.0` (minor — adds real timeout + transferables, fixes cancellation bug).

## Out-of-Scope (explicit non-goals)

- **`ng add` schematic** — Separate SDD. Larger surface, deserves its own review.
- **v1.0 closing blog post** — Depends on completing more polish (API docs, migration guide). This hardening is one input to that future post, not the post itself.
- **Safari transferable streams polyfill** — Transferable streams (not ArrayBuffers) are a different, browser-compat problem. Out of this change.
- **esbuild plugin for interceptor pipeline** — Bigger feature. Separate SDD.
- **API docs + migration guide** — Already on the board as a separate backlog item. Not blocking this hardening.
- **`transferDetection: 'manual'` full API** — Requires caller-level API surface change. Deferred unless trivial. `'auto'` and `'none'` cover 99% of use cases.
- **Deep error shape unification** — `WorkerErrorResponse.error` defines `status/statusText` but worker never populates them. Fix deferred; current shape is not wrong, just incomplete.

## Approach

### Branch strategy

Single fix branch `fix/worker-http-hardening`. One PR. Conventional commits per concern:

- `fix(worker-http): propagate AbortSignal from cancel message to fetch()`
- `feat(worker-http): implement requestTimeout in transport`
- `feat(worker-http): implement transferDetection auto for ArrayBuffer payloads`
- `chore(worker-http): remove stale WORKER_HTTP_VERSION constant`
- `test(worker-http): add unit tests for transport module`
- `test(worker-http): add unit tests for crypto primitives`
- `test(worker-http): add unit tests for serializer variants`
- `docs(worker-http): describe cancellation/timeout/transferables accurately`
- `docs(blog): worker-http hardening post`
- `chore(worker-http): bump version to 0.7.0`

### Key design decisions

1. **Signal plumbing approach** — Two candidates:
   - **A. Extend `WorkerInterceptorFn` signature** to accept `signal`: `(req, next, signal?) => Promise<resp>`. Touches every interceptor. Breaking change for user-defined custom interceptors.
   - **B. Thread signal through a closure** around the chain: the message loop builds a wrapped `finalHandler = (req) => executeFetch(req, controllerSignal)` per request. No signature change.
   - **Proposal: B**. Non-breaking, minimal surface change. Interceptors that want to be abort-aware can read a side-channel (future work).

2. **Timeout rejection error shape** — Dedicated error class `WorkerHttpTimeoutError extends Error` so consumers can `instanceof`-check it. Exported from `/transport`.

3. **`transferDetection` default** — Change default from undefined to `'auto'`. README already advertises "automatic transferable detection" so `'auto'` matches documented behavior. Risk: existing code that posts ArrayBuffers and re-uses them after post will break (the buffer becomes detached). Mitigation: opt-out via `transferDetection: 'none'` for users who need backwards compat.

4. **`WORKER_HTTP_VERSION` removal** — Not imported anywhere in the repo. Removing is safe. If a consumer depends on it, they'd see a compile error at upgrade time and can use `package.json` directly.

5. **Test strategy** — Transport tests use the existing `FakeWorker` pattern from `worker-http-backend.integration.spec.ts` to stay in jsdom. Crypto tests use `@vitest-environment node` with `webcrypto` from `node:crypto`.

### Implementation sequence

1. **Cancellation fix** — highest-impact bug, land first so all subsequent tests can assert the fixed behavior.
2. **Transport unit tests scaffolding** — establishes patterns before adding timeout + transferables.
3. **Timeout implementation** + tests.
4. **Transferable detection** + tests.
5. **Remove `WORKER_HTTP_VERSION`**.
6. **Crypto unit tests** — independent, parallelizable.
7. **Serializer unit tests** — independent.
8. **Docs** — only after code is stable.
9. **Blog post** — after docs.
10. **Version bump + GitHub Project board sync** — last.

## Risks

| Risk                                                                                                | Severity | Mitigation                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transferDetection: 'auto'` as new default detaches ArrayBuffers in consumer code that re-uses them | **High** | Ship as opt-in: keep default `'none'`, document `'auto'` as recommended in README. Update to `'auto'` default deferred to major bump.                                                                                                          |
| Signal plumbing via closure breaks for custom interceptors that hold long-running work              | Medium   | Closure lives around the final handler only; interceptor layer stays unchanged. Custom interceptors that need abort-aware behavior can use a future explicit API.                                                                              |
| Timeout racing fetch causes double-reject                                                           | Low      | Clear timer on any terminal state (response/error/unsubscribe). Track state with a `settled` flag; first terminal wins.                                                                                                                        |
| Removing `WORKER_HTTP_VERSION` is a breaking export change                                          | Low      | Exported but not used anywhere in repo. Worst case: consumer `import { WORKER_HTTP_VERSION }` fails at compile → clear error. Minor bump is acceptable since the value was wrong anyway. Consider deprecation period? → Propose clean removal. |
| GitHub Project board updates touch 14+ items and could break links in blog posts                    | Low      | Only rename/add items; don't delete existing IDs. Verify no blog posts reference `PVTI_...` IDs.                                                                                                                                               |
| Crypto tests flake under jsdom                                                                      | Low      | Use `@vitest-environment node` with `node:crypto.webcrypto`.                                                                                                                                                                                   |

## Open Assumptions

- User wants `transferDetection: 'auto'` default to remain deferred to a major bump (v1.0), keeping `'none'` as default in `0.7.0`. If user prefers immediate flip, adjust risk matrix.
- `ng add` schematic will be done in a follow-up SDD after this hardening lands.
- Blog post in this PR covers only the hardening; v1.0 retrospective is a separate future post.
- Semantic-release in the repo can handle `fix:` commits as patch bumps, but a `feat:` in the set will trigger minor. Expected result: `0.7.0`.

## Pending Decisions (require user input before implementation)

1. **`transferDetection` default**: ship as opt-in (default `'none'`, as now) or opt-out (new default `'auto'` matching README promise)?
2. **`WORKER_HTTP_VERSION`**: remove, or wire to `package.json` at build time?
3. **Signal plumbing**: approach A (interceptor signature change) or B (closure around final handler)? Proposal favors B.
4. **Blog scope**: one post per bug or one combined "hardening" post? Proposal: single combined post.
5. **GitHub Project board**: update in-place (this session, via `gh` CLI) or stage the plan in markdown and apply after code merge?
