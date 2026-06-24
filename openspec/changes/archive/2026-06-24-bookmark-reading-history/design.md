# Design: Bookmark Favorite Docs and Reading History

## Technical Approach

We will build a centralized, reactive singleton service `DocsHistoryService` using `@angular-helpers/storage`'s `injectStorageSignal` with `crossTabSync: true` to manage `bookmarks` and `reading_history` states.
We will track navigation reactively by subscribing to router `NavigationEnd` events, filtering for `/docs` paths, stripping query parameters, and prepending them to the history list with a strict cap of 10 items.
We will integrate a toggle button in `DocsPageHeaderComponent` and dynamically render bookmark/history sections in the `DocsLayoutComponent` navigation sidebar.

## Architecture Decisions

### Decision: Centralized Service vs. Component-level State

| Option                    | Tradeoff                                                                                    | Decision                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Centralized Service**   | Requires a new service file, but clean separation of concerns and easily mockable in tests. | **Chosen**. Keeps components thin, business logic unit-testable, and provides a single source of truth. |
| **Component-level State** | Fast implementation, but duplicates logic across layout and headers, violating SRP.         | _Rejected_. Leads to code sprawl and hard-to-maintain components.                                       |

### Decision: Query Parameters Preservation

| Option                     | Tradeoff                                                                                                                                           | Decision                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Strip Query Parameters** | Simplified comparisons, version-agnostic bookmarks. Paths like `/docs/api` match across version selections.                                        | **Chosen**. Bookmarks and history track the page itself. Dynamic versioning will resolve via existing route handlers. |
| **Keep Query Parameters**  | Preserves exact user states (e.g., active version `?v=21`), but results in duplicate history entries for the same page under different parameters. | _Rejected_. Distracts reading history with redundant entries.                                                         |

## Data Flow

```
[Router Events] ──→ [DocsHistoryService] ──(NavEnd)──→ [history StorageSignal]
                         │
                         ├─(toggleBookmark)──────────→ [bookmarks StorageSignal]
                         │
                         ├───────────────────────────→ [bookmarkedItems/historyItems Computed] ──→ [DocsLayoutComponent Sidebar]
                         │
                         └───────────────────────────→ [isBookmarked(path) Computed] ──────────→ [DocsPageHeaderComponent Star]
```

## File Changes

| File                                                            | Action | Description                                                                                                         |
| --------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| `src/app/docs/services/docs-history.service.ts`                 | Create | Root-provided service managing bookmark and history signals using `injectStorageSignal` and tracking router events. |
| `src/app/docs/services/docs-history.service.spec.ts`            | Create | Unit tests validating navigation history updates, duplicate removal, capping to 10 items, and bookmark toggling.    |
| `src/app/docs/shared/page-header/docs-page-header.component.ts` | Modify | Add star toggle button to the page header, check bookmark state via `DocsHistoryService`.                           |
| `src/app/docs/layout/docs-layout.component.ts`                  | Modify | Inject `DocsHistoryService` and render the Bookmark and History sections in the second sidebar.                     |

## Interfaces / Contracts

```typescript
export interface HistoryItem {
  route: string;
  label: string;
}

// In DocsHistoryService
export class DocsHistoryService {
  readonly bookmarks: StorageSignal<string[]>;
  readonly history: StorageSignal<string[]>;
  readonly bookmarkedItems: Signal<HistoryItem[]>;
  readonly historyItems: Signal<HistoryItem[]>;

  toggleBookmark(path: string): void;
  isBookmarked(path: string): boolean;
  addToHistory(path: string): void;
}
```

### Route-to-Label Resolver Utility

A helper utility `getLabelForRoute(route: string): string` scans `DOCS_NAV_LIBRARIES` to match route items to their exact labels. If no match is found, it falls back to a clean capitalised conversion of the final URL segment.

## Testing Strategy

| Layer            | What to Test                                                                                                        | Approach                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Unit (Service)   | Reactive navigation tracking, deduplication, capping to 10 items, bookmark toggling.                                | Mock `Router` events with a Subject. Modify signal states and assert values with Vitest expectations. |
| Unit (Component) | `DocsPageHeaderComponent` renders unfilled star when not bookmarked, filled star when bookmarked, toggles on click. | Stub `DocsHistoryService` with mock signals, click button, verify toggle function called.             |
| Unit (Component) | `DocsLayoutComponent` displays Bookmarks/History lists when signals have items, hides sections when empty.          | Stub `DocsHistoryService` signals with mock data, check sidebar list rendering and route links.       |

## Migration / Rollout

No migration required. Client-side state defaults to empty arrays for all users. Rollout is immediate with the next deployment.

## Open Questions

- None.
