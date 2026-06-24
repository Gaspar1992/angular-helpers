## Exploration: openlayers-improvements

### Current State

1. **Geodesic Math for Military Geometry Helpers:**
   - The geometry generation helpers (`createEllipse`, `createSector`, and `createDonut`) in `packages/openlayers/core/src/services/geometry.service.ts` have already been refactored to use `offset` from `ol/sphere` for great-circle geodesic math.
   - **createEllipse**: Employs the spherical ellipse polar equation to compute geodesic distances ($\rho \cdot R$) and initial bearings from the center, generating a fully densified boundary ring.
   - **createDonut**: Computes outer and inner rings using geodesic offsets at 64 segments.
   - **createSector**: Computes the curved arc using geodesic offsets, but the radial straight edges (from the center to the start of the arc, and from the end of the arc back to the center) are not densified. When rendering large strategic sectors (e.g. radius > 100km) on standard projections like Web Mercator (EPSG:3857), these straight edges will appear as straight lines in the projection space, deviating from the true great-circle geodesic paths on the globe.

2. **Declarative Hover Selection:**
   - The `OlSelectInteractionComponent` (in [select-interaction.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/interactions/src/features/select-interaction.component.ts)) exposes a `condition` input that supports `'click' | 'pointerMove'`.
   - When `condition === 'pointerMove'`, the underlying [SelectInteractionService](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/interactions/src/services/select-interaction.service.ts) correctly configures an OpenLayers `Select` interaction with the `pointerMove` condition.
   - When a feature is hovered on the map:
     - `SelectInteractionService` updates the `InteractionStateService` hovered feature signal (`setHoveredFeature`).
     - However, this is done outside the Angular zone, and it does **not** emit to the `selectSubject` (which feeds `select$`).
     - Consequently, the component's `selectEvent` output (which filters `select$`) never fires.
     - The component currently lacks a dedicated `hoverEvent` output, meaning developers cannot bind to hover events in templates (e.g. `(hoverEvent)="showTooltip($event)"`).

### Affected Areas

- [packages/openlayers/core/src/services/geometry.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/core/src/services/geometry.service.ts)
- [packages/openlayers/core/src/services/geometry.service.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/core/src/services/geometry.service.spec.ts)
- [packages/openlayers/interactions/src/features/select-interaction.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/interactions/src/features/select-interaction.component.ts)
- [packages/openlayers/interactions/src/services/interaction-state.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/interactions/src/services/interaction-state.service.ts)
- [packages/openlayers/interactions/src/services/select-interaction.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/interactions/src/services/select-interaction.service.ts)
- [packages/openlayers/interactions/src/models/interaction.types.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/interactions/src/models/interaction.types.ts)
- Unit test files for interactions:
  - `packages/openlayers/interactions/src/services/select-interaction.service.spec.ts` (if/when created/updated)

### Approaches

#### 1. Geodesic Sector Radial Lines

- **Approach A (Keep Current):** Keep the radial straight lines from the center to the start and end of the sector's arc undensified.
  - _Pros:_ Simpler, lower vertex count.
  - _Cons:_ Visual distortion at strategic scales (lines do not follow geodesic curvature on flat projections).
- **Approach B (Radial Densification):** Densify the radial lines by sampling points along the start and end bearings at incremental steps of the radius (e.g., 5-10 intermediate vertices per radial line).
  - _Pros:_ Fully geodesic-correct sector polygon, accurate visual representations at large strategic scales.
  - _Cons:_ Slightly higher vertex count, but negligible for vector rendering.

#### 2. Declarative Hover Selection

- **Approach A (Dedicated Hover Event - RECOMMENDED):** Add a `hoverEvent = output<Feature | null>()` to the `OlSelectInteractionComponent` and support it by introducing a `hover$` event stream in `InteractionStateService` that is triggered inside the Angular zone.
  - _Pros:_ Clean separation of concerns between hover (pointerMove) and selection (click). Allows listening to hover events declaratively: `(hoverEvent)="onHover($event)"`.
  - _Cons:_ Requires adding a new output and event stream.
- **Approach B (Reusing selectEvent):** Reuse the existing `selectEvent` even when the interaction condition is `'pointerMove'`.
  - _Pros:_ Reuses existing component outputs.
  - _Cons:_ Confusing API semantics. A "hovered" feature is not "selected" in the traditional map selection state, and combining them makes it difficult to have concurrent click-to-select and hover-to-tooltip behaviors on the same layers.
- **Approach C (Signal Only):** Only expose a read-only `hoveredFeature` signal from the service or component without template output events.
  - _Pros:_ Idiomatic for state polling.
  - _Cons:_ Poor developer experience for responding to hover transitions, calculating screen offsets for tooltips, or integrating with legacy event-driven components.

### Recommendation

- **Geodesic Math:** Implement **Approach B (Radial Densification)** for `createSector`. Since the ellipse and donut are already fully closed, densified rings, only the sector's straight radial edges need to be curved geodesically to ensure high-fidelity strategic-scale rendering.
- **Hover Selection:** Implement **Approach A (Dedicated Hover Event)**. Expose a `hoverEvent` output on `OlSelectInteractionComponent`, backed by a new event stream in `InteractionStateService` and `OlInteractionService`. Ensure that hover events are emitted inside the Angular zone to guarantee timely UI updates and tooltip rendering.

### Risks

- **Change Detection Overload:** High frequency of hover events (`pointerMove`) can trigger excessive Angular change detection runs if not handled carefully.
  - _Mitigation:_ In the service, only trigger the hovered change and run inside the Angular zone if the hovered feature ID actually changes (avoiding redudant ticks when moving the mouse within the same feature).
- **Vertex Density in Sectors:** Radial densification should use a sensible step count (e.g., dynamically based on radius or a simple static count like 8-16 steps) to prevent rendering overhead.

### Ready for Proposal

Yes
