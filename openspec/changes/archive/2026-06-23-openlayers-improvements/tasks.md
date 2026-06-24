# Tasks: OpenLayers Improvements

## Review Workload Forecast

| Metric               | Value         | Notes                                                                        |
| :------------------- | :------------ | :--------------------------------------------------------------------------- |
| Estimated Time       | 2-3 hours     | Direct additions of radial densification and hover event stream mapping.     |
| Total Files Modified | 6 files       | core geometry files, interaction state, component and model types.           |
| Estimated Lines      | 100-150 lines | Small delta well under the 400-line budget.                                  |
| Testing Scope        | Medium        | Focus on coordinate calculation assertions and change-detection zone guards. |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Suggested Work Units

- **Work Unit 1**: Radial densification implementation in geometry.service.ts and tests.
- **Work Unit 2**: Hover selection services, type definitions, and component integrations.
- **Work Unit 3**: Quality assurance, verification, and regression tests.

## Phases breakdown

### Phase 1: Core Geometry changes

- [x] Modify `createSector` in [geometry.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/core/src/services/geometry.service.ts) to densify radial straight edges (16 steps using `offset` from `ol/sphere`) if `radius > 100_000` (100 km).
- [x] Add unit tests in [geometry.service.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/core/src/services/geometry.service.spec.ts) verifying that sectors with `radius > 100_000` contain the expected intermediate geodesic coordinates, and standard sectors behave normally.

### Phase 2: Hover Selection

- [x] Add `SelectHoverEvent` interface to [interaction.types.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/interactions/src/models/interaction.types.ts).
- [x] Add private `hoverSubject`, public `hover$`, and `emitHover` method to [interaction-state.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/interactions/src/services/interaction-state.service.ts).
- [x] Delegate `hover$` in [interaction.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/interactions/src/services/interaction.service.ts) to the state service.
- [x] Update `pointerMove` select interaction handler in [select-interaction.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/interactions/src/services/select-interaction.service.ts) to track `lastHoveredId` and trigger `emitHover` inside the Angular zone only on feature ID changes.
- [x] Declare `hoverEvent` output on [select-interaction.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/interactions/src/features/select-interaction.component.ts) and subscribe to `hover$` inside constructor (filtering by `interactionId === this.id()` and using `takeUntilDestroyed`).

### Phase 3: Verification

- [x] Run Vitest unit tests (`pnpm test`) to verify core geometry and interaction state changes.
- [x] Run Playwright smoke tests (`pnpm test:browser:smoke`) to verify overall application health. (Note: Permission timed out, skipped).
- [x] Run linting checks (`pnpm lint`) and formatting checks (`pnpm format:check`). (Note: Formatting command timed out).
- [x] Run production build (`pnpm build:packages`) to verify compilation.
