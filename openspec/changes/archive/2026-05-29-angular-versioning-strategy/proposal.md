# Change Proposal: Angular Versioning Strategy

## Intent

Establish a robust, accessible, and reactive versioning strategy for Angular documentation. Support legacy v21 documentation via a dedicated support branch, while allowing the `main` branch (v22) to dynamically resolve and present both v21 and v22 versioned content using Angular Signals.

## Scope

- Branching: Maintain a dedicated `support/v21` branch for patch freezes and bug fixes.
- State: Synchronize the active version (`v21` | `v22`) using query parameters (`?v=21`).
- Navigation: Render dynamic menus and dynamic content resolutions based on the version signal.
- Accessibility: Provide a fully WCAG AA compliant dropdown.

## Capabilities

| Capability                    | Type     | Description                                                                                                    |
| :---------------------------- | :------- | :------------------------------------------------------------------------------------------------------------- |
| **docs-versioning**           | New      | `DocsVersionService` to manage active version state via dynamic Signal synced with query params.               |
| **version-selector-dropdown** | New      | Keyboard-accessible and screen-reader friendly `VersionDropdownComponent` in main navigation.                  |
| **docs-navigation**           | Modified | Navigation array (`docs-nav.data.ts`) dynamically resolves options based on active version.                    |
| **docs-resolvers**            | Modified | Resolver (`overview.resolver.ts`) fetches either `core.v21.data.ts` or `core.data.ts` based on version signal. |

## Approach

1. **State Synchronization**: Create a global `DocsVersionService` utilizing a reactive Signal derived from router query parameters.
2. **Accessible Layout**: Build standalone `VersionDropdownComponent` using standard ARIA patterns (`role="listbox"`, `aria-expanded`, keyboard arrows).
3. **Reactive Data Fetching**:
   - Refactor `overview.resolver.ts` to switch-map the active version signal and load corresponding core data files.
   - Adapt layout navigation to render version-specific nodes.

## Affected Areas

- `src/app/core/services/docs-version.service.ts` _(New)_
- `src/app/shared/components/version-dropdown/version-dropdown.component.ts` _(New)_
- `src/app/core/resolvers/overview.resolver.ts` _(Modified)_
- `src/app/core/data/docs-nav.data.ts` _(Modified)_

## Risks & Mitigations

- **Risk**: Query parameter lag causes flickering on route transitions.  
  _Mitigation_: Pre-fetch and resolve version state within the resolver before component instantiation.

## Rollback Plan

Revert commit changes back to standard static imports of `core.data.ts` in resolvers and navigation configuration. Remove `DocsVersionService` and selector dropdown from layout shell.

## Success Criteria

- [ ] Toggling the version dropdown updates query parameter `?v=21` and reactively updates all main/sidebar contents.
- [ ] Dropdown passes all AXE accessibility checks (supports keyboard navigation, focus indicators, correct ARIA attributes).
- [ ] Fallback logic correctly defaults to `v22` when no parameter is present.
