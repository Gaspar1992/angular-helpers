# Task Breakdown: Angular Versioning Strategy

## Phase 1: Foundation & Reactive State

- [x] Create `DocsVersionService` at `[docs-version.service.ts](file:///home/gasparrv92/.gemini/antigravity/worktrees/angular-helpers/angular-versioning-strategy-docs/src/app/docs/services/docs-version.service.ts)` managing active version signal ('v21' | 'v22') synchronized with `?v=21|22`.
- [x] Write unit tests for the service at `[docs-version.service.spec.ts](file:///home/gasparrv92/.gemini/antigravity/worktrees/angular-helpers/angular-versioning-strategy-docs/src/app/docs/services/docs-version.service.spec.ts)`.
- [x] Synchronize routing query params in `DocsLayoutComponent` at `[docs-layout.component.ts](file:///home/gasparrv92/.gemini/antigravity/worktrees/angular-helpers/angular-versioning-strategy-docs/src/app/docs/layout/docs-layout.component.ts)` to initialize and update the service state.

## Phase 2: Accessible UI Dropdown

- [x] Implement standalone `VersionDropdownComponent` at `[version-dropdown.component.ts](file:///home/gasparrv92/.gemini/antigravity/worktrees/angular-helpers/angular-versioning-strategy-docs/src/app/docs/shared/version-dropdown.component.ts)` following ARIA listbox/combobox patterns with full keyboard navigation and premium glassmorphism styling.
- [x] Add the dropdown component to `DocsLayoutComponent` topbar layout.
- [x] Write accessibility and functional unit tests at `[version-dropdown.component.spec.ts](file:///home/gasparrv92/.gemini/antigravity/worktrees/angular-helpers/angular-versioning-strategy-docs/src/app/docs/shared/version-dropdown.component.spec.ts)`.

## Phase 3: Versioned Data & Dynamic Resolvers

- [x] Create folder structure under `src/app/docs/data/v21/` and `src/app/docs/data/v22/` and place corresponding versioned data files.
- [x] Refactor `overview.resolver.ts` and `service-detail.resolver.ts` under `src/app/docs/services/` to dynamically load versioned content files using `DocsVersionService`.
- [x] Refactor `docs-nav.data.ts` under `[docs-nav.data.ts](file:///home/gasparrv92/.gemini/antigravity/worktrees/angular-helpers/angular-versioning-strategy-docs/src/app/docs/config/docs-nav.data.ts)` to dynamically resolve navigation options based on the active version.

## Review Workload Forecast

- Decision needed before apply: No
- Chained PRs recommended: No
- Chain strategy: stacked-to-main
- 400-line budget risk: Low
