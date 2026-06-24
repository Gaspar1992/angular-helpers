# Proposal: Storage Injection Context Assertions

## Intent

Enforce the correct Angular usage pattern by asserting that custom storage injection helpers are invoked within an active injection context. This throws clear, descriptive errors early, aligning `@angular-helpers/storage` with the `@angular-helpers/browser-web-apis` package.

## Scope

### In Scope

- Import `assertInInjectionContext` from `@angular/core`.
- Add assertion calls at the entry points of `injectStorageSignal`, `injectStorageResource`, and `injectEntityStore`.
- Verify existing tests pass and that correct errors are thrown when helpers are called out of context.

### Out of Scope

- Restricting direct instantiation of class `EntityStore` via `new EntityStore(...)`, as tests and internal systems rely on this constructor fallback.
- Modifying other, non-storage injection helpers.

## Capabilities

### New Capabilities

None

### Modified Capabilities

None

## Approach

We will import `assertInInjectionContext` from `@angular/core` and invoke it at the beginning of each functional helper. If a helper is called outside of an active injection context, it will fail immediately with a descriptive Angular error.

## Affected Areas

| Area                                                                                                                                                            | Impact   | Description                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| [packages/storage/src/fns/inject-storage-signal.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/fns/inject-storage-signal.ts)     | Modified | Import and call `assertInInjectionContext(injectStorageSignal)`                                    |
| [packages/storage/src/fns/inject-storage-resource.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/fns/inject-storage-resource.ts) | Modified | Import and call `assertInInjectionContext(injectStorageResource)`                                  |
| [packages/storage/src/services/entity-store.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/services/entity-store.ts)             | Modified | Import and call `assertInInjectionContext(injectEntityStore)` inside the functional helper wrapper |

## Risks

| Risk                                          | Likelihood | Mitigation                                                                                                         |
| --------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| Breaking unit tests invoking helpers directly | Low        | Verify that tests run within `TestBed.runInInjectionContext` or construct class directly (verified in exploration) |

## Rollback Plan

Revert git changes for the three affected files to remove the `assertInInjectionContext` imports and calls.

## Dependencies

- `@angular/core`

## Success Criteria

- [ ] Invoking `injectStorageSignal`, `injectStorageResource`, or `injectEntityStore` outside of an injection context throws an assertion error.
- [ ] All existing package unit tests pass successfully.
