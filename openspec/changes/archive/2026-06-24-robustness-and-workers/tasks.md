# Tasks: Robustness and Web Workers Improvements

## Review Workload Forecast

| Metric               | Value     | Notes                                                                          |
| :------------------- | :-------- | :----------------------------------------------------------------------------- |
| Estimated Time       | 4-6 hours | Straightforward injection context additions and worker refactoring.            |
| Total Files Modified | ~25 files | Includes core worker pool, security service, and 20 browser API files.         |
| Testing Scope        | Medium    | New specs for wake lock, barcode detector, context check, and worker fallback. |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

## Suggested Work Units

- **Work Unit 1**: Worker resolution logic and build pipeline in `core` and `security`.
- **Work Unit 2**: Injection context assertions in `browser-web-apis`.
- **Work Unit 3**: Unit test suites for browser-dependent APIs and verification.

## Phases breakdown

### Phase 1: Foundation / Core

- [x] Add `fallbackWorkerCode` option and hybrid resolver to [injectWorkerPool](file:///home/gasparrv92/Repositorios/angular-helpers/packages/core/src/workers/worker-pool.ts#L6) in [worker-pool.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/core/src/workers/worker-pool.ts).
- [x] Incorporate configuration injection token `REGEX_WORKER_CONFIG` in [regex-worker-pool.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/security/src/services/regex-worker-pool.service.ts).

### Phase 2: Implementation of Injection assertions and Hybrid Worker Resolver

- [x] Write `scripts/inline-workers.js` to parse compiled worker JS and write `regex.worker.inline.ts` string.
- [x] Configure `packages/security/package.json` to execute `inline-workers.js` prior to build.
- [x] Insert `assertInInjectionContext` checks inside all 20 functions under `packages/browser-web-apis/src/fns/`.

### Phase 3: Testing & Specs verification

- [x] Add unit test suite `packages/browser-web-apis/src/fns/inject-wake-lock.spec.ts` asserting context and method calls.
- [x] Add unit test suite `packages/browser-web-apis/src/fns/inject-barcode-detector.spec.ts` verifying detector functionality.
- [x] Fix `inject-idle-battery-saver.spec.ts` to run inside injection context after assertInInjectionContext addition.
- [x] Verify full test suite passes: 111 test files / 688 tests — all green.

### Phase 4: Cleanup & Build Pipeline Automation

- [x] Execute compilation checks on `packages/core`, `packages/security`, and `packages/browser-web-apis`.
- [x] Verify build output files under `dist/` are correctly compiled and worker-inlined.
- [x] Run `pnpm build:packages` — all packages built successfully.
