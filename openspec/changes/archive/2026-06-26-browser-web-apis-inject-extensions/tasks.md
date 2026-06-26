# Tasks: Browser Web APIs Extensions

## Review Workload Forecast

| Field                   | Value                |
| ----------------------- | -------------------- |
| Estimated changed lines | 500-600 lines        |
| 400-line budget risk    | High                 |
| Chained PRs recommended | Yes                  |
| Suggested split         | PR 1 → PR 2 → PR 3   |
| Delivery strategy       | ask-on-risk          |
| Chain strategy          | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                                                         | Likely PR | Notes                  |
| ---- | ---------------------------------------------------------------------------- | --------- | ---------------------- |
| 1    | Base MediaQuery & Breakpoints utilities + tests.                             | PR 1      | Targets feature-branch |
| 2    | Preferred Color Scheme & Reduced Motion + tests.                             | PR 2      | Targets PR 1 branch    |
| 3    | Document Title, Mouse Position, Window Scroll, and Permission State + tests. | PR 3      | Targets PR 2 branch    |

## Phase 1: Foundation (implementing utilities/helpers/media-query/etc. first)

- [x] 1.1 Create [inject-media-query.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-media-query.spec.ts) with RED tests for context checking, query tracking, and listener cleanup.
- [x] 1.2 Implement `injectMediaQuery` in [inject-media-query.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-media-query.ts) to pass tests.
- [x] 1.3 Create [inject-breakpoints.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-breakpoints.spec.ts) with RED tests checking multi-query mapping.
- [x] 1.4 Implement `injectBreakpoints` in [inject-breakpoints.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-breakpoints.ts) layering on top of `injectMediaQuery`.

## Phase 2: Core implementation of the inject functions

- [x] 2.1 Create [inject-preferred-color-scheme.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-preferred-color-scheme.spec.ts) with RED tests for tracking dark preference.
- [x] 2.2 Implement `injectPreferredColorScheme` in [inject-preferred-color-scheme.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-preferred-color-scheme.ts).
- [x] 2.3 Create [inject-reduced-motion.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-reduced-motion.spec.ts) with RED tests checking reduced-motion tracking.
- [x] 2.4 Implement `injectReducedMotion` in [inject-reduced-motion.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-reduced-motion.ts).
- [x] 2.5 Create [inject-document-title.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-document-title.spec.ts) with RED tests verifying title setting and restore behavior.
- [x] 2.6 Implement `injectDocumentTitle` in [inject-document-title.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-document-title.ts).
- [x] 2.7 Create [inject-mouse-position.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-mouse-position.spec.ts) with RED tests checking coordinate signals and passive listener setup.
- [x] 2.8 Implement `injectMousePosition` in [inject-mouse-position.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-mouse-position.ts).
- [x] 2.9 Create [inject-window-scroll.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-window-scroll.spec.ts) with RED tests for window scroll position signals and passive listeners.
- [x] 2.10 Implement `injectWindowScroll` in [inject-window-scroll.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-window-scroll.ts).
- [x] 2.11 Create [inject-permission-state.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-permission-state.spec.ts) with RED tests for query state tracking and Firefox compatibility fallback.
- [x] 2.12 Implement `injectPermissionState` in [inject-permission-state.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/fns/inject-permission-state.ts).

## Phase 3: Testing & Exports (public-api.ts modifications, checking vitest run, lint, format)

- [x] 3.1 Export all new functions and interfaces in [public-api.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/public-api.ts).
- [x] 3.2 Run the full test suite with Vitest to ensure all tests pass.
- [x] 3.3 Run linter and formatter on all modified/created files.
