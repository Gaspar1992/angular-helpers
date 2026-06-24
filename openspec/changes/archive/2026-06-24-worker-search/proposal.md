# Proposal: Move SearchService query filtering to a Web Worker using injectWorkerPool

## Intent

Move heavy, blocking search query filtering of documentation, blog posts, and demos off the main thread to a Web Worker. This prevents UI jank and maintains high typing responsiveness during search inputs.

## Scope

### In Scope

- Web Worker implementation (`src/workers/search.worker.ts`) doing off-thread search filtering.
- Registering the worker in `vite.config.ts` build configuration.
- Refactoring `SearchService` to use `injectWorkerPool` and declarative RxJS-interop (`toSignal` + `toObservable` + `switchMap`).
- Standard unit tests verifying `SearchService` async results, fallback executor, and error recovery.

### Out of Scope

- Adding new search index content types or external search APIs.
- UI redesign of the search modal component.

## Capabilities

### New Capabilities

- `worker-search`: Asynchronous off-thread query filtering for documentation, blog posts, and demos using a Web Worker pool, including main-thread synchronous fallback for SSR.

### Modified Capabilities

- None

## Approach

Use declarative RxJS-based integration in `SearchService` to bridge signals and worker tasks:

1. Create `src/workers/search.worker.ts` importing static data (`PACKAGES`, `BLOG_POSTS`, `PUBLIC_DEMO_SECTIONS`) to filter queries off-thread.
2. In `SearchService`, convert the `query` signal to an observable using `toObservable(this.query)`.
3. Map queries via `switchMap` to `pool.execute<SearchResult[]>('search', { q })`.
4. Convert back to signal `results` via `toSignal` with initial value `[]`.
5. Provide a synchronous `fallbackExecutor` filtering the same static list on the main thread for SSR/non-browser.
6. Register `'search.worker'` in `vite.config.ts`.

## Affected Areas

| Area                                           | Impact   | Description                                                |
| ---------------------------------------------- | -------- | ---------------------------------------------------------- |
| `vite.config.ts`                               | Modified | Register `'search.worker'` entry point.                    |
| `src/app/core/services/search.service.ts`      | Modified | Refactor using `injectWorkerPool` and async signal stream. |
| `src/workers/search.worker.ts`                 | New      | Worker script executing search query matching.             |
| `src/app/core/services/search.service.spec.ts` | New      | Unit tests for async results and SSR fallback.             |

## Risks

| Risk                                                          | Likelihood | Mitigation                                                                  |
| ------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| Worker load failure or blocked in restricted/SSR environments | Medium     | Implement main-thread synchronous fallback execution in `fallbackExecutor`. |
| Out of order results due to typing speed race conditions      | Low        | `switchMap` cancels outdated worker tasks on new input events.              |

## Rollback Plan

Revert git changes to restore synchronous `computed` signal-based filtering on the main thread in `SearchService` and remove `'search.worker'` from `vite.config.ts`.

## Dependencies

- `@angular-helpers/core` for `injectWorkerPool`.
- `@angular/core/rxjs-interop` for `toSignal` and `toObservable`.

## Success Criteria

- [ ] Search filtering runs off the main thread in the Web Worker when browser supports it.
- [ ] Non-browser/SSR environments fallback gracefully to main-thread search without throwing errors.
- [ ] Rapid typing triggers worker task cancellations for outdated queries.
