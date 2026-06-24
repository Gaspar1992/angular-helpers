## Exploration: Move SearchService query filtering to a Web Worker using injectWorkerPool

### Current State

The `SearchService` ([search.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/core/services/search.service.ts)) performs synchronous filtering of a static list of docs, blog posts, and demos on the main thread:

```typescript
  readonly results = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return [];

    return this.index
      .filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(q))
        );
      })
      .slice(0, 8); // Limit to top 8 results
  });
```

This blocking calculation executes on the main thread for every keystroke. Transitioning this to an off-thread Web Worker using `injectWorkerPool` will improve UI responsiveness during typing.

### Affected Areas

- [search.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/core/services/search.service.ts) — Refactor `SearchService` to utilize `injectWorkerPool` from `@angular-helpers/core` and shift `results` to an asynchronous signal using `@angular/core/rxjs-interop` `toSignal` with a `switchMap` pipeline.
- [vite.config.ts](file:///home/gasparrv92/Repositorios/angular-helpers/vite.config.ts) — Register a new entry point `'search.worker': resolve(__dirname, 'src/workers/search.worker.ts')` under `build.lib.entry` to build the worker.
- `src/workers/search.worker.ts` — (To be created) The Web Worker script that imports search data, listens for search messages, performs filtering, and returns results.

### Approaches

1. **Declarative RxJS integration (`toSignal` + `toObservable` + `switchMap`)**
   - We transform the `query` signal into an Observable, pipe it through `switchMap` calling `pool.execute<SearchResult[]>('search', { q })`, and map it back into a read-only signal with `toSignal`.
   - **Pros**:
     - Automatically cancels pending/stale worker executions on query updates (via `switchMap` unsubscribe).
     - Standard Angular pattern for asynchronous signal operations.
     - Avoids `allowSignalWrites: true` or manual effect race condition mitigation.
   - **Cons**:
     - Requires RxJS interop imports.
   - **Effort**: Low

2. **Manual Signal writes inside `effect()`**
   - An Angular `effect()` watches `query()`, invokes `pool.execute()`, and sets a writeable `_results` signal in the promise callback.
   - **Pros**:
     - Avoids RxJS operators.
   - **Cons**:
     - Prone to race conditions (out-of-order promise resolutions replacing newer results).
     - Requires manual management/tracking of request IDs or query timestamps to prevent stale updates.
     - Requires `allowSignalWrites: true` if written inside the synchronous effect frame, or async wrapping.
   - **Effort**: Medium

### Recommendation

Use **Approach 1 (RxJS integration)**. The `switchMap` operator natively resolves race conditions by ignoring previous unresolved queries, which is vital when handling rapid key inputs.

Configure `injectWorkerPool` with:

- A `fallbackExecutor` that runs the filtering logic synchronously on the main thread if workers are unavailable (e.g. in Server-Side Rendering (SSR) mode or under restrictive CSP rules).
- The static data imported directly in `search.worker.ts` to avoid serialized payload overhead on every search execution.

### Risks

- **Worker Compilation & Loading**: The compiled worker script must be output to `public/assets/workers/search.worker.js`. Developers running the dev server (`npm run dev`) must ensure workers are built (`pnpm build:workers`) or that Vite parses them correctly.
- **Worker Initialization and Context**: `injectWorkerPool` must be instantiated in the injection context of `SearchService` (i.e. at class property instantiation). Since `SearchService` is a singleton (`providedIn: 'root'`), this is fully safe.

### Ready for Proposal

Yes — The architecture is well-mapped, the worker build pipeline is established in Vite, and the `injectWorkerPool` implementation is fully compatible.
