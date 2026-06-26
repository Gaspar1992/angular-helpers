# Apply Progress: core-signal-operators

**Mode**: Strict TDD

## Completed Tasks

- [x] 1.1 Create skeleton files: `packages/core/src/fns/debounced-signal.ts`, `packages/core/src/fns/throttled-signal.ts`, and `packages/core/src/fns/timer-signal.ts`.
- [x] 1.2 Create barrel file `packages/core/src/fns/index.ts` exporting all three function files.
- [x] 1.3 Update `packages/core/src/public-api.ts` to export the new `fns` module.
- [x] 2.1 Write failing (RED) tests in `packages/core/src/fns/debounced-signal.spec.ts` for value debouncing, SSR execution, and memory cleanup.
- [x] 2.2 Implement (GREEN) `debouncedSignal` in `packages/core/src/fns/debounced-signal.ts` to satisfy tests.
- [x] 2.3 Clean up (REFACTOR) `debouncedSignal` implementation and verify test compliance.
- [x] 2.4 Write failing (RED) tests in `packages/core/src/fns/throttled-signal.spec.ts` for leading/trailing, SSR execution, and memory cleanup.
- [x] 2.5 Implement (GREEN) `throttledSignal` in `packages/core/src/fns/throttled-signal.ts` to satisfy tests.
- [x] 2.6 Clean up (REFACTOR) `throttledSignal` implementation and verify test compliance.
- [x] 2.7 Write failing (RED) tests in `packages/core/src/fns/timer-signal.spec.ts` for periodic ticks, SSR execution bypass, and memory cleanup.
- [x] 2.8 Implement (GREEN) `timerSignal` in `packages/core/src/fns/timer-signal.ts` to satisfy tests.
- [x] 2.9 Clean up (REFACTOR) `timerSignal` implementation and verify test compliance.
- [x] 3.1 Create `packages/core/README.md` to document usage, parameters, and examples for the new signal operators.
- [x] 3.2 Update root `README.md` to document new core signal operators.
- [x] 3.3 Run `vitest` via command line to ensure all unit tests pass successfully.
- [x] 3.4 Run linter and formatter checks on `packages/core/` files to verify style guide compliance.

## Files Changed

| File                                             | Action   | What Was Done                                                                 |
| ------------------------------------------------ | -------- | ----------------------------------------------------------------------------- |
| `packages/core/src/fns/debounced-signal.ts`      | Created  | Native, SSR-safe `debouncedSignal` implementation                             |
| `packages/core/src/fns/debounced-signal.spec.ts` | Created  | Unit tests for `debouncedSignal`                                              |
| `packages/core/src/fns/throttled-signal.ts`      | Created  | Native, SSR-safe `throttledSignal` implementation supporting leading/trailing |
| `packages/core/src/fns/throttled-signal.spec.ts` | Created  | Unit tests for `throttledSignal`                                              |
| `packages/core/src/fns/timer-signal.ts`          | Created  | Native, SSR-safe `timerSignal` implementation supporting delay/interval       |
| `packages/core/src/fns/timer-signal.spec.ts`     | Created  | Unit tests for `timerSignal`                                                  |
| `packages/core/src/fns/index.ts`                 | Created  | Barrel export for the `fns` directory                                         |
| `packages/core/src/public-api.ts`                | Modified | Export new `fns` sub-module                                                   |
| `packages/core/README.md`                        | Created  | Package-level documentation for new utilities                                 |
| `README.md`                                      | Modified | Root documentation update with core package details                           |

## TDD Cycle Evidence

| Task    | Test File                                        | Layer | Safety Net    | RED        | GREEN     | TRIANGULATE            | REFACTOR |
| ------- | ------------------------------------------------ | ----- | ------------- | ---------- | --------- | ---------------------- | -------- |
| 1.1-1.3 | N/A (structural)                                 | N/A   | N/A (new)     | N/A        | N/A       | ➖ Skipped: structural | N/A      |
| 2.1-2.3 | `packages/core/src/fns/debounced-signal.spec.ts` | Unit  | ✅ 3/3 passed | ✅ Written | ✅ Passed | ✅ 6 cases             | ✅ Clean |
| 2.4-2.6 | `packages/core/src/fns/throttled-signal.spec.ts` | Unit  | ✅ 3/3 passed | ✅ Written | ✅ Passed | ✅ 7 cases             | ✅ Clean |
| 2.7-2.9 | `packages/core/src/fns/timer-signal.spec.ts`     | Unit  | ✅ 3/3 passed | ✅ Written | ✅ Passed | ✅ 7 cases             | ✅ Clean |

## Test Summary

- **Total tests written**: 20
- **Total tests passing**: 20
- **Layers used**: Unit (20)
- **Approval tests** (refactoring): None — no refactoring tasks
- **Pure functions created**: 0

## Deviations from Design

None — implementation matches design.

## Issues Found

None.

## Remaining Tasks

None.

## Workload / PR Boundary

- Mode: size:exception
- Current work unit: N/A
- Boundary: Tasks 1.1 through 3.4
- Estimated review budget impact: Trivial (around 300 changed lines, well below 400 lines)

## Status

14/14 tasks complete. Ready for verify.
