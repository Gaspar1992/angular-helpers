# Proposal: WebTransport Resource Primitives

## Intent

Provide modern functional Signal-based `rxResource` primitives (`injectWebTransportResource()` and `injectWebTransport()`) in `@angular-helpers/browser-web-apis` under `packages/browser-web-apis/src/fns/` for managing reactive WebTransport connection lifecycles, datagram streams, and multiplexed transport handles with automatic cleanup.

## Scope

### In Scope

- `injectWebTransportResource()` and high-level `injectWebTransport()` functional primitives in `packages/browser-web-apis/src/fns/`.
- Integration with Angular's `rxResource` API returning custom `ResourceRef` extensions.
- Reactive Signal for latest datagram payload (`datagram`) and status (`connecting`, `connected`, `closed`, `error`).
- Helpers for unidirectional and bidirectional streams (`incomingUnidirectionalStreams`, `incomingBidirectionalStreams`, `createBidirectionalStream`, `createUnidirectionalStream`).
- Automatic connection teardown and stream cancellation linked to `AbortSignal` and Angular `DestroyRef`.
- Vitest unit tests covering lifecycle management, datagram reception, stream creation, and cleanup.

### Out of Scope

- Server-side WebTransport implementation.
- Polyfills or HTTP/1.1 / HTTP/2 fallback engines.

## Capabilities

### New Capabilities

- `web-transport-resource`: Functional Signal & `rxResource`-based WebTransport injection primitives for low-latency datagrams and multiplexed streams in Angular applications.

### Modified Capabilities

None

## Approach

- Create `packages/browser-web-apis/src/fns/web-transport.ts` exposing `injectWebTransportResource(url, options)` and `injectWebTransport(url, options)`.
- Use Angular's `rxResource` within an injection context to handle reactive URL/options changes, connection setup, and state tracking.
- Manage `WebTransport` session lifecycle (`ready`, `closed`) and wire datagram reader to Angular signals.
- Automatically register `DestroyRef.onDestroy()` and propagate `AbortSignal` to cancel transport streams cleanly when scope completes.
- Export primitives and related types through `packages/browser-web-apis/src/index.ts`.

## Affected Areas

| Area                                                      | Impact   | Description                                                     |
| --------------------------------------------------------- | -------- | --------------------------------------------------------------- |
| `packages/browser-web-apis/src/fns/web-transport.ts`      | New      | `injectWebTransportResource` and `injectWebTransport` functions |
| `packages/browser-web-apis/src/fns/web-transport.spec.ts` | New      | Vitest unit tests for WebTransport resource primitives          |
| `packages/browser-web-apis/src/index.ts`                  | Modified | Export WebTransport functional primitives and types             |

## Risks & Mitigations

| Risk                                                  | Likelihood | Mitigation                                                                       |
| ----------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| WebTransport API unsupported in SSR / legacy browsers | Medium     | Guard global `WebTransport` check; return graceful error state via `rxResource`. |
| Unclosed transport streams leaking background tasks   | Low        | Tie transport closure directly to `AbortSignal` and `DestroyRef.onDestroy()`.    |

## Rollback Plan

Revert changes using:

```bash
git checkout packages/browser-web-apis/
rm -f packages/browser-web-apis/src/fns/web-transport.ts packages/browser-web-apis/src/fns/web-transport.spec.ts
```

## Success Criteria

- [ ] `injectWebTransportResource()` and `injectWebTransport()` can be called in an injection context.
- [ ] Returns reactive `ResourceRef` with `datagram` signal, status signal, and stream creation helpers.
- [ ] Transport session cleanly closes upon component / service destruction via `DestroyRef` and `AbortSignal`.
- [ ] Vitest test suite passes with full test coverage.
