# @angular-helpers/worker-http

Angular HTTP over Web Workers — off-main-thread HTTP pipelines with configurable interceptors, WebCrypto security, and pluggable serialization.

> **Status**: Pre-alpha / POC

## Sub-entry points

| Entry point                                 | Description                                                 | Phase |
| ------------------------------------------- | ----------------------------------------------------------- | ----- |
| `@angular-helpers/worker-http/transport`    | Typed RPC bridge, worker pool, lifecycle, cancellation      | P1    |
| `@angular-helpers/worker-http/serializer`   | Pluggable serialization (structured clone, TOON, seroval)   | P2    |
| `@angular-helpers/worker-http/backend`      | Angular `HttpBackend` replacement — the "black box"         | P3    |
| `@angular-helpers/worker-http/interceptors` | Pure-function interceptors for workers (HMAC, cache, retry) | P4    |
| `@angular-helpers/worker-http/crypto`       | WebCrypto primitives (HMAC, AES, hashing)                   | P5    |

## Design principles

- **Worker as a black box** — the developer uses Angular's `HttpClient` as normal; the worker is an implementation detail
- **Build-time transpilation** — interceptors are configured in Angular-land; a schematic/esbuild plugin generates the worker bundle
- **Auto-detect serialization** — structured clone for small payloads, TOON for uniform arrays, seroval for complex types

## Documentation

- [SDD — Feasibility Study](../../docs/sdd-angular-http-web-workers.md)
- [Deep Research](../../docs/research/http-worker-deep-research.md)
- [Product Breakdown](../../docs/research/http-worker-product-breakdown.md)
