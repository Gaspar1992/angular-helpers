# Apply Progress: Move SearchService query filtering to a Web Worker

## Implementation Progress

**Change**: worker-search
**Mode**: Strict TDD

### Completed Tasks

- [x] 1.1 Create `src/workers/search.worker.ts` with message listener for 'search' type to filter items case-insensitively and slice results to top 8.
- [x] 1.2 Modify `vite.config.ts` to add `'search.worker': resolve(__dirname, 'src/workers/search.worker.ts')` to `build.lib.entry`.
- [x] 1.3 Compile Web Workers using `pnpm build:workers` or standard build scripts to generate `public/assets/workers/search.worker.js`.
- [x] 2.1 [RED] Create `src/app/core/services/search.service.spec.ts` with failing tests verifying worker search, empty query, cancellation, and SSR fallback.
- [x] 2.2 [GREEN] Refactor `SearchService` in `src/app/core/services/search.service.ts` to initialize `injectWorkerPool` targeting `assets/workers/search.worker.js`.
- [x] 2.3 [GREEN] Implement RxJS interop pipeline (`toObservable` + `switchMap` + `toSignal`) and fallback executor in `SearchService`.
- [x] 2.4 [REFACTOR] Remove legacy computed property, optimize imports and clean up code logic in `SearchService`.
- [x] 3.1 Run tests using `pnpm test` and verify that all 5 specs in `search.service.spec.ts` pass cleanly.
- [x] 3.2 Run `pnpm lint` and `pnpm format` to ensure compliance with style rules.

### Files Changed

| File                                           | Action   | What Was Done                                                                                                 |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `src/workers/search.worker.ts`                 | Created  | Created background Web Worker that compiles static lists and filters queries case-insensitively.              |
| `vite.config.ts`                               | Modified | Registered `search.worker` entry point in build configurations.                                               |
| `src/app/core/services/search.service.ts`      | Modified | Replaced main-thread computed filter with async Signal stream using `injectWorkerPool` and fallback executor. |
| `src/app/core/services/search.service.spec.ts` | Created  | Added unit tests asserting query search, empty inputs, RxJS task cancellation, and SSR fallback.              |
| `openspec/changes/worker-search/tasks.md`      | Modified | Checked off completed tasks.                                                                                  |

### TDD Cycle Evidence

| Task | Test File                                      | Layer | Safety Net | RED        | GREEN           | TRIANGULATE          | REFACTOR |
| ---- | ---------------------------------------------- | ----- | ---------- | ---------- | --------------- | -------------------- | -------- |
| 2.1  | `src/app/core/services/search.service.spec.ts` | Unit  | N/A (new)  | ✅ Written | ✅ Passed (5/5) | ✅ Covered all specs | ✅ Clean |
| 2.2  | `src/app/core/services/search.service.spec.ts` | Unit  | N/A (new)  | ✅ Written | ✅ Passed (5/5) | ✅ Covered all specs | ✅ Clean |
| 2.3  | `src/app/core/services/search.service.spec.ts` | Unit  | N/A (new)  | ✅ Written | ✅ Passed (5/5) | ✅ Covered all specs | ✅ Clean |
| 2.4  | `src/app/core/services/search.service.spec.ts` | Unit  | N/A (new)  | ✅ Written | ✅ Passed (5/5) | ✅ Covered all specs | ✅ Clean |

### Test Summary

- **Total tests written**: 5
- **Total tests passing**: 5
- **Layers used**: Unit (5)
- **Approval tests** (refactoring): None — no pre-existing tests to preserve.
- **Pure functions created**: 1 (`fallbackExecutor` / matching logic).

### Deviations from Design

None — implementation matches design.

### Issues Found

None.

### Remaining Tasks

None.

### Workload / PR Boundary

- Mode: single PR
- Current work unit: N/A
- Boundary: Starts with Phase 1.1 and ends with Phase 3.2.
- Estimated review budget impact: ~150-200 changed lines, low review impact.

### Status

9/9 tasks complete. Ready for verify.
