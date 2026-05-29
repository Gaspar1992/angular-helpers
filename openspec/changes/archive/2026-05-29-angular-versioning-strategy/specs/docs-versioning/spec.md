# Specification: Docs Versioning (docs-versioning)

## Purpose

Define the behavior of `DocsVersionService`, a singleton service managing and synchronizing active documentation version state across components reactively without tearing down layout shells.

## Requirements

1. The `DocsVersionService` MUST be a singleton service registered in the application root.
2. The service MUST expose a read-only Angular Signal named `version` holding the active version state (`'v21'` | `'v22'`).
3. The service MUST initialize the version state based on the current URL query parameters on application startup:
   - If query parameter `?v=21` is present, `version` MUST be set to `'v21'`.
   - If query parameter `?v=22` is present, or if no `v` query parameter is supplied, or if the parameter is invalid, `version` MUST default to `'v22'`.
4. The service MUST reactively synchronize updates:
   - Changing the `version` Signal value MUST trigger a navigation to update the query parameter `?v` in the URL.
   - External browser navigation or direct URL parameter updates to `?v` MUST update the `version` Signal value.
5. Navigation changes triggered by version synchronization MUST preserve existing route components and MUST NOT cause layout tear-downs or full page reloads.

## Scenarios

### Scenario 1: Initializing Version State from URL Parameter

```gherkin
Given the application is loading
When a user navigates to "/docs/overview?v=21"
Then the `DocsVersionService.version` Signal MUST hold the value "v21"
```

### Scenario 2: Defaulting when Parameter is Missing or Invalid

```gherkin
Given the application is loading
When a user navigates to "/docs/overview?v=invalid-version" or "/docs/overview"
Then the `DocsVersionService.version` Signal MUST default to "v22"
```

### Scenario 3: Programmatic Signal Update Syncs to URL

```gherkin
Given the application is loaded
And the active version is "v22"
When the user programmatically updates the version state to "v21"
Then the Angular Router MUST navigate to update the query parameter to "?v=21"
And the layout shell components MUST NOT be destroyed or re-created
```

### Scenario 4: URL Query Parameter Update Syncs to Signal

```gherkin
Given the application is loaded
And the active version is "v22"
When the router detects an external query parameter update to "?v=21"
Then the `DocsVersionService.version` Signal MUST reactively update to "v21"
```
