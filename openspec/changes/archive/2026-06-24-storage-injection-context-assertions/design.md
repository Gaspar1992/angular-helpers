# Design: Storage Injection Context Assertions

## Technical Approach

We will enforce correct Angular usage patterns for custom injection helpers by asserting that they are called within an active Angular injection context. This is achieved by importing `assertInInjectionContext` from `@angular/core` and executing it at the very top of each function:

- At the top of `injectStorageSignal`, add `assertInInjectionContext(injectStorageSignal)`.
- At the top of `injectStorageResource`, add `assertInInjectionContext(injectStorageResource)`.
- At the top of the wrapper function `injectEntityStore`, add `assertInInjectionContext(injectEntityStore)`.

If any of these functions are invoked outside of a component, directive, pipe, or service injection phase (without using `runInInjectionContext`), Angular will throw a clear and descriptive context error immediately.

## Architecture Decisions

| Decision                                                                                   | Alternatives Considered                                         | Rationale                                                                                                                                                                                                                                                                                                                                                                                                       |
| :----------------------------------------------------------------------------------------- | :-------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Assert context inside wrapper `injectEntityStore`** instead of `EntityStore` constructor | Placing the assertion directly in the `EntityStore` constructor | The `EntityStore` class constructor uses a try/catch fallback around `inject()` to instantiate `LocalStorageTransport` gracefully when outside an injection context. This enables unit tests to construct and test store logic using `new EntityStore(...)` without needing a full `TestBed` or injection context setup. Restricting the assertion to `injectEntityStore` preserves this unit testing workflow. |
| **Call `assertInInjectionContext` explicitly**                                             | Wait for native `inject()` error propagation                    | Although calling `inject()` without context throws an error implicitly, the error message lacks context about the helper function itself. Calling `assertInInjectionContext(fn)` provides a cleaner stack trace and explicitly mentions the custom helper function name, which matches the behavior established in `@angular-helpers/browser-web-apis`.                                                         |

## Data Flow / Structure

When one of the custom storage helper functions is called:

```
[Consumer Code]
       │
       ▼
[injectStorageSignal / injectStorageResource / injectEntityStore]
       │
       ├───→ assertInInjectionContext(fn) ───[ No Context ]───→ Throws "assertInInjectionContext() can only be used..."
       │
       ▼ [ Has Context ]
Native Angular inject() / RxResource / Signal creation and setup
       │
       ▼
Return initialized Reactive Primitive / Store
```

## File Changes

| File                                                                                                                                                            | Action | Description                                                                                                                                                                 |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [packages/storage/src/fns/inject-storage-signal.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/fns/inject-storage-signal.ts)     | Modify | Import `assertInInjectionContext` from `@angular/core` and call `assertInInjectionContext(injectStorageSignal)` at the beginning of the function.                           |
| [packages/storage/src/fns/inject-storage-resource.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/fns/inject-storage-resource.ts) | Modify | Import `assertInInjectionContext` from `@angular/core` and call `assertInInjectionContext(injectStorageResource)` at the beginning of the function.                         |
| [packages/storage/src/services/entity-store.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/services/entity-store.ts)             | Modify | Import `assertInInjectionContext` from `@angular/core` and call `assertInInjectionContext(injectEntityStore)` at the beginning of the `injectEntityStore` wrapper function. |

## Interfaces / Contracts

```typescript
import { assertInInjectionContext } from '@angular/core';

// In inject-storage-signal.ts
export function injectStorageSignal<T>(
  key: string,
  defaultValue: T,
  options: StorageSignalOptions<T>,
): StorageSignal<T> {
  assertInInjectionContext(injectStorageSignal);
  // ... rest of implementation
}

// In inject-storage-resource.ts
export function injectStorageResource<T>(
  key: string,
  defaultValue: T,
  options: StorageSignalOptions<T>,
): StorageResource<T> {
  assertInInjectionContext(injectStorageResource);
  // ... rest of implementation
}

// In entity-store.ts
export function injectEntityStore<Id, Entity>(
  options: EntityStoreOptions<Id, Entity>,
): EntityStore<Id, Entity> {
  assertInInjectionContext(injectEntityStore);
  return new EntityStore<Id, Entity>(options);
}
```

## Testing Strategy

We will update/add unit tests in the respective spec files to assert the following behaviors:

| Layer | What to Test                                      | Approach                                                                                                                                      |
| :---- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit  | `injectStorageSignal` outside injection context   | Assert that calling `injectStorageSignal` outside `runInInjectionContext` throws an error.                                                    |
| Unit  | `injectStorageSignal` inside injection context    | Assert that calling `injectStorageSignal` inside `runInInjectionContext` successfully creates the signal without throwing.                    |
| Unit  | `injectStorageResource` outside injection context | Assert that calling `injectStorageResource` outside `runInInjectionContext` throws an error.                                                  |
| Unit  | `injectStorageResource` inside injection context  | Assert that calling `injectStorageResource` inside `runInInjectionContext` successfully creates the resource.                                 |
| Unit  | `injectEntityStore` outside injection context     | Assert that calling `injectEntityStore` outside `runInInjectionContext` throws an error.                                                      |
| Unit  | `new EntityStore` outside injection context       | Assert that calling `new EntityStore(...)` directly outside `runInInjectionContext` does not throw (maintaining test backward compatibility). |

We will execute the tests using the command `pnpm test` (or `vitest` command configured for packages) to verify all tests pass.

## Migration / Rollout

No migration is required for standard application code, as consumers are expected to call these functions inside an injection context (e.g. constructor, field initializers).
For tests, if any test was improperly calling `inject*` helpers directly outside of `TestBed.runInInjectionContext`, they will need to wrap the invocation in `runInInjectionContext` or construct the store class directly via `new EntityStore(...)`.

## Open Questions

- [x] All questions resolved.
