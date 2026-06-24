# Tasks: Storage Injection Context Assertions

## Review Workload Forecast

| Field                   | Value          |
| ----------------------- | -------------- |
| Estimated changed lines | ~60 lines      |
| 400-line budget risk    | Low            |
| Chained PRs recommended | No             |
| Suggested split         | Single PR      |
| Delivery strategy       | single-pr      |
| Chain strategy          | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal                                 | Likely PR | Notes                           |
| ---- | ------------------------------------ | --------- | ------------------------------- |
| 1    | Add assertions and verify with tests | Single PR | All changes delivered in one PR |

## Phase 1: Implementation

- [x] 1.1 Add `assertInInjectionContext` checks to `injectStorageSignal` in [inject-storage-signal.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/fns/inject-storage-signal.ts)
- [x] 1.2 Add `assertInInjectionContext` checks to `injectStorageResource` in [inject-storage-resource.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/fns/inject-storage-resource.ts)
- [x] 1.3 Add `assertInInjectionContext` checks to `injectEntityStore` in [entity-store.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/services/entity-store.ts)

## Phase 2: Testing

- [x] 2.1 Add specs in respective `*.spec.ts` files to verify context errors are thrown when helpers are called out of context.
- [x] 2.2 Run and verify existing unit tests to confirm direct instantiation of `new EntityStore` and context-wrapped usages still pass.
