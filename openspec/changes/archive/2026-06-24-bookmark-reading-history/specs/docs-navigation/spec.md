# Delta for docs-navigation

## ADDED Requirements

### Requirement: Sidebar Bookmarks and History List Render

The sidebar navigation menu MUST reactively display the user's bookmarked pages and reading history list.

#### Scenario: Render Saved Bookmarks and Visited Pages in Sidebar

- GIVEN the bookmarks list contains "/docs/api-1"
- AND the reading history list contains "/docs/api-2"
- WHEN the user views the sidebar navigation menu
- THEN the sidebar MUST render link navigation nodes for "/docs/api-1" and "/docs/api-2" under their respective sections

### Requirement: Header Bookmark Toggle Interaction

The page header component MUST display a bookmark star button that represents the current page's bookmark status and toggles it on user interaction.

#### Scenario: Toggling Bookmark from Page Header

- GIVEN the user is on the "/docs/api-1" page
- AND the page is not bookmarked
- WHEN the header renders
- THEN the bookmark star button MUST be displayed in an inactive/unfilled state
- WHEN the user clicks the bookmark star button
- THEN the service bookmark status for "/docs/api-1" MUST be toggled to active
- AND the star button MUST update to an active/filled state
