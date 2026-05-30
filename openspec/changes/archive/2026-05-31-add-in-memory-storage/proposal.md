# SDD Proposal: In-Memory Storage Transport for `@angular-helpers/storage`

## 1. Intent

Introduce a transient `in-memory` storage transport to prevent errors during Server-Side Rendering (SSR) or when browser storage APIs are unavailable/blocked.

## 2. Scope

- Add `memory` option to storage configurations.
- Fallback dynamically to `memory` when running outside the browser (SSR).
- Ensure the transport remains fully synchronous/asynchronous compliant with `StorageTransport`.

## 3. Capabilities

None

## 4. Approach

- **In-Memory Storage Transport**: Implement a clean `InMemoryTransport` that conforms to `StorageTransport`, storing data inside a local `Map` structure.
- **SSR/Non-Browser Safe fallback**: Update `LocalStorageTransport` constructor to inspect `isBrowser`. If `isBrowser` is false, fallback `storageType` to `'memory'` instead of `'indexeddb'`.
- **Options Update**: Extend `StorageSignalOptions` type in `packages/storage/worker/src/interfaces/storage-options.types.ts` to support `'memory'` as a valid `storageType`.
- **Exporting**: Expose the new transport via `packages/storage/src/public-api.ts`.

## 5. Affected Areas

1. `packages/storage/worker/src/interfaces/storage-options.types.ts`: Extend `storageType` union type to include `'memory'`.
2. `packages/storage/src/services/local-transport.ts`: Update instantiation and fallback logic to handle `'memory'` strategy, including resolver method checks.
3. `packages/storage/src/public-api.ts`: Export the new transport.
4. `packages/storage/src/services/transports/in-memory.transport.ts`: New file implementing the in-memory transport class.

## 6. Risks

- **Data Volatility**: Data is lost on page refresh or server restarts.
  - _Mitigation_: Clearly document that `'memory'` is non-persistent and intended for transient fallback/testing.
- **Memory Consumption**: Large amounts of data stored in memory could cause memory pressure in Node.js during SSR.
  - _Mitigation_: Ensure usage is scoped or temporary, standardizing small payload targets.

## 7. Rollback Plan

Revert changes to `LocalStorageTransport` fallback branch and remove the `'memory'` option from the `storageType` union type.

## 8. Success Criteria

- SSR builds render successfully without throwing "window/localStorage is not defined" or similar environment errors.
- Unit tests introduced in `packages/storage/src/services/transports/in-memory.transport.spec.ts` pass with 100% coverage.
