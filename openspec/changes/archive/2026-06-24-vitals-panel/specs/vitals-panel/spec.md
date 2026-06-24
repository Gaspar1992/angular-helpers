# Specification: Core Web Vitals Panel (vitals-panel)

## Purpose

Define the behavior, calculations, and interface of a floating, real-time Core Web Vitals performance panel within the documentation layout.

## Requirements

| ID    | Requirement Description                                                                                                                                                                                                           | Strength |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| REQ-1 | The component MUST be a standalone Angular component floating in the bottom-right corner of the `DocsLayoutComponent`.                                                                                                            | MUST     |
| REQ-2 | The panel MUST display LCP, CLS, and INP metrics using `injectPerformanceObserver`.                                                                                                                                               | MUST     |
| REQ-3 | LCP MUST be calculated using the `startTime` of the latest `'largest-contentful-paint'` entry.                                                                                                                                    | MUST     |
| REQ-4 | CLS MUST be computed by aggregating `'layout-shift'` scores into session windows (gap < 1s, duration <= 5s, excluding entries where `hadRecentInput` is true) and taking the maximum aggregated score across all session windows. | MUST     |
| REQ-5 | INP MUST display the maximum duration of interaction `'event'` entries where `interactionId` is greater than 0.                                                                                                                   | MUST     |
| REQ-6 | The panel MUST display `'N/A'` for any metric whose entry type is unsupported by the current browser/environment or if `PerformanceObserver` is absent.                                                                           | MUST     |
| REQ-7 | The panel MUST support expansion/collapse toggling with appropriate accessibility attributes (e.g., `aria-expanded` and `aria-controls`).                                                                                         | MUST     |

## Scenarios

### Scenario 1: Displaying Real-Time LCP

- GIVEN the vitals-panel is rendering in a browser supporting LCP
- WHEN a `'largest-contentful-paint'` entry is observed with `startTime` of 1200ms
- THEN the LCP metric MUST update to display 1.20s

### Scenario 2: Cumulative Layout Shift Session Window Calculation

- GIVEN three `'layout-shift'` entries: shift A (score 0.05 at 1.0s, no recent input), shift B (score 0.05 at 1.5s, no recent input), and shift C (score 0.1 at 3.0s, `hadRecentInput` is true)
- WHEN CLS is computed
- THEN shift A and B MUST form a session window with an accumulated score of 0.10
- AND shift C MUST be excluded from CLS calculation
- AND the CLS metric MUST display 0.10

### Scenario 3: Displaying Interaction to Next Paint

- GIVEN two `'event'` entries: interaction A (duration 80ms, `interactionId` 100) and interaction B (duration 150ms, `interactionId` 101)
- WHEN INP is computed
- THEN the INP metric MUST display 150ms

### Scenario 4: Graceful Browser Fallback

- GIVEN the browser does not support the `'event'` entry type in `PerformanceObserver.supportedEntryTypes`
- WHEN the vitals-panel renders
- THEN the INP metric MUST display `'N/A'`

### Scenario 5: Panel Toggle Accessibility

- GIVEN the vitals-panel dashboard is collapsed
- WHEN the user clicks the toggle button
- THEN the panel MUST expand
- AND the toggle button's `aria-expanded` attribute MUST update to `'true'`
