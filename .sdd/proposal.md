# Proposal: worker-http Phase 2 — P2 (Serializer) + P4 (Interceptors)

> Date: 2026-04-06
> Status: Draft
> Author: Gaspar
> Parent SDD: docs/sdd-angular-http-web-workers.md

---

## Title

Implement **P2 serializer** and **P4 interceptor** sub-packages for `@angular-helpers/worker-http`.

---

## Problem to Solve

Phase 1 (P1 `transport` + P5 `crypto`) is complete and merged into `main`.
The `@angular-helpers/worker-http` package now has:

- **P1**: typed Observable-based transport with round-robin pool and cancellation
- **P5**: WebCrypto primitives (HMAC, AES-GCM, SHA hashing)

But P2 and P4 are skeleton-only, which means:

- **P2 `serializer/`**: only `structuredCloneSerializer` exists — no `seroval`/TOON serializers, no auto-detect strategy
- **P4 `interceptors/`**: only `createWorkerPipeline` + type definitions exist — no actual interceptor implementations (`retry`, `cache`, `hmac`, `logging`, `rateLimit`, `contentIntegrity`)

Without P2 and P4 complete, **P3 (the Angular `HttpBackend` replacement) cannot be meaningfully built**. P3 depends on a working serializer strategy and at least one reference interceptor to demonstrate the end-to-end pipeline.

---

## Objective

Deliver P2 (serializer layer) and P4 (interceptor implementations) as independent, tested sub-packages.
This unblocks Phase 3 (P3: `WorkerHttpBackend` + Angular integration).

---

## Proposed Scope

### In scope

#### P4 — Worker Interceptors (priority: high, zero deps)

| Interceptor                   | Factory signature                                          | Description                                                        |
| ----------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| `retryInterceptor`            | `(config?: RetryConfig) => WorkerInterceptorFn`            | Exponential backoff retry on configurable status codes             |
| `cacheInterceptor`            | `(config?: CacheConfig) => WorkerInterceptorFn`            | In-worker Map cache with TTL + max entries (LRU-like eviction)     |
| `hmacSigningInterceptor`      | `(config: HmacInterceptorConfig) => WorkerInterceptorFn`   | HMAC-SHA256 request signing via native WebCrypto (no P5 dep)       |
| `loggingInterceptor`          | `(config?: LoggingConfig) => WorkerInterceptorFn`          | Structured request/response logging via `console`                  |
| `rateLimitInterceptor`        | `(config?: RateLimitConfig) => WorkerInterceptorFn`        | Client-side sliding-window rate limiting                           |
| `contentIntegrityInterceptor` | `(config?: ContentIntegrityConfig) => WorkerInterceptorFn` | SHA-256 response body verification against `X-Content-Hash` header |
| `composeInterceptors`         | `(...fns: WorkerInterceptorFn[]) => WorkerInterceptorFn`   | Compose multiple interceptors into a single `WorkerInterceptorFn`  |

**Type additions** (extending existing `worker-interceptor.types.ts`):

- `LoggingConfig`, `ContentIntegrityConfig`

#### P2 — Serializer Implementations (priority: medium)

| Serializer          | Type               | Description                                                                        |
| ------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| `serovalSerializer` | `WorkerSerializer` | Full type fidelity: `Date`, `Map`, `Set`, circular refs via `seroval` package      |
| `autoSerializer`    | `WorkerSerializer` | Auto-detects payload: structured-clone for small/simple, seroval for complex types |

**TOON serializer**: researched but **deferred** — `@byjohann/toon` spec is still a Working Draft (v3.0); will be implemented in a dedicated follow-up iteration.

#### `seroval` as optional peer dependency

- Add `seroval` to `package.json` as optional peer with `peerDependenciesMeta`
- `SerovalSerializer` tree-shakes if not installed (dynamic import pattern)

### Out of scope

- **P3** (`WorkerHttpBackend`, `provideWorkerHttpClient`, schematics) — Phase 3
- **TOON serializer** — deferred; package ecosystem not yet stable enough
- **Angular DI integration** of any kind in this phase
- **Worker bundling / build schematics**
- **P5 modifications** — no changes to crypto sub-package
- **Vitest integration tests** that require a real browser — unit tests only for this phase

---

## Proposed Approach

1. **Branch**: create `feat/worker-http-phase2` from `main`
2. **P4 first**: implement all 6 interceptors + `composeInterceptors` (zero deps → safest starting point)
3. **P2 second**: implement `serovalSerializer` + `autoSerializer`; add `seroval` as optional peer
4. **Update all `index.ts` exports** in both sub-packages
5. **Unit tests** with Vitest for each interceptor and serializer (no browser needed for pure functions)
6. **Update `src/public-api.ts`** to reference all new exports

---

## Main Risks

| Risk                                                                                                        | Likelihood | Mitigation                                                                                                  |
| ----------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `seroval` ESM/CJS import differences breaking Vitest                                                        | Medium     | Verify with a spike; use `vi.mock` if needed                                                                |
| `hmacSigningInterceptor` requires `async` key initialization — not trivial in a synchronous factory         | Medium     | Factory returns `WorkerInterceptorFn` that lazily initializes `CryptoKey` on first call                     |
| TOON deferred → auto-detect may seem incomplete                                                             | Low        | `autoSerializer` uses structured-clone for arrays that exceed threshold; documents TOON as future extension |
| `cacheInterceptor` holds state in a `Map` closure — multiple calls to the factory create independent caches | Low        | Document clearly; singleton usage pattern is caller's responsibility                                        |
| Rate limit state resets when worker is terminated                                                           | Low        | Document as expected behavior — rate limiter is per-worker-instance                                         |

---

## Open Assumptions / Pending Decisions

1. **`hmacSigningInterceptor` key caching**: should the `CryptoKey` be cached across requests (performance) or re-imported per request (simplicity)? → Proposed: cache per factory instance.
2. **`autoSerializer` threshold**: the SDD proposes 100 KiB as the structured-clone cutoff — confirm this as default.
3. **`cacheInterceptor` eviction**: simple LRU by insertion order (Map.keys().next()) or true LRU with doubly linked list? → Proposed: insertion-order eviction (simpler, good enough for 100-entry default).
4. **`loggingInterceptor` output**: `console.log` only, or support a custom logger function passed in config?
