# Proposal: OpenLayers Overlays — Popup Component + Tooltip Directive

**Branch**: `feat/openlayers-overlays`
**Target**: `@angular-helpers/openlayers@0.3.0`
**Parent SDD**: `.sdd/proposal-openlayers-phase2.md` (Phase 2 — overlays slice, FR-7 + FR-8)
**Depends on**: v0.2.0 (interactions SRP, merged in PR #104) and PR #106 (test baseline, merged)

---

## Problem

The `overlays` entry point ships in v0.2.0 as a stub:

- `OlPopupService` is a no-op skeleton (`showPopup` returns `'popup-id'`, `hidePopup` is empty).
- There is no `OlPopupComponent`, so consumers cannot project arbitrary Angular content into a map popup.
- There is no `OlTooltipDirective`, so vector layers cannot show hover tooltips for feature properties.
- Phase 2 spec items **FR-7** (popup with content projection) and **FR-8** (tooltip directive) are unfulfilled.

Without these, the `interactions` entry point is not really useful in product UX — selecting a feature has no idiomatic way to display info bound to that feature, and consumers fall back to building their own DOM positioned over the canvas.

---

## Objective

Make the `overlays` entry point **feature-complete for the Phase 2 MVP**:

1. A standalone `<ol-popup>` component that:
   - Projects arbitrary Angular content via `<ng-content>` (consumers can place any template / child component inside).
   - Reactively positions itself when its `position` input changes.
   - Cleans up its `ol/Overlay` on destroy.
   - Optionally shows a close button and supports auto-pan.
2. A `[olTooltip]` directive applicable on a vector layer component to show a hover tooltip from a feature property.
3. A real `OlPopupService` that exposes a programmatic API parallel to `OlLayerService` (open/close by id) for non-template use cases. Supports three content modes:
   - `string` (trusted text)
   - `HTMLElement` (raw DOM node)
   - **Angular component** via `createComponent + hostElement` (Angular 16.2+ pattern documented in [angular.dev/guide/components/programmatic-rendering](https://angular.dev/guide/components/programmatic-rendering#popup-attached-to-documentbody-with-createcomponent--hostelement)) with `inputBinding` / `outputBinding` / `twoWayBinding` support.
4. Demo wiring: combine with the existing `Select` interaction to display a popup on the selected city using BOTH paths (declarative `<ol-popup>` + programmatic `OlPopupService.openComponent`).
5. Tests, docs, blog post.

---

## Scope

### Included

| Area                                         | Work                                                                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `overlays/src/features/popup.component.ts`   | New `OlPopupComponent` (standalone, OnPush, content projection)                                                                                               |
| `overlays/src/features/tooltip.directive.ts` | New `OlTooltipDirective` (selector `[olTooltip]`)                                                                                                             |
| `overlays/src/services/popup.service.ts`     | Real implementation: open/close by id, integration with `OlMapService.onReady`, `ol/Overlay` lifecycle, plus `openComponent()` for dynamic Angular components |
| `overlays/src/models/overlay.types.ts`       | Extend with `PopupHandle`, `PopupContent`, `PopupComponentSpec`, `OverlayPositioning` aligned to OpenLayers values                                            |
| `overlays/src/config/providers.ts`           | Keep `withOverlays()` as the registration entrypoint; ensure `OlMapService` is required at runtime                                                            |
| `overlays/src/index.ts`                      | Public exports for component, directive, service, helpers                                                                                                     |
| Demo                                         | Use overlays in `src/app/demo/openlayers/openlayers-demo.component.ts` together with the existing Select interaction                                          |
| Tests                                        | Vitest unit tests for `OlPopupService` (>90% stmts) and `OlPopupComponent` lifecycle (smoke + position update). Directive: smoke test                         |
| Docs                                         | Update `packages/openlayers/README.md` and `README.es.md` with overlays section + examples                                                                    |
| Blog                                         | New `public/content/blog/openlayers-overlays.md` (English) registered in `posts.data.ts`                                                                      |
| Versioning                                   | Bump `@angular-helpers/openlayers` to `0.3.0` (minor — new public surface)                                                                                    |

### Excluded

- `OlMilitarySymbolComponent` and `milsymbol` integration — separate slice (Phase 2 military).
- Custom DOM-based overlays beyond popup/tooltip (e.g. measurement labels) — Phase 3 if requested.
- Animations/transitions on popup show/hide — basic open/close only in this slice.
- Multiple stacked popups with z-management — single popup per id, additive but no z-controls.

---

## Approach

### Component API

```html
<ol-popup
  [position]="selected()?.coordinate ?? null"
  [offset]="[0, -12]"
  positioning="bottom-center"
  [autoPan]="true"
  [closeButton]="true"
  (closed)="clearSelection()"
>
  <h3>{{ selected()?.name }}</h3>
  <p>{{ selected()?.description }}</p>
</ol-popup>
```

- Inputs: `position: Coordinate | null`, `offset: [number, number]`, `positioning: OverlayPositioning`, `autoPan: boolean`, `closeButton: boolean`, `id?: string` (optional, defaults to a generated uid).
- Outputs: `closed` (emitted on user-clicked close button or programmatic hide).
- Internally creates an `ol/Overlay` whose `element` is the projected content host (a div in the component template). When `position` is `null`, the overlay is hidden by removing it from the map (or setting `position` to `undefined`).

### Directive API

```html
<ol-vector-layer id="cities" [features]="cities()" [olTooltip]="'name'"> </ol-vector-layer>
```

- Selector: `[olTooltip]`.
- Input: `olTooltip: string` — the feature property key to display.
- Implementation: subscribes to `pointermove` on the map (via `OlMapService.onReady`), uses `map.forEachFeatureAtPixel` filtered to the host layer (located via the layer component's id), and renders a small floating element whose text is `feature.get(propKey)`.
- Cleans up on directive destroy.

### Service API

Three content modes:

```typescript
const popups = inject(OlPopupService);

// 1) String / HTMLElement
const h1 = popups.open({
  id: 'simple',
  position: [2.17, 41.38],
  content: someHtmlElement, // or a trusted string
  positioning: 'bottom-center',
  offset: [0, -12],
  autoPan: true,
});

// 2) Angular component (dynamic) — uses createComponent + hostElement under the hood
const h2 = popups.openComponent({
  id: 'city-popup',
  position: [2.17, 41.38],
  component: CityCardComponent,
  bindings: [inputBinding('city', () => selected()), outputBinding('close', () => h2.close())],
  // optional: injector, environmentInjector, directives
});

h1.close();
popups.closeAll();
```

- `open(options): PopupHandle` — registers an `ol/Overlay` from `string | HTMLElement`. Idempotent by id (same id → updates position/content).
- `openComponent<C>(options): PopupHandle` — instantiates the given component via `createComponent({ environmentInjector, hostElement, bindings, directives })`, attaches the host view to `ApplicationRef`, and uses the host element as the overlay element.
- `close(id)` / `closeAll()` — destroys both the OL overlay AND the dynamically-created `ComponentRef` (`appRef.detachView` + `ref.destroy`) to prevent leaks.
- Queues open requests if the map is not yet ready (mirrors `OlLayerService` pattern).
- The `<ol-popup>` component delegates `open()` (string / HTMLElement path) to this service to avoid duplicating overlay management code; component projection stays inside Angular's tree and does not go through `openComponent()`.

### Lifecycle & Zone safety

- All OL operations (`new Overlay`, `setPosition`, `setElement`, `map.addOverlay`/`removeOverlay`) wrapped in `OlZoneHelper.runOutsideAngular`.
- User-facing emissions (`closed` output, popup close clicks) routed through `runInsideAngular` so signals/CD work in non-zoneless apps.

### Imports policy

- Cross-entry: absolute (`@angular-helpers/openlayers/core`).
- Intra-entry: relative (`./services/`, `../models/`).
- Avoid the `ol/source` barrel pattern — use deep paths if needed (lesson from PR #106).

---

## Risks

| Risk                                                                         | Mitigation                                                                                                                                                                               |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content projection inside an `ol/Overlay` element not picking up Angular CD  | Use the component's host element as the overlay element; project via `<ng-content>`; force the host to live in the DOM (no detach)                                                       |
| Tooltip directive coupling to `OlVectorLayerComponent` internals             | Read the layer id via `host` reference and locate the OL layer via `OlLayerService.getLayer`; no private API                                                                             |
| Memory leaks on repeated open/close                                          | Track overlays in a `Map<string, { overlay: ol/Overlay; componentRef?: ComponentRef<unknown> }>` and dispose in `closeAll`; component cleans up in `DestroyRef` callback                 |
| Forgetting to detach dynamic component views from `ApplicationRef` (CD leak) | Centralize `appRef.attachView` / `appRef.detachView` + `ref.destroy()` in the service close path; cover with a unit test that asserts a closed popup’s `ComponentRef.destroy` was called |
| `autoPan` conflicting with active `Draw`/`Modify`                            | Document the interaction; allow `[autoPan]="false"` to opt out                                                                                                                           |
| Bundle size                                                                  | No new runtime deps; reuses `ol/Overlay` already in OL peer dep                                                                                                                          |

---

## Assumptions

- `@angular-helpers/openlayers/core` exposes `OlMapService` and `OlZoneHelper` (already true in v0.2.0).
- `@angular-helpers/openlayers/layers` exposes `OlLayerService` so the tooltip directive can resolve a vector layer by id (already true in v0.2.0).
- OpenLayers 10.x peer dependency.

---

## Open Questions

1. Should `OlPopupComponent` accept `position` as a signal-style input (`InputSignal<Coordinate | null>`) or both a static value and a writable signal? → **Decision**: signal-friendly via `input<Coordinate | null>(null)`.
2. Should the close button be styled by the library or fully consumer-styled? → **Decision**: minimal default style + a `popup-close` CSS hook class so consumers can override.
3. Tooltip: support a render function instead of a property key? → **Out of scope for v0.3.0**, revisit if asked. Property key is enough for FR-8.
4. Should `OlPopupService` accept Angular component types as content? → **Decision (revised)**: **YES** — expose a dedicated `openComponent()` method using the official Angular `createComponent + hostElement` pattern. Reasons:
   - The pattern is documented and stable since Angular 16.2; it is the recommended approach for popups/overlays.
   - It enables programmatic popups from interaction handlers, services, and effects without needing an `<ol-popup>` in the template.
   - Cost is small (one extra method on the service, ~30 LOC).
   - Cleanup is well-defined and testable.
5. Should `<ol-popup>` itself use `createComponent` internally? → **Decision**: No. The declarative path uses plain content projection — the host element of `<ol-popup>` IS the overlay element, and projected children stay in Angular’s tree. Simpler and zero extra plumbing.

---

## Success Criteria

- [ ] Build passes: `npm run build` in `packages/openlayers`.
- [ ] All Vitest tests pass; `OlPopupService` >90% stmts (covering both `open` and `openComponent` paths, including `ComponentRef.destroy` on close), `OlPopupComponent` smoke tested.
- [ ] Demo `/demo/openlayers` shows a popup on selecting a city via the declarative `<ol-popup>` AND a second popup opened programmatically through `OlPopupService.openComponent()`.
- [ ] `npm run lint && npm run format:check` clean.
- [ ] README.md, README.es.md and blog post published, with examples for the three content modes (string, HTMLElement, Angular component).
- [ ] Version bumped to `0.3.0` and reflected in package metadata.
