# Design: Core Web Vitals Performance Panel

## Technical Approach

Create a standalone `VitalsPanelComponent` that calls `injectPerformanceObserver` three times (one per metric type) and derives LCP/CLS/INP values via `computed()` signals. The component is embedded as a sibling of the main content area inside `DocsLayoutComponent`'s root `<div>`, positioned with fixed CSS in the bottom-right corner. CLS and INP require custom reduction logic over raw entries; LCP reads `startTime` from the latest entry directly.

## Architecture Decisions

| Decision                                                                          | Alternatives Considered                                                             | Rationale                                                                                                                                                                                     |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use `injectPerformanceObserver` (inject fn)** over `PerformanceObserverService` | Service-based DI via `PerformanceObserverService`                                   | The inject fn is the project's signal-based primitive — returns `Signal<PerformanceEntryList>` directly, no Observable conversion needed. Keeps the component reactive without subscriptions. |
| **Three separate observer calls** vs. one combined `entryTypes` observer          | Single `entryTypes: ['largest-contentful-paint', 'layout-shift', 'event']` observer | Per-type observers enable individual `buffered: true` and per-type `supportedEntryTypes` checking for granular N/A fallback (REQ-6). The `type` option is required for `buffered`.            |
| **Component-local `computed()` signals** for CLS/INP reduction                    | Dedicated service, `rxjs` pipe, or external utility                                 | Keeps logic co-located, testable via signal mocking, zero additional files. Follows the existing project convention of `computed()` for derived state.                                        |
| **`isPlatformBrowser` + `supportedEntryTypes` guard** for each metric             | Single global guard                                                                 | Granular per-metric fallback — if browser supports LCP but not `event`, only INP shows N/A (REQ-6).                                                                                           |

## Data Flow

```
injectPerformanceObserver({type:'largest-contentful-paint'})
    │ entries: Signal<PerformanceEntryList>
    ├──→ lcpMs = computed(latestEntry.startTime)
    │
injectPerformanceObserver({type:'layout-shift'})
    │ entries: Signal<PerformanceEntryList>
    ├──→ clsScore = computed(sessionWindowMax(entries))
    │
injectPerformanceObserver({type:'event', durationThreshold:16})
    │ entries: Signal<PerformanceEntryList>
    ├──→ inpMs = computed(maxDuration(entries, interactionId > 0))
    │
VitalsPanelComponent template ← reads lcpMs, clsScore, inpMs
    └──→ Formats & displays | shows 'N/A' per isSupported flag
```

## File Changes

| File                                                 | Action | Description                                                                                                                            |
| ---------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/docs/layout/vitals-panel.component.ts`      | Create | Standalone component: signals, computed CLS/INP reduction, inline template + styles, toggle state, a11y attrs.                         |
| `src/app/docs/layout/vitals-panel.component.spec.ts` | Create | Vitest unit tests: mock `injectPerformanceObserver`, verify LCP/CLS/INP computed values per spec scenarios, N/A fallback, toggle a11y. |
| `src/app/docs/layout/docs-layout.component.ts`       | Modify | Add `VitalsPanelComponent` to `imports` array and embed `<app-vitals-panel />` as last child inside root `<div>`.                      |
| `src/app/docs/layout/docs-layout.component.spec.ts`  | Modify | Add `VitalsPanelComponent` mock/stub to `TestBed` imports so layout tests pass with the new child component.                           |

## Interfaces / Contracts

```typescript
// Internal to vitals-panel.component.ts — no exported interface needed.
// Uses existing PerformanceObserverRef from the library:

import {
  injectPerformanceObserver,
  type PerformanceObserverRef,
} from '@angular-helpers/browser-web-apis';

// Computed signals (component-private):
// lcpMs:      Signal<number | null>   — startTime in ms, null = N/A
// clsScore:   Signal<number | null>   — max session-window score, null = N/A
// inpMs:      Signal<number | null>   — max interaction duration ms, null = N/A
// expanded:   WritableSignal<boolean> — toggle state

// isEntryTypeSupported(type: PerformanceEntryType): boolean
//   → checks PerformanceObserver.supportedEntryTypes.includes(type)
//   → returns false when PerformanceObserver is undefined (SSR/test)
```

## Testing Strategy

| Layer | What to Test                    | Approach                                                                                                   |
| ----- | ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Unit  | LCP computation (Scenario 1)    | Mock `injectPerformanceObserver` to return signal with `[{startTime: 1200}]`; assert `lcpMs()` === `1200`. |
| Unit  | CLS session-window (Scenario 2) | Feed 3 layout-shift entries (2 valid + 1 `hadRecentInput`); assert `clsScore()` ≈ `0.10`.                  |
| Unit  | INP max duration (Scenario 3)   | Feed 2 event entries with different durations/interactionIds; assert `inpMs()` === `150`.                  |
| Unit  | N/A fallback (Scenario 4)       | Mock `supportedEntryTypes` without `'event'`; assert INP renders `'N/A'`.                                  |
| Unit  | Toggle a11y (Scenario 5)        | Click toggle; assert `aria-expanded` flips.                                                                |
| Unit  | DocsLayout integration          | Verify layout still renders with `VitalsPanelComponent` stubbed.                                           |

Testing uses Vitest (`pnpm test`) with `vi.fn()` / `vi.mock()` following the existing `docs-layout.component.spec.ts` pattern (TestBed + signal mocks). `injectPerformanceObserver` will be mocked at the module level to return controlled signals.

## Migration / Rollout

No migration required. The component is additive — appears only inside `DocsLayoutComponent`. Removal is a clean revert of the 4 files listed above.

## Open Questions

- [x] All questions resolved — no blockers.
