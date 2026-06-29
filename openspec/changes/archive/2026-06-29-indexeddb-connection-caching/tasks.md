# Tasks: indexeddb-connection-caching

## Review Workload Forecast

| Field                   | Value          |
| ----------------------- | -------------- |
| Estimated changed lines | ~50 lines      |
| 400-line budget risk    | Low            |
| Chained PRs recommended | No             |
| Suggested split         | Single PR      |
| Delivery strategy       | ask-on-risk    |
| Chain strategy          | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal                                    | Likely PR | Notes                                                          |
| ---- | --------------------------------------- | --------- | -------------------------------------------------------------- |
| 1    | Implement connection caching and verify | PR 1      | Implements `dbCache` Map in `IndexedDBTransport` and verifies. |

## Phase 1: Implement Connection Caching

- [x] 1.1 Add private `dbCache` Map to `IndexedDBTransport` in [indexeddb.transport.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/worker/src/services/transports/indexeddb.transport.ts).
- [x] 1.2 Modify `openDB` method to check, set, and return from `dbCache`.
- [x] 1.3 Add event listeners for `close` and `versionchange` on the `IDBDatabase` instance to evict it from `dbCache`.
- [x] 1.4 Handle connection errors by evicting the promise from the cache before rejecting.

## Phase 2: Verification

- [x] 2.1 Run `pnpm run test` (Vitest unit tests) and verify all tests pass.
- [x] 2.2 Run `pnpm run build:packages` to ensure everything compiles.
- [x] 2.3 Run linting: `pnpm run lint`.
