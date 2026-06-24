# Tasks: Bookmark Favorite Docs and Reading History

## Review Workload Forecast

| Field                   | Value         |
| ----------------------- | ------------- |
| Estimated changed lines | 200-300 lines |
| 400-line budget risk    | Low           |
| Chained PRs recommended | No            |
| Suggested split         | Not needed    |
| Delivery strategy       | ask-on-risk   |
| Chain strategy          | pending       |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal                                              | Likely PR | Notes              |
| ---- | ------------------------------------------------- | --------- | ------------------ |
| 1    | Central service, component integration, and tests | PR 1      | Single PR delivery |

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Create `src/app/docs/services/docs-history.service.ts` with `DocsHistoryService` class structure.
- [x] 1.2 Define `bookmarks` and `history` signals in `DocsHistoryService` using `injectStorageSignal` with `crossTabSync: true`.
- [x] 1.3 Define `HistoryItem` interface and helper `getLabelForRoute(route: string): string` to scan `DOCS_NAV_LIBRARIES`.
- [x] 1.4 Create `src/app/docs/services/docs-history.service.spec.ts` unit test file and configure mock routing providers.

## Phase 2: Core Implementation

- [x] 2.1 Implement router `NavigationEnd` event subscription in `DocsHistoryService` to strip query parameters and track visited paths.
- [x] 2.2 Implement `addToHistory(path: string)` in `DocsHistoryService` prepending to `history` signal, deduplicating, and capping at 10 items.
- [x] 2.3 Implement `toggleBookmark(path: string)` and `isBookmarked(path: string)` methods on `DocsHistoryService` to manage active bookmarks.
- [x] 2.4 Add unit tests to `docs-history.service.spec.ts` for navigation tracking, capping to 10, and bookmark toggling scenarios.

## Phase 3: Integration / Wiring

- [x] 3.1 Modify `src/app/docs/shared/page-header/docs-page-header.component.ts` to inject `DocsHistoryService` and render the star bookmark toggle button.
- [x] 3.2 Bind click handler to star button to trigger `toggleBookmark(path)` and dynamically apply styling based on `isBookmarked(path)`.
- [x] 3.3 Create `src/app/docs/shared/page-header/docs-page-header.component.spec.ts` to verify star button rendering and click interactions.
- [x] 3.4 Modify `src/app/docs/layout/docs-layout.component.ts` to inject `DocsHistoryService` and bind sidebar rendering to its computed signals.
- [x] 3.5 Add Bookmarks and History sections in `DocsLayoutComponent` template sidebar under the active library section.
- [x] 3.6 Create `src/app/docs/layout/docs-layout.component.spec.ts` to verify that bookmarks and history lists render in the sidebar.

## Phase 4: Verification

- [x] 4.1 Run `pnpm test` via Vitest to verify all unit tests pass successfully.
- [x] 4.2 Run `pnpm lint` and `pnpm format:check` to check code style and compliance.
