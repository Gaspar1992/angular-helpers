## Exploration: Bookmark Favorite Docs and Reading History

### Current State

Currently, the documentation platform (`/docs`) resolves metadata using resolvers (`overview.resolver.ts`, `service-detail.resolver.ts`) and displays library sections in a dual-sidebar layout (`DocsLayoutComponent`). The detail pages are rendered using standalone components (`UnifiedServiceDetailComponent`), and the page header is managed by a shared standalone component (`DocsPageHeaderComponent`). There is no mechanism to save page bookmarks or record visited pages for navigation retrieval.

We have a robust local library `@angular-helpers/storage` which exports `injectStorageSignal`, allowing easy, reactive synchronization of Angular Signals with browser storage (`local`, `session`, `indexeddb`, etc.) with cross-tab syncing.

### Affected Areas

- `src/app/docs/services/docs-history.service.ts` — **New file**. Handles reactive storage signals for favorites and reading history using `injectStorageSignal` and hooks into routing events.
- `src/app/docs/services/docs-history.service.spec.ts` — **New file**. Unit tests for the new history and bookmark service.
- `src/app/docs/shared/page-header/docs-page-header.component.ts` — **Modified**. Integrate a bookmark star toggle button that dynamically updates state in the history service.
- `src/app/docs/layout/docs-layout.component.ts` — **Modified**. Injects `DocsHistoryService` and displays the saved bookmarks and history sections in the navigation sidebar.

### Approaches

1. **Centralized Service with `@angular-helpers/storage` integration (Recommended)**
   - Create a dedicated `DocsHistoryService` registered in the root provider. This service instantiates two `injectStorageSignal` states: `docs_bookmarks` and `docs_reading_history`. It listens to router `NavigationEnd` events, extracts navigation items matching known documentation links, and updates the history list reactively (capped at 10 items). It also exposes helpers for toggling bookmarks.
   - **Pros**:
     - Keeps business logic, routing, and storage integration completely decoupled from UI display.
     - Easy to test using Angular `TestBed` and standard Vitest mocks.
     - Extensible: other components can easily reuse bookmarks and history signals.
   - **Cons**:
     - Requires subscribing to router events, which must be safely disposed of (handled natively in services or via `takeUntilDestroyed`).
   - **Effort**: Low/Medium

2. **Ad-Hoc component-level local storage calls**
   - Directly inject `injectStorageSignal` inside `DocsLayoutComponent` and `UnifiedServiceDetailComponent` and handle list tracking, uniqueness, and capping in components.
   - **Pros**:
     - No new service file.
   - **Cons**:
     - Violated Single Responsibility Principle.
     - Duplicated storage and router tracking logic across components.
     - Difficult to write clean unit tests without mocking multiple internal component behaviors.
   - **Effort**: Medium

### Recommendation

We recommend **Approach 1**. Centralizing logic in `DocsHistoryService` is a best-practice Angular architecture. It maintains clear separation of concerns, simplifies testing, and provides clean reactive signals (`bookmarks()`, `history()`) that the sidebar and page headers can consume directly.

### Risks

- **SSR Compatibility**: Since the storage library interacts with the browser's storage APIs, we must ensure it behaves correctly during Server-Side Rendering (SSR). `@angular-helpers/storage` inherently wraps L2 transports with hydration safety (checking for browser contexts before writing/reading), so no custom node window-checks are required.
- **Unbounded History list growth**: We will cap the history to a maximum of 10 items and filter out duplicate entries (bringing the most recent to the front) to maintain high performance and low storage overhead.
- **Cross-tab state synchronization**: To ensure bookmarks are synchronized across multiple browser tabs, we should enable the `crossTabSync: true` option in the storage signal config.

### Ready for Proposal

Yes. The requirements and architecture are clear. The orchestrator should proceed to the proposal phase.
