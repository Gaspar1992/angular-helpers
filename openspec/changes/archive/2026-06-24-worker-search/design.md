# Design: Move SearchService query filtering to a Web Worker using injectWorkerPool

## Technical Approach

Offload search query filtering of documentation, blog posts, and demos from the main thread to a Web Worker using `@angular-helpers/core`'s `injectWorkerPool`.
We integrate the worker asynchronously into `SearchService` via RxJS interop (`toObservable` + `switchMap` + `toSignal`). A synchronous fallback executor is provided inside `SearchService` for non-browser/SSR environments. The worker is registered as a library entry point in Vite.

## Architecture Decisions

### Decision: Interop Strategy

| Option                                                                   | Tradeoffs                                                                                                                                                                      | Decision                                                                                        |
| :----------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **Declarative RxJS Interop** (`toObservable` + `switchMap` + `toSignal`) | + Natively resolves race conditions by discarding stale queries via switchMap.<br>+ Standard Angular async stream pattern.<br>- Requires RxJS dependencies.                    | **Chosen**. Provides robust and clean query cancellation during rapid typing with minimal code. |
| **Manual writes inside `effect()`**                                      | + Avoids RxJS operators.<br>- Prone to race conditions (out-of-order execution).<br>- Requires manual request tracking.<br>- Requires `allowSignalWrites` or async scheduling. | _Rejected_. Higher complexity and risk of UI state bugs under fast input rates.                 |

### Decision: Fallback Execution Strategy

| Option                                | Tradeoffs                                                                                              | Decision                                                                                    |
| :------------------------------------ | :----------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------ |
| **Standard CPU Main Thread Fallback** | + Guarantees stable execution in SSR and strict CSP environments.<br>- Runs on main thread if invoked. | **Chosen**. Fallback ensures safety in environments without Web Worker support (e.g., SSR). |
| **No Fallback (Throw Error)**         | + Simplest code paths.<br>- Crashes application in non-browser/SSR contexts.                           | _Rejected_. SSR stability is a strict requirement.                                          |

## Data Flow

```
[User Input] ──→ query (Signal)
                  │
                  ▼ (toObservable)
             query (Observable)
                  │
                  ▼ (switchMap)
             WorkerPool.execute('search', { q })
                  ├────────────────────────────┐
                  │ (Web Worker Supported)     │ (SSR / No Workers)
                  ▼                            ▼
            [search.worker.ts]          [fallbackExecutor]
            (Off-thread filter)         (Main-thread filter)
                  │                            │
                  └─────────────┬──────────────┘
                                ▼
                        results (Observable)
                                │
                                ▼ (toSignal)
                        results (Signal) ──→ [UI Component]
```

## File Changes

| File                                           | Action | Description                                                                                                                  |
| ---------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `vite.config.ts`                               | Modify | Add `'search.worker': resolve(__dirname, 'src/workers/search.worker.ts')` entry point.                                       |
| `src/workers/search.worker.ts`                 | Create | Web Worker script importing search index data, listening for `'search'` messages, and performing case-insensitive filtering. |
| `src/app/core/services/search.service.ts`      | Modify | Refactor `SearchService` to utilize `injectWorkerPool` and async results stream.                                             |
| `src/app/core/services/search.service.spec.ts` | Create | Unit tests for async results propagation, empty query handling, cancellation of stale tasks, and fallback execution.         |

## Interfaces / Contracts

```typescript
export interface SearchTaskPayload {
  q: string;
}
```

## Testing Strategy

| Layer | What to Test               | Approach                                                                                                                                    |
| ----- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit  | Successful query execution | Mock `injectWorkerPool` returning resolved results on `'search'` type, set query, flush effects, and assert async `results` signal updates. |
| Unit  | Empty query optimization   | Set query to empty string, assert results immediately set to `[]` without calling worker pool `execute`.                                    |
| Unit  | Stale task cancellation    | Set query to "a" then "ab", assert first call is cancelled/ignored and results match second query.                                          |
| Unit  | Fallback execution         | Directly test fallback executor function logic with mixed-case matching and top 8 slice.                                                    |

## Migration / Rollout

No migration required.

## Open Questions

None.
