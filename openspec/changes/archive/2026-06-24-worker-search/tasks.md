# Tasks: Web Worker Search Filtering

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

| Field                   | Value         |
| ----------------------- | ------------- |
| Estimated changed lines | 150-200 lines |
| 400-line budget risk    | Low           |
| Chained PRs recommended | No            |
| Suggested split         | Single PR     |
| Delivery strategy       | ask-on-risk   |
| Chain strategy          | pending       |

### Suggested Work Units

| Unit | Goal                                               | Likely PR | Notes                                                           |
| ---- | -------------------------------------------------- | --------- | --------------------------------------------------------------- |
| 1    | Complete off-thread search filtering with fallback | PR 1      | Add worker, config, refactor search service with tests & checks |

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Create `src/workers/search.worker.ts` with message listener for 'search' type to filter items case-insensitively and slice results to top 8.
- [x] 1.2 Modify `vite.config.ts` to add `'search.worker': resolve(__dirname, 'src/workers/search.worker.ts')` to `build.lib.entry`.
- [x] 1.3 Compile Web Workers using `pnpm build:workers` or standard build scripts to generate `public/assets/workers/search.worker.js`.

## Phase 2: Core Implementation (TDD approach)

- [x] 2.1 [RED] Create `src/app/core/services/search.service.spec.ts` with failing tests verifying:
  - "Successful asynchronous query execution": worker pool called on query change, results signal updated.
  - "Empty query handling": query empty immediately returns empty array without worker call.
  - "Rapid typing cancels stale task": consecutive queries cancel the previous task.
  - "Fallback during server-side rendering": service executes filtering synchronously on main thread.
- [x] 2.2 [GREEN] Refactor `SearchService` in `src/app/core/services/search.service.ts` to initialize `injectWorkerPool` targeting `assets/workers/search.worker.js`.
- [x] 2.3 [GREEN] Implement RxJS interop pipeline (`toObservable` + `switchMap` + `toSignal`) and fallback executor in `SearchService`.
- [x] 2.4 [REFACTOR] Remove legacy computed property, optimize imports and clean up code logic in `SearchService`.

## Phase 3: Integration / Verification

- [x] 3.1 Run tests using `pnpm test` and verify that all 4 specs in `search.service.spec.ts` pass cleanly.
- [x] 3.2 Run `pnpm lint` and `pnpm format` to ensure compliance with style rules.
