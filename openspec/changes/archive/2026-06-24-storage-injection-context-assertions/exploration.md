## Exploration: storage-injection-context-assertions

### Current State

Currently, the `@angular-helpers/storage` package provides three custom dependency injection functions:

- `injectStorageSignal` (in [inject-storage-signal.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/fns/inject-storage-signal.ts))
- `injectStorageResource` (in [inject-storage-resource.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/fns/inject-storage-resource.ts))
- `injectEntityStore` (in [entity-store.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/services/entity-store.ts))

These functions resolve dependencies using Angular's native `inject()` function but do not explicitly assert that they are executed within an active injection context before doing so. If invoked outside an injection context (e.g., in a lifecycle hook like `ngOnInit` or inside async blocks), they fail implicitly when calling `inject()`, yielding standard Angular injector errors that do not explicitly point to the wrapper function.

In contrast, other packages like `@angular-helpers/browser-web-apis` consistently use `assertInInjectionContext` from `@angular/core` at the entry point of each custom injection function (e.g., `assertInInjectionContext(injectClipboard)`) to immediately fail with a unified, context-aware error message pointing to the helper function.

### Affected Areas

- [packages/storage/src/fns/inject-storage-signal.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/fns/inject-storage-signal.ts) — Needs import of `assertInInjectionContext` from `@angular/core` and assertion call `assertInInjectionContext(injectStorageSignal)` at the beginning of the function.
- [packages/storage/src/fns/inject-storage-resource.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/fns/inject-storage-resource.ts) — Needs import of `assertInInjectionContext` from `@angular/core` and assertion call `assertInInjectionContext(injectStorageResource)` at the beginning of the function.
- [packages/storage/src/services/entity-store.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/storage/src/services/entity-store.ts) — Needs import of `assertInInjectionContext` from `@angular/core` and assertion call `assertInInjectionContext(injectEntityStore)` inside the `injectEntityStore` function.
  _(Note: Enforcing it strictly inside `injectEntityStore` leaves class direct instantiations via `new EntityStore(...)` unaffected, which is critical because current unit tests instantiate it directly outside an injection context and rely on the internal `_resolveTransport` fallback)._

### Approaches

1. **Explicit Injection Context Assertions inside custom `inject*` helpers** — Import and call `assertInInjectionContext(fn)` at the entry point of `injectStorageSignal`, `injectStorageResource`, and `injectEntityStore`.
   - Pros: Enforces correct Angular usage pattern, aligns `@angular-helpers/storage` with `@angular-helpers/browser-web-apis`, throws a clear, unified error early, and allows `new EntityStore` to still be instantiated directly in unit tests without forcing injection context.
   - Cons: Requires importing `assertInInjectionContext` and adding assertion calls to three files.
   - Effort: Low

2. **Wait for native `inject()` error propagation** — Keep the current implementation unchanged.
   - Pros: No code modifications.
   - Cons: Inconsistent developer experience compared to `browser-web-apis`; error trace is less descriptive about which specific `@angular-helpers/storage` helper function failed.
   - Effort: Low

### Recommendation

Approach 1 is highly recommended. It guarantees architectural consistency across the workspace libraries, improves error clarity for consumers of the library, and maintains testability for direct class instantiations.

### Risks

- Unit tests that invoke `injectStorageSignal`, `injectStorageResource`, or `injectEntityStore` directly without `TestBed.runInInjectionContext` will break. However, checking the specs shows that the signal and resource helper tests already use `TestBed.runInInjectionContext`, and the entity store tests instantiate the `EntityStore` class directly with `new EntityStore(...)` rather than calling the wrapper function `injectEntityStore(...)`. Thus, this risk is extremely low.
- Bundler/Build implications: Importing `assertInInjectionContext` is standard in Angular core, so there is zero risk of build failures or bundle bloating.

### Ready for Proposal

Yes. The orchestrator can proceed to `sdd-propose` and define the exact specifications for implementing the context assertions.
