# Proposal: Add WebTransport Service (`add-webtransport-service`)

## Intent

Provide an Angular-native, Signal/RxJS-powered `WebTransportService` wrapper in `@angular-helpers/browser-web-apis` for low-latency bidirectional streaming, multiplexed streams, and datagram transport (specifically optimized for real-time collaboration like Yjs, live telemetry, and gaming).

## Scope

### In Scope

- `WebTransportService` implementation in `packages/browser-web-apis/src/services/web-transport.service.ts`
- Connection status signal (`connecting`, `connected`, `closed`, `error`) and error signals
- Datagram transport support (unreliable, out-of-order) via RxJS streams (`Observable<Uint8Array>`) and `sendDatagram(data: Uint8Array)`
- Multiplexed stream management: creating & accepting Unidirectional (`createUnidirectionalStream`, `incomingUnidirectionalStreams`) & Bidirectional Streams (`createBidirectionalStream`, `incomingBidirectionalStreams`)
- DI tokens (`WEB_TRANSPORT_SUPPORTED` / `WEB_TRANSPORT_TOKEN`) and capability guard / provider functions
- Automatic connection cleanup via `DestroyRef` integration
- Comprehensive Vitest unit tests in `packages/browser-web-apis/src/services/web-transport.service.spec.ts`

### Out of Scope

- Server-side WebTransport implementation (Node.js/Rust backends)
- Pre-built Yjs provider implementation (left to consumer applications)

## Capabilities

- New Capabilities: `web-transport`

## Affected Areas

- `packages/browser-web-apis`

## Risks & Mitigations

- **Browser Compatibility**: WebTransport is supported in modern browsers but may be unavailable in older environments.
  - _Mitigation_: Provide `WEB_TRANSPORT_SUPPORTED` injection token and capability guard functions to safely detect feature support.
- **Resource Leaks**: Streams or connections left open upon component destruction.
  - _Mitigation_: Bind connection lifecycle and stream readers/writers to `DestroyRef` for deterministic cleanup.

## Rollback Plan

Revert commit(s) introduced under `openspec/changes/add-webtransport-service/`. No external API breakages occur outside `@angular-helpers/browser-web-apis`.

## Success Criteria

1. `WebTransportService` successfully establishes connections, streams datagrams, and manages multiplexed streams.
2. Signal-based state (`status`, `error`) accurately reflects transport state transitions.
3. `DestroyRef` properly closes transport sessions on context destruction.
4. Unit tests in `web-transport.service.spec.ts` pass with 100% test coverage.
