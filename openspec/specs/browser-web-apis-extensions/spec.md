# Browser Web APIs Extensions Specification

## Purpose

Define the requirements and behavioral scenarios for reactive, signal-based browser API wrappers in `@angular-helpers/browser-web-apis`. These utility functions MUST be SSR-safe, handle resource cleanup, and operate within Angular's injection context.

## Requirements

| Requirement ID | Name              | Strength | Description                                                                                          |
| :------------- | :---------------- | :------- | :--------------------------------------------------------------------------------------------------- |
| **REQ-01**     | Injection Context | **MUST** | Assert call site is within an injection context or throw an error.                                   |
| **REQ-02**     | SSR Safety        | **MUST** | Detect if platform is browser; on server, fall back to safe default/initial values without throwing. |
| **REQ-03**     | Auto-Cleanup      | **MUST** | Clean up all event listeners, observers, and handlers on destroy.                                    |
| **REQ-04**     | Media Query       | **MUST** | Evaluate media queries reactively and update signal on match changes.                                |
| **REQ-05**     | Breakpoints       | **MUST** | Combine multiple queries into a record of reactive boolean signals.                                  |
| **REQ-06**     | Color Scheme      | **MUST** | Track user light/dark preferences reactively via media query.                                        |
| **REQ-07**     | Reduced Motion    | **MUST** | Track user reduced motion preferences reactively via media query.                                    |
| **REQ-08**     | Document Title    | **MUST** | Sync/update title reactively; **MAY** restore previous title on destroy.                             |
| **REQ-09**     | Mouse Position    | **MUST** | Track mouse pointer coordinates reactively with passive listeners.                                   |
| **REQ-10**     | Window Scroll     | **MUST** | Track window scroll coordinates reactively with passive scroll listener.                             |
| **REQ-11**     | Permissions       | **MUST** | Query PermissionState reactively, handle status changes, and fall back on browser incompatibility.   |

## Scenarios

### Scenario 1: Out of context call (REQ-01)

- **GIVEN** a helper function is called outside an injection context (e.g., in `ngOnInit`)
- **WHEN** the function is invoked
- **THEN** it MUST throw an error asserting injection context is required

### Scenario 2: Media query tracking & cleanup (REQ-02, REQ-03, REQ-04)

- **GIVEN** `injectMediaQuery` called in browser with query `(min-width: 768px)`
- **WHEN** viewport width changes past 768px, and later the context is destroyed
- **THEN** the signal value matches the query status, and the change listener is unregistered

### Scenario 3: Breakpoints combining (REQ-05)

- **GIVEN** `injectBreakpoints` called with `xl: '(min-width: 1200px)'` and `md: '(min-width: 768px)'`
- **WHEN** viewport changes from 800px to 1300px
- **THEN** the returned signals update reactively (both `xl` and `md` become `true`)

### Scenario 4: Color scheme & reduced motion preferences (REQ-06, REQ-07)

- **GIVEN** preferences queried on server (SSR) or browser
- **WHEN** initialized or user system preference changes
- **THEN** the server returns `false`, and browser reactively matches preference changes

### Scenario 5: Title updates and restoration (REQ-08)

- **GIVEN** `injectDocumentTitle` initialized with "Target Title" and `restoreOnDestroy: true`
- **WHEN** title signal changes to "New Title", and then the context is destroyed
- **THEN** the document title updates to "New Title", and restores to original title on destroy

### Scenario 6: Mouse & scroll coordinate tracking (REQ-09, REQ-10)

- **GIVEN** `injectMousePosition` or `injectWindowScroll` initialized
- **WHEN** mouse moves or scroll occurs, and later destroyed
- **THEN** coordinate signals update reactively via passive listeners, and listeners are removed on destroy

### Scenario 7: Permission state tracking & fallback (REQ-11)

- **GIVEN** `injectPermissionState` called with permission name
- **WHEN** state changes, or API is unsupported by the browser
- **THEN** the state signal updates on change, or catches the error and falls back gracefully
