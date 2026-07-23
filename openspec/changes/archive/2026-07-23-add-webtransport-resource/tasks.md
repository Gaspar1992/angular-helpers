# Implementation Tasks: WebTransport Resource Primitives (`add-webtransport-resource`)

## Workload Forecast Review

- **Decision needed before apply**: No
- **Chained PRs recommended**: No
- **Chain strategy**: single-pr
- **400-line budget risk**: Low

## Phase 1: Functional Primitive Implementation

- [x] **1.1 Injection Context & Support Guard Setup**
      Create `packages/browser-web-apis/src/fns/inject-web-transport-resource.ts` with injection context guard (`assertInInjectionContext`), browser/SSR platform checks, and support status (`isSupported`). Define interfaces (`WebTransportResourceOptions`, `WebTransportSessionInfo`, `WebTransportResourceRef`, `WebTransportStatus`).
- [x] **1.2 Connection & rxResource Integration**
      Implement `injectWebTransportResource` and alias `injectWebTransport` using Angular's `rxResource` to create reactive connection streams upon URL/options changes, managing `connecting`, `connected`, `closed`, and `error` status signals.
- [x] **1.3 Datagram Reader & Writer**
      Wire `transport.datagrams.readable` stream reader loop to emit incoming payloads to a `datagram` signal, and provide `sendDatagram()` method writing to `transport.datagrams.writable`.
- [x] **1.4 Multiplexed Stream Helpers & Cleanup**
      Expose `createUnidirectionalStream()`, `createBidirectionalStream()`, `incomingUnidirectionalStreams`, and `incomingBidirectionalStreams`. Attach cleanup handlers via `AbortSignal` and Angular `DestroyRef` to invoke `transport.close()`.

## Phase 2: Public API Exports

- [x] **2.1 Re-export Primitives & Types**
      Update `packages/browser-web-apis/src/public-api.ts` (or `packages/browser-web-apis/src/index.ts`) to re-export `injectWebTransportResource`, `injectWebTransport`, `WebTransportResourceRef`, `WebTransportResourceOptions`, and `WebTransportStatus`.

## Phase 3: Vitest Testing & Verification

- [x] **3.1 Unit Testing**
      Create `packages/browser-web-apis/src/fns/inject-web-transport-resource.spec.ts` using Vitest and `TestBed.runInInjectionContext` with mock `WebTransport`. Test support guard, connection lifecycle, datagram signaling/sending, stream creation, and `DestroyRef` cleanup.
- [x] **3.2 Run Test Suite Verification**
      Run unit test suite via `pnpm --filter @angular-helpers/browser-web-apis test`.
