# Tasks: Core Web Vitals Performance Panel

## Review Workload Forecast

| Field                   | Value       |
| ----------------------- | ----------- |
| Estimated changed lines | 200–300     |
| 400-line budget risk    | Low         |
| Chained PRs recommended | No          |
| Suggested split         | Single PR   |
| Delivery strategy       | ask-on-risk |
| Chain strategy          | pending     |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal                      | Likely PR | Notes                                                            |
| ---- | ------------------------- | --------- | ---------------------------------------------------------------- |
| 1    | Full vitals-panel feature | PR 1      | Single PR — 2 new + 2 modified files, well under 400-line budget |

## Phase 1: Foundation (Skeleton + Test File)

- [x] 1.1 Create `src/app/docs/layout/vitals-panel.component.ts` — empty standalone component with selector `app-vitals-panel`, inline template placeholder, `ChangeDetectionStrategy.OnPush`.
- [x] 1.2 Create `src/app/docs/layout/vitals-panel.component.spec.ts` — TestBed scaffold with `vi.mock('@angular-helpers/browser-web-apis')` for `injectPerformanceObserver`. Import component, verify it creates.

## Phase 2: Core Logic (TDD — Observers + Computed Signals + Status)

- [x] 2.1 **RED**: Write failing test for LCP (Scenario 1) — mock observer returns `signal([{startTime: 1200}])`; assert `lcpMs()` === `1200`.
- [x] 2.2 **GREEN**: Implement LCP observer call + `lcpMs` computed signal + `isEntryTypeSupported('largest-contentful-paint')` guard in component. Make test pass.
- [x] 2.3 **RED**: Write failing test for CLS session-window (Scenario 2) — feed 3 entries (2 valid + 1 `hadRecentInput`); assert `clsScore()` ≈ `0.10`.
- [x] 2.4 **GREEN**: Implement CLS observer call + session-window reduction in `clsScore` computed signal. Make test pass.
- [x] 2.5 **RED**: Write failing test for INP max duration (Scenario 3) — feed 2 event entries; assert `inpMs()` === `150`.
- [x] 2.6 **GREEN**: Implement INP observer call (`durationThreshold: 16`) + `inpMs` computed filtering `interactionId > 0`. Make test pass.
- [x] 2.7 **RED**: Write failing test for N/A fallback (Scenario 4) — mock `supportedEntryTypes` without `'event'`; assert INP renders `'N/A'`.
- [x] 2.8 **GREEN**: Wire `isEntryTypeSupported()` per metric to return `null` when unsupported → template shows `'N/A'`. Make test pass.
- [x] 2.9 **RED**: Write failing test for toggle a11y (Scenario 5) — click toggle button; assert `aria-expanded` flips to `'true'`.
- [x] 2.10 **GREEN**: Add `expanded` writable signal, toggle button with `aria-expanded`, `aria-controls`, panel `id`. Make test pass.
- [x] 2.11 **REFACTOR**: Add inline CSS (fixed bottom-right positioning, status color indicators good/needs-improvement/poor per thresholds), clean up signal names.

## Phase 3: Integration (Embed in DocsLayout)

- [x] 3.1 Modify `src/app/docs/layout/docs-layout.component.ts` — add `VitalsPanelComponent` to `imports`, embed `<app-vitals-panel />` as last child inside root `<div>`.
- [x] 3.2 Modify `src/app/docs/layout/docs-layout.component.spec.ts` — add `VitalsPanelComponent` stub/mock to TestBed imports; verify layout still renders.

## Phase 4: Verification

- [x] 4.1 Run `pnpm test` — all vitals-panel and docs-layout tests must pass.
- [x] 4.2 Run `pnpm lint` — no new lint errors in touched files.
