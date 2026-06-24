# Proposal: Bookmark Favorite Docs and Reading History

## Intent

Implement a client-side bookmarks and reading history feature for the documentation pages to allow developers to save favorite APIs and access recently visited documentation paths.

## Scope

### In Scope

- Centralized `DocsHistoryService` to manage history and bookmarks state.
- Cap reading history to a maximum of 10 items, avoiding duplicates.
- Sync favorites and history with `LocalStorage` using `@angular-helpers/storage`'s `injectStorageSignal`.
- Star button in `DocsPageHeaderComponent` to toggle favorite status.
- Render bookmarks and history lists in `DocsLayoutComponent` sidebar navigation.
- Multi-tab synchronization for favorites.

### Out of Scope

- Backend persistence (local-only storage).
- Searching or filtering within history/favorites.
- Exporting or importing bookmark lists.

## Capabilities

### New Capabilities

- `bookmark-reading-history`: Manages docs bookmarking and navigation history tracking with local storage persistence.

### Modified Capabilities

- `docs-navigation`: Displays bookmark lists and recently read articles within the main sidebar.

## Approach

Create a singleton `DocsHistoryService`. Use `injectStorageSignal` for `docs_bookmarks` and `docs_reading_history` with `crossTabSync: true`. Track navigation by subscribing to router `NavigationEnd` events inside the service. Prevent duplicates by moving the most recent visit to the top. Integrate toggling in `DocsPageHeaderComponent` and lists rendering in `DocsLayoutComponent`.

## Affected Areas

| Area                                                            | Impact   | Description                                               |
| --------------------------------------------------------------- | -------- | --------------------------------------------------------- |
| `src/app/docs/services/docs-history.service.ts`                 | New      | High-level history and bookmark state management service. |
| `src/app/docs/services/docs-history.service.spec.ts`            | New      | Unit tests for routing and storage interaction.           |
| `src/app/docs/shared/page-header/docs-page-header.component.ts` | Modified | Add star toggle button to top-header component.           |
| `src/app/docs/layout/docs-layout.component.ts`                  | Modified | Sidenav template updates to show lists.                   |

## Risks

| Risk                   | Likelihood | Mitigation                                                   |
| ---------------------- | ---------- | ------------------------------------------------------------ |
| SSR hydration failure  | Low        | `@angular-helpers/storage` handles SSR checking internally.  |
| Unbounded state growth | Low        | Strict cap of 10 items for reading history.                  |
| Cross-tab syncing lag  | Low        | Enable `crossTabSync: true` in storage signal configuration. |

## Rollback Plan

Revert code changes in `DocsPageHeaderComponent`, `DocsLayoutComponent`, and delete `DocsHistoryService`. No data migrations are needed since storage is client-side only.

## Dependencies

- `@angular-helpers/storage` (already installed).

## Success Criteria

- [ ] Users can favorite/unfavorite pages via `DocsPageHeaderComponent`.
- [ ] Active favorites sync across open browser tabs.
- [ ] Reading history records up to 10 unique docs pages.
- [ ] Sidebar renders both lists dynamically.
