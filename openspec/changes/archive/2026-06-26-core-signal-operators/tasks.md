# Tasks: Core Signal Operators

## Review Workload Forecast

| Field                   | Value                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Estimated changed lines | 250-350 lines                                                                                                     |
| 400-line budget risk    | Low                                                                                                               |
| Chained PRs recommended | No                                                                                                                |
| Suggested split         | Unit 1: debouncedSignal, throttledSignal, timerSignal implementation and tests, exports, and READMEs. (Single PR) |
| Delivery strategy       | ask-on-risk                                                                                                       |
| Chain strategy          | size-exception                                                                                                    |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal                                                                                                      | Likely PR | Notes                                         |
| ---- | --------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------- |
| 1    | Create foundation, implement debouncedSignal, throttledSignal, timerSignal with tests, and update READMEs | PR 1      | Base branch; tests/docs included. (Single PR) |

## Phase 1: Foundation

- [x] 1.1 Create skeleton files: `packages/core/src/fns/debounced-signal.ts`, `packages/core/src/fns/throttled-signal.ts`, and `packages/core/src/fns/timer-signal.ts`.
- [x] 1.2 Create barrel file `packages/core/src/fns/index.ts` exporting all three function files.
- [x] 1.3 Update `packages/core/src/public-api.ts` to export the new `fns` module.

## Phase 2: Core Implementation (Strict TDD Cycle)

- [x] 2.1 Write failing (RED) tests in `packages/core/src/fns/debounced-signal.spec.ts` for value debouncing, SSR execution, and memory cleanup.
- [x] 2.2 Implement (GREEN) `debouncedSignal` in `packages/core/src/fns/debounced-signal.ts` to satisfy tests.
- [x] 2.3 Clean up (REFACTOR) `debouncedSignal` implementation and verify test compliance.
- [x] 2.4 Write failing (RED) tests in `packages/core/src/fns/throttled-signal.spec.ts` for leading/trailing, SSR execution, and memory cleanup.
- [x] 2.5 Implement (GREEN) `throttledSignal` in `packages/core/src/fns/throttled-signal.ts` to satisfy tests.
- [x] 2.6 Clean up (REFACTOR) `throttledSignal` implementation and verify test compliance.
- [x] 2.7 Write failing (RED) tests in `packages/core/src/fns/timer-signal.spec.ts` for periodic ticks, SSR execution bypass, and memory cleanup.
- [x] 2.8 Implement (GREEN) `timerSignal` in `packages/core/src/fns/timer-signal.ts` to satisfy tests.
- [x] 2.9 Clean up (REFACTOR) `timerSignal` implementation and verify test compliance.

## Phase 3: Documentation and Quality Checks

- [x] 3.1 Create `packages/core/README.md` to document usage, parameters, and examples for the new signal operators.
- [x] 3.2 Update root `README.md` to document new core signal operators.
- [x] 3.3 Run `vitest` via command line to ensure all unit tests pass successfully.
- [x] 3.4 Run linter and formatter checks on `packages/core/` files to verify style guide compliance.
