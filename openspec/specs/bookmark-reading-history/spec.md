# bookmark-reading-history Specification

## Purpose

Define the client-side state management for saving favorite documentation pages (bookmarks) and tracking recently visited documentation paths (reading history).

## Requirements

### Requirement: Reactive History Tracking

The `DocsHistoryService` MUST reactively track visited documentation paths without duplicates, moving the most recent visit to the top.

#### Scenario: Navigating to a New Page

- GIVEN the reading history is empty
- WHEN the user navigates to "/docs/api-1"
- THEN the reading history list MUST contain "/docs/api-1" at index 0

#### Scenario: Navigating to an Existing Page in History

- GIVEN the reading history contains ["/docs/api-2", "/docs/api-1"]
- WHEN the user navigates to "/docs/api-1"
- THEN the reading history list MUST contain "/docs/api-1" at index 0
- AND the reading history list MUST contain "/docs/api-2" at index 1

### Requirement: History Capping

The reading history list MUST be capped at a maximum of 10 items.

#### Scenario: Capping History to 10 Items

- GIVEN the reading history contains 10 items
- WHEN the user navigates to a new page "/docs/api-11"
- THEN the reading history list MUST contain "/docs/api-11" at index 0
- AND the oldest item MUST be removed from the history list
- AND the history list size MUST remain 10

### Requirement: Bookmarks Management and Cross-Tab Synchronization

The service MUST reactively manage bookmarks and persist both bookmarks and reading history lists using browser storage. Bookmarks MUST sync reactively across browser tabs.

#### Scenario: Toggling a Bookmark

- GIVEN the bookmarks list does not contain "/docs/api-1"
- WHEN the user toggles the bookmark status for "/docs/api-1"
- THEN "/docs/api-1" MUST be added to the bookmarks list
- WHEN the user toggles the bookmark status for "/docs/api-1" again
- THEN "/docs/api-1" MUST be removed from the bookmarks list

#### Scenario: Multi-Tab Bookmark Synchronization

- GIVEN a user has two tabs open on the documentation
- WHEN the user bookmarks "/docs/api-1" in tab 1
- THEN tab 2 MUST reactively update its bookmarks list to include "/docs/api-1"
