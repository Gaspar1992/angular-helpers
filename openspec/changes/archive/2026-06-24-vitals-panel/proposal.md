# Proposal: Core Web Vitals Performance Panel

## Intent

Display real-time LCP, CLS, and INP metrics in the documentation layout using `injectPerformanceObserver` to show library performance under real usage.

## Scope

### In Scope

- Create standalone `VitalsPanelComponent` floating in `DocsLayoutComponent` bottom-right.
- Use `injectPerformanceObserver` to read metrics.
- Calculate standard CLS session window (gap < 1s, duration <= 5s, no `hadRecentInput`).
- Calculate INP (max duration of interaction event entries with `interactionId > 0`).
- Gracefully fallback to `N/A` when APIs are unsupported.
- Unit tests with mocked `PerformanceObserver`.

### Out of Scope

- Sending metrics to external servers.
- Custom user timing metrics.
- Integrating panel in non-documentation layouts.

## Capabilities

### New Capabilities

- `vitals-panel`: Floating performance panel displaying real-time LCP, CLS, and INP metrics, with robust session-window calculations and browser fallback states.

### Modified Capabilities

- None

## Approach

1. **VitalsPanelComponent**: Standalone component under `src/app/docs/layout/`.
2. **LCP**: Observe `largest-contentful-paint`; display latest `startTime`.
3. **CLS**: Observe `layout-shift`; aggregate session-windows (excluding `hadRecentInput`).
4. **INP**: Observe `event`; return max duration where `interactionId > 0`.
5. **UI**: Float in bottom-right with glassmorphism styling.
6. **Resilience**: Check API support via `PerformanceObserver.supportedEntryTypes` or display `N/A`.
7. **Testing**: Mock observers in unit tests.

## Affected Areas

| Area                                                | Impact   | Description                          |
| --------------------------------------------------- | -------- | ------------------------------------ |
| `src/app/docs/layout/vitals-panel.component.ts`     | New      | Standalone floating panel component. |
| `src/app/docs/layout/docs-layout.component.ts`      | Modified | Import and embed component.          |
| `src/app/docs/layout/docs-layout.component.spec.ts` | Modified | Support layout testing.              |

## Risks

| Risk                    | Likelihood | Mitigation                                  |
| ----------------------- | ---------- | ------------------------------------------- |
| Unsupported entry types | High       | Check `supportedEntryTypes` and show `N/A`. |
| Missing API in Vitest   | High       | Guard with browser check, mock in tests.    |

## Rollback Plan

Revert modified files and delete the new `VitalsPanelComponent` file:

```bash
git checkout HEAD -- src/app/docs/layout/docs-layout.component.ts src/app/docs/layout/docs-layout.component.spec.ts
rm src/app/docs/layout/vitals-panel.component.ts
```

## Dependencies

- `@angular-helpers/browser-web-apis` (for `injectPerformanceObserver` and `WINDOW`)

## Success Criteria

- [ ] Panel renders in bottom-right corner.
- [ ] LCP, CLS, INP display real-time updates.
- [ ] Unsupported environments render `N/A` without error.
- [ ] Unit tests verify state calculations.
