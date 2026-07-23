# Implementation Tasks: WebTransport Service (`add-webtransport-service`)

## Workload Forecast Review

- **Decision needed before apply**: No
- **Chained PRs recommended**: No
- **Chain strategy**: single-pr
- **400-line budget risk**: Low

## Phase 1: Injection Tokens & Interfaces

- [x] **1.1 Create WebTransport Provider & Tokens**
      Create `packages/browser-web-apis/src/providers/web-transport.ts` defining `WEB_TRANSPORT_SUPPORTED` and `WEB_TRANSPORT_TOKEN`.
- [x] **1.2 Export Provider**
      Export the new provider in `packages/browser-web-apis/src/providers.ts`.

## Phase 2: WebTransportService Core Implementation

- [x] **2.1 Core Service Skeleton & Signals**
      Create `packages/browser-web-apis/src/services/web-transport.service.ts` with signals (`status`, `error`) and `DestroyRef` cleanup.
- [x] **2.2 Datagram Mechanisms**
      Add Datagram send/receive mechanisms returning `Observable<Uint8Array>`.
- [x] **2.3 Stream Management Methods**
      Add Stream management methods (`createUnidirectionalStream`, `createBidirectionalStream`, `incomingUnidirectionalStreams$`, `incomingBidirectionalStreams$`).
- [x] **2.4 Re-export Public API**
      Re-export `WebTransportService` in `packages/browser-web-apis/src/public-api.ts`.

## Phase 3: Testing & Verification

- [x] **3.1 Write Unit Tests**
      Write unit test `packages/browser-web-apis/src/services/web-transport.service.spec.ts` testing connection lifecycle, datagrams, streams, and cleanup.
- [x] **3.2 Run Test Suite**
      Run test suite via `pnpm --filter @angular-helpers/browser-web-apis test`.
