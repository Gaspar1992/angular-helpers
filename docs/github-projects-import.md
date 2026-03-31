# GitHub Projects Import: Worker HTTP Research & Future Work

This document contains all research findings and future work items from the `docs/research/` and related documentation, formatted for import into GitHub Projects.

## Project Structure Recommendation

**Project Name:** `Worker HTTP Development`

**Columns:**

- 📚 Research (completed research findings)
- 🔧 Implementation (work in progress)
- ⏳ Backlog (future work)
- ✅ Done

---

## Research Items (from http-worker-deep-research.md)

### Serialization & Performance

| Title                                | Description                                                                                                                                       | Labels                   | Priority |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | -------- |
| Serialization overhead benchmarks    | Documented Surma's postMessage benchmarks: ≤10KB safe for 16ms animation budget, 100KB-1MB device-dependent, >1MB needs optimization              | research, performance    | high     |
| TOON format investigation            | Evaluated TOON (Token-Oriented Object Notation) for 30-60% size reduction on uniform arrays. Spec is draft v3.0, reference impl: `@byjohann/toon` | research, serialization  | medium   |
| Library comparison for serialization | Compared superjson (~3KB), seroval (~5KB), devalue (~1KB), codablejson (~2KB), FlatBuffers (~15KB)                                                | research, serialization  | medium   |
| Transferable objects analysis        | Documented zero-copy escape hatch for ArrayBuffer, MessagePort, ReadableStream (80% browser coverage), ImageBitmap                                | research, performance    | high     |
| Transferable Streams browser gap     | Safari/iOS does NOT support transferable ReadableStream (~80% global coverage). Polyfill: `remote-web-streams`                                    | research, browser-compat | high     |

### Request Cancellation

