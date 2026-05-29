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
