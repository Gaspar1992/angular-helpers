# Specification: Docs Navigation and Resolvers (docs-navigation)

## Purpose

Define the behavior of dynamic documentation navigation sourcing and route data resolving based reactively on the active version from `DocsVersionService`.

## Requirements

1. The `docs-nav.data.ts` navigation configuration MUST expose a dynamic array of navigation nodes.
2. The navigation list MUST reactively update when the active version in `DocsVersionService` changes, matching only the navigation tree of the selected version (v21 or v22).
3. The `overview.resolver.ts` MUST reactively switch-map the active version signal from `DocsVersionService`.
4. The resolver MUST dynamically resolve and return metadata content:
   - When version is `'v21'`, the resolver MUST fetch and return `core.v21.data.ts` content.
   - When version is `'v22'`, the resolver MUST fetch and return `core.data.ts` content.
5. Sourcing of the versioned documents and navigation configurations MUST be pure, reactive, and free of manual page reloads or layout destruction.
6. The sidebar navigation menu MUST reactively display the user's bookmarked pages and reading history list.
7. The page header component MUST display a bookmark star button that represents the current page's bookmark status and toggles it on user interaction.

## Scenarios

### Scenario 1: Navigation Updates on Version Transition

```gherkin
Given a user is browsing the documentation
And the active version is "v22"
When the user changes the active version to "v21"
Then the sidebar navigation menu MUST reactively update to display v21-specific nodes
And the router MUST NOT perform a full page reload or destroy the layout container
```

### Scenario 2: Route Resolver Switches Data Source

```gherkin
Given the user navigates to "/docs/overview"
And the `DocsVersionService.version` is "v21"
When the route resolves through `overview.resolver.ts`
Then the resolver MUST fetch data from the "core.v21.data.ts" file
And pass it as the resolved data to the component

Given the user navigates to "/docs/overview"
And the `DocsVersionService.version` is "v22"
When the route resolves through `overview.resolver.ts`
Then the resolver MUST fetch data from the "core.data.ts" file
And pass it as the resolved data to the component
```

### Scenario 3: Render Saved Bookmarks and Visited Pages in Sidebar

- GIVEN the bookmarks list contains "/docs/api-1"
- AND the reading history list contains "/docs/api-2"
- WHEN the user views the sidebar navigation menu
- THEN the sidebar MUST render link navigation nodes for "/docs/api-1" and "/docs/api-2" under their respective sections

### Scenario 4: Toggling Bookmark from Page Header

- GIVEN the user is on the "/docs/api-1" page
- AND the page is not bookmarked
- WHEN the header renders
- THEN the bookmark star button MUST be displayed in an inactive/unfilled state
- WHEN the user clicks the bookmark star button
- THEN the service bookmark status for "/docs/api-1" MUST be toggled to active
- AND the star button MUST update to an active/filled state
