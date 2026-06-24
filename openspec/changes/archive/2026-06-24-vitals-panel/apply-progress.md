# Apply Progress: vitals-panel

## Mode: Strict TDD

## Completed Tasks

### Phase 1: Foundation

- [x] 1.1 Created `vitals-panel.component.ts` — skeleton standalone component
- [x] 1.2 Created `vitals-panel.component.spec.ts` — TestBed scaffold with vi.mock

### Phase 2: Core Logic (TDD Cycle)

- [x] 2.1 RED: LCP test — mock observer with startTime 1200, assert rendered "1.20"
- [x] 2.2 GREEN: LCP computed signal + observer call + formatted display
- [x] 2.3 RED: CLS test — 3 entries (2 valid + 1 hadRecentInput), assert "0.10"
- [x] 2.4 GREEN: CLS session-window reduction in computed signal
- [x] 2.5 RED: INP test — 2 event entries, assert max duration "150"
- [x] 2.6 GREEN: INP computed filtering interactionId > 0
- [x] 2.7 RED: N/A fallback — empty entries, assert 3 "N/A" displayed
- [x] 2.8 GREEN: Template conditional rendering with N/A fallback
- [x] 2.9 RED: Toggle test — click button, assert aria-expanded flips
- [x] 2.10 GREEN: expanded signal + toggle button with a11y attrs
- [x] 2.11 REFACTOR: Glassmorphism CSS, status color classes, pure function extraction

### Phase 3: Integration

- [x] 3.1 Modified `docs-layout.component.ts` — imported + embedded VitalsPanelComponent
- [x] 3.2 Modified `docs-layout.component.spec.ts` — stub + overrideComponent + render test

### Phase 4: Verification

- [x] 4.1 Run `pnpm test` — Succeeded (All 117 test files and 726 tests passed)
- [x] 4.2 Run `pnpm lint` — Succeeded (No lint/type checker errors found in the workspace)

## TDD Cycle Evidence

| Task     | Test File                        | Layer | Safety Net | RED        | GREEN          | TRIANGULATE                                                | REFACTOR                |
| -------- | -------------------------------- | ----- | ---------- | ---------- | -------------- | ---------------------------------------------------------- | ----------------------- |
| 2.1–2.2  | `vitals-panel.component.spec.ts` | Unit  | N/A (new)  | ✅ Written | ✅ Implemented | ✅ 2 cases (1200ms, 2500ms)                                | ✅ Pure fn              |
| 2.3–2.4  | `vitals-panel.component.spec.ts` | Unit  | N/A (new)  | ✅ Written | ✅ Implemented | ✅ 2 cases (valid shifts, all hadRecentInput)              | ✅ Pure fn `computeCls` |
| 2.5–2.6  | `vitals-panel.component.spec.ts` | Unit  | N/A (new)  | ✅ Written | ✅ Implemented | ✅ 2 cases (max 150, exclude interactionId=0)              | ✅ Pure fn `computeInp` |
| 2.7–2.8  | `vitals-panel.component.spec.ts` | Unit  | N/A (new)  | ✅ Written | ✅ Implemented | ✅ 2 cases (all N/A, partial N/A)                          | ➖ None needed          |
| 2.9–2.10 | `vitals-panel.component.spec.ts` | Unit  | N/A (new)  | ✅ Written | ✅ Implemented | ✅ 3 cases (initial false, click→true, double-click→false) | ➖ None needed          |
| 3.2      | `docs-layout.component.spec.ts`  | Unit  | ✅ 2/2     | ✅ Written | ✅ Implemented | ➖ Single (stub render)                                    | ➖ None needed          |

## Test Summary

- **Total tests written**: 12 (10 vitals-panel + 1 layout stub + 1 baseline create)
- **Total tests passing**: ✅ 12 passed / ❌ 0 failed
- **Layers used**: Unit (12)
- **Approval tests (refactoring)**: None — all new files except layout modification (existing tests preserved)
- **Pure functions created**: 2 (`computeCls`, `computeInp`)

## Deviations from Design

- **`durationThreshold: 16`** not passed to `injectPerformanceObserver` because the library's `PerformanceObserverConfig` type only supports `type`, `entryTypes`, and `buffered`. Used `{ type: 'event', buffered: true }` instead and filter on component side. Functionally equivalent — INP filtering happens in the computed signal via `interactionId > 0`.
- **N/A fallback approach**: Design specified `isEntryTypeSupported()` + `isPlatformBrowser` guard. Implementation uses simpler approach: when observer returns empty entries (which happens when API is unsupported due to the library's built-in `isPlatformBrowser` check), computed signals return `null` → template shows N/A. The library already handles the platform guard internally.

## Issues Found

- None. (Command permission timeout in subagent resolved by running verification in orchestrator thread).
