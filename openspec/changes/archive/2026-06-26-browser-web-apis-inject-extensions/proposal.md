# Proposal: Add Browser API Signal-Based Wrappers

## Intent

Add new signal-based browser API wrappers to `@angular-helpers/browser-web-apis` to simplify responsive designs, accessibility states, metrics tracking, and permissions in a reactive, SSR-safe, and memory-safe manner.

## Scope

### In Scope

- Implement 8 new reactive, injection-context-aware, and SSR-safe utility functions:
  - `injectMediaQuery`: Checks and reactive tracks media query state.
  - `injectBreakpoints`: Combines media queries to track viewport breakpoints.
  - `injectPreferredColorScheme`: Detects and tracks user color scheme preference.
  - `injectReducedMotion`: Detects and tracks reduced motion preference.
  - `injectDocumentTitle`: Reactively manages and restores the document title.
  - `injectMousePosition`: Tracks coordinates of the mouse on the window.
  - `injectWindowScroll`: Tracks window scroll offset coordinates.
  - `injectPermissionState`: Queries and tracks PermissionStatus changes.
- Export all functions and their associated types/interfaces from the public API.
- Provide comprehensive Vitest unit tests verifying behavior and context enforcement.

### Out of Scope

- Angular Services or directives for these utilities (keeping them function-based).
- Support for Node.js-based polyfills for these APIs.

## Capabilities

### New Capabilities

- browser-web-apis-extensions: Custom reactive signal-based wrappers for browser APIs (media queries, preferred color scheme, reduced motion, breakpoints, document title, mouse position, window scroll, and permissions state).

### Modified Capabilities

- None

## Approach

Implement composite and shared primitives where `injectBreakpoints`, `injectPreferredColorScheme`, and `injectReducedMotion` reuse `injectMediaQuery`. Other utilities will utilize standard browser listeners (safeguarded by `isPlatformBrowser` for SSR support) and bind cleanups using `DestroyRef.onDestroy`.

## Affected Areas

| Area                                                                 | Impact   | Description                                  |
| -------------------------------------------------------------------- | -------- | -------------------------------------------- |
| `packages/browser-web-apis/src/public-api.ts`                        | Modified | Export new functions and types               |
| `packages/browser-web-apis/src/fns/inject-media-query.ts`            | New      | Create `injectMediaQuery` function           |
| `packages/browser-web-apis/src/fns/inject-breakpoints.ts`            | New      | Create `injectBreakpoints` function          |
| `packages/browser-web-apis/src/fns/inject-preferred-color-scheme.ts` | New      | Create `injectPreferredColorScheme` function |
| `packages/browser-web-apis/src/fns/inject-reduced-motion.ts`         | New      | Create `injectReducedMotion` function        |
| `packages/browser-web-apis/src/fns/inject-document-title.ts`         | New      | Create `injectDocumentTitle` function        |
| `packages/browser-web-apis/src/fns/inject-mouse-position.ts`         | New      | Create `injectMousePosition` function        |
| `packages/browser-web-apis/src/fns/inject-window-scroll.ts`          | New      | Create `injectWindowScroll` function         |
| `packages/browser-web-apis/src/fns/inject-permission-state.ts`       | New      | Create `injectPermissionState` function      |
| `packages/browser-web-apis/src/fns/*.spec.ts`                        | New      | Create Vitest test files for each function   |

## Risks

| Risk                             | Likelihood | Mitigation                                                                     |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| SSR Hydration Mismatch           | Medium     | Return safe fallback values on server and document client-only execution.      |
| Permission API throws on Firefox | Low        | Wrap query in try/catch and fallback gracefully.                               |
| Memory leaks on listener events  | Low        | Ensure all window/media query listeners unregister via `DestroyRef.onDestroy`. |

## Rollback Plan

Revert changes made to `public-api.ts` and delete the newly created files in `packages/browser-web-apis/src/fns/`.

## Dependencies

- `@angular/core` and `@angular/common` (v18.x+)
- Native modern browser APIs (`window.matchMedia`, `window.addEventListener`, `navigator.permissions`)

## Success Criteria

- [ ] All 8 wrappers throw an error when executed outside of an Angular injection context.
- [ ] Media query and event listeners are properly disposed of on destroy.
- [ ] Vitest unit tests achieve 100% code coverage for all new files.
