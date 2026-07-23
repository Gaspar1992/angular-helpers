# Technical Design: WebTransport Service (`add-webtransport-service`)

## Overview

This technical design outlines the implementation of `WebTransportService` within `@angular-helpers/browser-web-apis`. The service provides Angular applications with a high-performance wrapper for WebTransport, delivering low-latency bidirectional stream multiplexing and unreliable datagram transport integrated with Angular Signals and RxJS observables.

## Technical Approach

`WebTransportService` is implemented as an `@Injectable({ providedIn: 'root' })` standalone Angular service located in `packages/browser-web-apis/src/services/web-transport.service.ts`. It manages the WebTransport connection lifecycle, wraps incoming and outgoing datagrams and streams with RxJS primitives, and binds resource cleanup to Angular's `DestroyRef`.

## Architectural Decisions

### 1. Angular Signals for Connection State

- `status`: Signal tracking the transport session state: `'connecting' | 'connected' | 'closed' | 'error'`. Default: `'closed'`.
- `error`: Signal holding the latest session error (`Error | null`). Default: `null`.

### 2. RxJS Observables for Datagrams & Multiplexed Streams

- **Datagrams**: Incoming datagrams from `WebTransport.datagrams.readable` are exposed as `datagrams$: Observable<Uint8Array>`.
- **Streams**:
  - `incomingUnidirectionalStreams$: Observable<ReadableStream>` reads from `WebTransport.incomingUnidirectionalStreams`.
  - `incomingBidirectionalStreams$: Observable<WebTransportBidirectionalStream>` reads from `WebTransport.incomingBidirectionalStreams`.
- **Outgoing API**:
  - `sendDatagram(data: Uint8Array | ArrayBuffer): Promise<void>` writes directly to `WebTransport.datagrams.writable`.
  - `createUnidirectionalStream(): Promise<WritableStream>` invokes `WebTransport.createUnidirectionalStream()`.
  - `createBidirectionalStream(): Promise<WebTransportBidirectionalStream>` invokes `WebTransport.createBidirectionalStream()`.

### 3. Automatic Lifecycle Teardown

- Utilizes Angular's `DestroyRef.onDestroy()` to cancel active readers, close writable streams, and terminate the WebTransport session deterministically when the injector context is destroyed.

### 4. Injection Tokens & SSR Safety

- `WEB_TRANSPORT_SUPPORTED`: Injection token with `factory: () => typeof globalThis !== 'undefined' && 'WebTransport' in globalThis`. Prevents runtime crashes in Server-Side Rendering (SSR) or legacy browsers.

## File Modifications

- **Create**: `packages/browser-web-apis/src/services/web-transport.service.ts` — Core service implementation.
- **Create**: `packages/browser-web-apis/src/services/web-transport.service.spec.ts` — Comprehensive Vitest unit tests.
- **Create**: `packages/browser-web-apis/src/providers/web-transport.ts` — Provider helper `provideWebTransport()`.
- **Modify**: `packages/browser-web-apis/src/public-api.ts` — Export service, types, tokens, and provider.
- **Modify**: `packages/browser-web-apis/src/providers.ts` — Export `provideWebTransport`.

## Interfaces & Contracts

```ts
export type WebTransportState = 'connecting' | 'connected' | 'closed' | 'error';

export interface WebTransportOptions {
  allowPooling?: boolean;
  requireUnreliable?: boolean;
  serverCertificateHashes?: WebTransportHash[];
  congestionControl?: 'default' | 'throughput' | 'low-latency';
}
```

## Testing Strategy

Vitest unit tests in `web-transport.service.spec.ts` will utilize a mock `globalThis.WebTransport` implementation:

1. **Browser Support Detection**: Verify `WEB_TRANSPORT_SUPPORTED` returns `true` in supported mock environments and `false` when `WebTransport` is absent.
2. **State Transitions**: Test transition from `connecting` to `connected` upon `WebTransport.ready` resolution, and transition to `closed` or `error` on session termination.
3. **Datagram Transport**: Validate datagram publishing through `sendDatagram` and emission of received datagrams on `datagrams$`.
4. **Stream Multiplexing**: Test creation of unidirectional/bidirectional streams and reception of incoming streams via `incomingUnidirectionalStreams$` and `incomingBidirectionalStreams$`.
5. **Teardown & Cleanup**: Confirm that calling `close()` or triggering `DestroyRef` cleanup closes the session and releases stream readers.

## Threat Matrix

N/A — No routing, shell execution, file system access, or subprocess integration involved.