| Title                              | Description                                                                                                                                                                                                          | Labels                 | Priority |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------- |
| AbortSignal transfer investigation | AbortSignal is NOT transferable via postMessage (WHATWG DOM issue #948 open since 2021). Evaluated 4 cancellation strategies: cancel message, SharedArrayBuffer+Atomics, MessagePort per request, Worker.terminate() | research, cancellation | high     |
| Recommended cancellation strategy  | Cancel message + AbortController inside worker (simple, no COOP/COEP requirement)                                                                                                                                    | research, cancellation | high     |

### Worker Lifecycle & Management

| Title                            | Description                                                                                                                                  | Labels              | Priority |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------- |
| Worker pool libraries evaluation | Compared poolifier-web-worker (~12KB), workerpool (~20KB), observable-webworker (~4KB). `navigator.hardwareConcurrency` typically 4-16 cores | research, lifecycle | medium   |
| Worker memory consumption        | Workers consume ~2-5 MB each, not garbage-collected, must explicitly terminate via DestroyRef                                                | research, lifecycle | medium   |
| RxJS/Observable integration      | Evaluated `observable-webworker` - has class-based DoWork interface gap. Documented DIY bridge pattern                                       | research, rxjs      | medium   |

### Security & Crypto

| Title                              | Description                                                                                                                                  | Labels                         | Priority |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------- |
| WebCrypto in Workers               | SubtleCrypto fully available in Web Workers (HMAC, AES, RSA, ECDSA). Requires HTTPS. Provides genuine security boundary from main thread XSS | research, security             | high     |
| Cross-Origin Isolation (COOP/COEP) | SharedArrayBuffer requires COOP: same-origin + COEP: require-corp. Many CDNs don't set these - must be opt-in only                           | research, security, deployment | high     |

### Architecture Learnings

| Title                           | Description                                                                                                                                                                       | Labels                   | Priority |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | -------- |
| Partytown architecture analysis | Partytown moves 3rd-party scripts to workers using sync XHR + SW trick. Takeaway: complex worker architectures work but demonstrate fragility of over-engineering worker boundary | research, architecture   | low      |
| RPC libraries comparison        | Compared Comlink (~1.1KB), web-worker-proxy (~2KB), DIY postMessage. Comlink has no Observable support gap                                                                        | research, rpc            | medium   |
| Error handling across threads   | Documented structured clone limitations for NetworkError, HTTP error, InterceptorError, Worker crash, Worker OOM. Must reconstruct HttpErrorResponse                              | research, error-handling | medium   |

### Testing Strategy

| Title                         | Description                                                                                                                                   | Labels            | Priority |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------- |
| Testing approaches documented | Unit tests: pure-fn interceptors (Vitest/Jasmine). Integration: real workers + MSW + Playwright. Benchmark: serialization overhead validation | research, testing | medium   |

---

## Package Breakdown (from http-worker-product-breakdown.md)

### Proposed Package Architecture

| Title                   | Description                                                                                                                                                  | Labels                 | Priority |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | -------- |
| P1: worker-transport    | Framework-agnostic, type-safe RPC bridge. Scope: typed postMessage, Transferable detection, cancellation, lifecycle, MessagePort-per-request, Observable API | package, foundation    | high     |
| P2: worker-serializer   | Pluggable serialization layer. Implementations: StructuredCloneSerializer, ToonSerializer, SerovalSerializer, auto-detect strategy                           | package, serialization | medium   |
| P3: worker-http-backend | Angular HttpBackend replacement. WorkerHttpBackend, provideWorkerHttpClient(), withWorker\* features, WORKER_TARGET context token, SSR fallback              | package, angular       | high     |
| P4: worker-interceptors | Pre-built pure-function interceptors: hmacSigning, schemaValidation, retry, cache, logging, rateLimit, contentIntegrity. WorkerInterceptorFn type            | package, interceptors  | medium   |
| P5: worker-crypto       | Standalone WebCrypto primitives: HmacSigner, AesEncryptor, ContentHasher, KeyStore. Works in main thread or workers                                          | package, security      | medium   |

### Delivery Order

| Phase   | Package                                | Rationale                                        |
| ------- | -------------------------------------- | ------------------------------------------------ |
| Phase 1 | worker-transport, worker-crypto        | Foundation + highest independent value           |
| Phase 2 | worker-serializer, worker-interceptors | Needed before P3 for large payloads and pipeline |
| Phase 3 | worker-http-backend                    | Composes P1+P2+P4, the main "product"            |

---

## Technical Feasibility (from sdd-angular-http-web-workers.md)

### Strengths Documented

| Title                     | Description                                                                                                                                                      | Labels                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Clean technical hook      | HttpBackend is replaceable DI token - architecturally correct                                                                                                    | strength, architecture              |
| Workers CAN make HTTP     | Native fetch() and XMLHttpRequest in workers                                                                                                                     | strength, capability                |
| Real benefit scenarios    | Large responses (>1MB), multiple parallel requests with complex transforms, data streams. INP improvements documented                                            | strength, performance               |
| Security case             | Request validation in isolation, HMAC signing without exposing keys, sandboxed from DOM, rate limiting without UI penalty. No existing Angular library does this | strength, security, differentiation |
| Multiple worker pipelines | Different workers with independent interceptor chains (OAuth vs mTLS vs caching)                                                                                 | strength, flexibility               |
| No direct prior art       | Comlink solves generic RPC but no Angular HTTP integration                                                                                                       | strength, market-gap                |

### Weaknesses & Challenges

| Title                                  | Description                                                                          | Labels                  | Mitigation                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------- | ------------------------------------------------------------ |
| Angular DI doesn't exist in Worker     | `inject()` requires Angular DI context. Interceptors cannot use DI                   | weakness, architecture  | Use pure function interceptors bundled at build time         |
| Structured clone blocks functions      | Functions cannot be cloned → DataCloneError. Prototype chain not preserved           | weakness, serialization | Interceptors must be compiled in worker bundle at build time |
| Most HTTP doesn't block main thread    | Already async; overhead may exceed benefit for small payloads                        | weakness, performance   | Target heavy payloads (>1MB) and security use cases          |
| Serialization overhead                 | Deep copy for every request/response. Transferable for ArrayBuffer only              | weakness, performance   | Use TOON for large JSON, Transferable for binary             |
| HttpContext not trivially transferable | Map with class reference tokens as keys don't survive serialization                  | weakness, serialization | Custom serialization/deserialization system needed           |
| Change detection and Zone.js           | Zone patches main thread APIs, not worker. Requires explicit handling                | weakness, zone          | Use signals (zoneless) with explicit return flow             |
| Does not work with SSR                 | platform-server doesn't support Web Workers                                          | weakness, ssr           | Automatic fallback to FetchBackend when Worker undefined     |
| Build complexity                       | Workers are separate bundles; "serializable" interceptors need special file handling | weakness, build         | Schematic + esbuild plugin for automatic bundling            |

---

## Deployment Strategies (from worker-deployment-strategies.md)

| Title                                     | Description                                                                                    | Labels                        | Priority |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------- | -------- |
| Option 1: Vite pre-transpiled workers     | Build workers separately, distribute as static assets. Works regardless of route access method | deployment, vite, recommended | high     |
| Option 2: Angular CLI + 404.html fallback | Copy index.html to 404.html, add .nojekyll. Partial solution                                   | deployment, angular-cli       | medium   |
| Option 3: Custom builder configuration    | Extend Angular CLI builder for worker assets                                                   | deployment, advanced          | low      |
| Option 4: Post-build worker extraction    | Script to extract and rename workers after build                                               | deployment, script            | medium   |

---

## Future Work / Implementation Tasks

Based on research, the following implementation tasks are ready for development:

### Ready for Implementation

| Title                                    | Description                                                                                                                       | Labels                     | Effort |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------ |
| Create worker-transport package (P1)     | Typed RPC bridge with request/response correlation, Transferable detection, cancellation, lifecycle management                    | implementation, p1         | large  |
| Create worker-crypto package (P5)        | HmacSigner, AesEncryptor, ContentHasher, KeyStore with WebCrypto API                                                              | implementation, p5         | medium |
| Implement TOON serializer (P2)           | Integrate `@byjohann/toon` for uniform array optimization                                                                         | implementation, p2         | medium |
| Implement seroval serializer (P2)        | Full type fidelity serializer for Date, Map, Set, circular refs                                                                   | implementation, p2         | medium |
| Create worker-interceptors package (P4)  | hmacSigningInterceptor, retryInterceptor, cacheInterceptor, loggingInterceptor, rateLimitInterceptor, contentIntegrityInterceptor | implementation, p4         | large  |
| Implement WorkerHttpBackend (P3)         | Angular HttpBackend replacement with worker routing                                                                               | implementation, p3         | large  |
| Create provideWorkerHttpClient() (P3)    | Environmental providers matching Angular's provideHttpClient() pattern                                                            | implementation, p3         | medium |
| Implement SSR fallback mechanism         | Detect typeof Worker === 'undefined', degrade to FetchBackend transparently                                                       | implementation, ssr        | medium |
| Build schematic for worker generation    | ng generate @angular-helpers/worker-http-backend:worker <name>                                                                    | implementation, tooling    | medium |
| esbuild plugin for interceptor pipeline  | Build-time bundling of interceptor pipeline into worker file                                                                      | implementation, tooling    | large  |
| Add cancel message protocol              | Implement worker-side AbortController with cancel message handling                                                                | implementation, protocol   | medium |
| Implement MessagePort-per-request option | Isolation via dedicated communication channel per request                                                                         | implementation, transport  | medium |
| Create workerUrl support for deployment  | Resolve against document.baseURI to avoid import.meta.url issues                                                                  | implementation, deployment | medium |
| Add WebCrypto key rotation mechanism     | Secure key management with import, derive, rotate operations                                                                      | implementation, security   | medium |
| Implement auto-serializer strategy       | Detect payload shape and pick best serializer (uniform array→TOON, complex types→seroval, small→structured clone)                 | implementation, p2         | medium |

### Needs Further Research

| Title                                 | Description                                                           | Labels                |
| ------------------------------------- | --------------------------------------------------------------------- | --------------------- |
| Safari transferable streams polyfill  | Evaluate `remote-web-streams` polyfill for Safari/iOS limitation      | research, safari      |
| Real-world overhead benchmarks        | Measure with 10KB, 100KB, 1MB payloads to determine benefit threshold | research, performance |
| Cold Observable re-execution handling | Design handling for Observable resubscription in worker context       | research, rxjs        |
| Worker OOM detection strategy         | Heartbeat or timeout mechanism for worker crash detection             | research, lifecycle   |
| COOP/COEP opt-in UX                   | Design developer experience for SharedArrayBuffer opt-in              | research, ux          |

### Documentation Tasks

| Title                              | Description                                                              | Labels        |
| ---------------------------------- | ------------------------------------------------------------------------ | ------------- |
| API documentation for all packages | Complete TypeDoc for public APIs                                         | documentation |
| Migration guide from HttpClient    | Guide for teams transitioning to worker-http                             | documentation |
| Security best practices guide      | Document HMAC signing patterns, key management                           | documentation |
| Deployment guide by platform       | GitHub Pages, Netlify, Vercel, traditional hosting                       | documentation |
| Performance tuning guide           | When to use workers, payload size recommendations, serialization choices | documentation |

---

## Quick Reference: Key Decisions Made

1. **Pure function interceptors only** - No DI in workers, bundle at build time
2. **seroval as default serializer** - Best balance of features (circular refs, Date, Map, Set)
3. **TOON for uniform arrays** - 30-60% size reduction for list endpoints
4. **Cancel message protocol** - Don't require COOP/COEP (no SharedArrayBuffer for cancellation)
5. **Automatic SSR fallback** - Detect Worker availability, transparent degradation
6. **Vite pre-build recommended** - For static hosting deployment compatibility
7. **workerUrl over workerFactory** - Avoids import.meta.url issues with 404.html

---

## Import Instructions

To import this into GitHub Projects:

1. Create a new Project (beta) in your GitHub repository
2. Add the columns: 📚 Research, 🔧 Implementation, ⏳ Backlog, ✅ Done
3. Create labels: `research`, `package`, `implementation`, `performance`, `security`, `serialization`, `deployment`, `p1`, `p2`, `p3`, `p4`, `p5`
4. For each table row above, create a draft issue with:
   - Title from the "Title" column
   - Description from the "Description" column
   - Labels from "Labels" column
   - Add to appropriate column based on status (Research items → 📚 Research, Implementation tasks → 🔧 Implementation or ⏳ Backlog)
