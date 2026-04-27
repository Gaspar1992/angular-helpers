# Spec: OpenLayers Overlays — Popup Component + Tooltip Directive

**Linked proposal**: `.sdd/proposal-openlayers-overlays.md`
**Target package**: `@angular-helpers/openlayers@0.3.0`
**Branch**: `feat/openlayers-overlays`

---

## Functional Requirements

### FR-1 — `OlPopupComponent` with content projection

The `<ol-popup>` component **MUST**:

| Input         | Type                  | Default           | Description                                                                        |
| ------------- | --------------------- | ----------------- | ---------------------------------------------------------------------------------- |
| `position`    | `Coordinate \| null`  | `null`            | Map coordinate (lon/lat in the map's projection); when `null`, the popup is hidden |
| `offset`      | `[number, number]`    | `[0, 0]`          | Pixel offset relative to `position`                                                |
| `positioning` | `OverlayPositioning`  | `'bottom-center'` | Anchor of the overlay element relative to `position`                               |
| `autoPan`     | `boolean`             | `false`           | Whether the map auto-pans to keep the popup in view                                |
| `closeButton` | `boolean`             | `false`           | Whether to render a default close button                                           |
| `id`          | `string \| undefined` | auto-generated    | Stable id for the underlying overlay (debugging / a11y)                            |

| Output   | Type   | Description                                                                            |
| -------- | ------ | -------------------------------------------------------------------------------------- |
| `closed` | `void` | Emitted when the popup is hidden via the close button or `position` set back to `null` |

**MUST**:

- Use `input()` / `output()` functions, `ChangeDetectionStrategy.OnPush`, `standalone: true` is implicit (Angular v20+ default).
- Project consumer content via `<ng-content>` inside the host element.
- Create exactly one `ol/Overlay` whose `element` is the component's host element.
- Run all OL operations (`new Overlay`, `setPosition`, `setOffset`, `map.addOverlay`, `map.removeOverlay`) inside `OlZoneHelper.runOutsideAngular`.
- Run `closed` emissions through `OlZoneHelper.runInsideAngular`.
- Clean up the overlay in a `DestroyRef` callback.

**Acceptance**:

- Given `<ol-popup [position]="[2.17, 41.38]">Hello</ol-popup>` inside `<ol-map>`
- When the map is ready
- Then an `ol/Overlay` is registered with `position = [lon, lat]` (transformed if needed) and `element = host`
- And the projected text "Hello" is visible at that map coordinate

- Given `position` is set to `null`
- When the change is applied
- Then the overlay is removed from the map (or has its position cleared)
- And the `closed` output emits exactly once per transition from non-null → null

### FR-2 — `OlTooltipDirective`

The `[olTooltip]` directive **MUST**:

- Have selector `[olTooltip]`.
- Accept `olTooltip: string` — the property key on `feature.getProperties()` to display.
- Listen to `pointermove` events on the OL map (subscribed via `OlMapService.onReady`).
- Use `map.forEachFeatureAtPixel` filtered to the layer it is attached to (located via `OlLayerService.getLayer(hostLayerId)`).
- Render a single floating `<div>` element appended to the map's viewport containing `feature.get(propKey)`.
- Hide the tooltip when no feature is hovered.
- Run pointer handlers inside `runOutsideAngular`; only DOM text update happens (no signal writes required).
- Clean up listeners and the floating element on directive destroy.

**Acceptance**:

- Given `<ol-vector-layer id="cities" [features]="cities()" [olTooltip]="'name'">`
- When the user hovers over a city feature with `properties.name = 'Madrid'`
- Then a floating element with text "Madrid" appears near the cursor
- And it disappears when the cursor leaves the feature

### FR-3 — `OlPopupService.open()` (string / HTMLElement)

`OlPopupService` **MUST** expose `open(options): PopupHandle` where:

```ts
interface PopupOpenOptions {
  id?: string; // generated if absent
  position: Coordinate;
  content: string | HTMLElement; // string is treated as trusted text via textContent
  positioning?: OverlayPositioning; // default 'bottom-center'
  offset?: [number, number]; // default [0, 0]
  autoPan?: boolean; // default false
  className?: string; // optional CSS class on the overlay element
}

interface PopupHandle {
  readonly id: string;
  close(): void;
}
```

**MUST**:

- Be idempotent by id: calling `open` twice with the same id updates the overlay's `position` and `content` instead of creating a duplicate.
- Queue calls when `OlMapService.getMap()` is `null`, flushing on `onReady`.
- Track all open popups in an internal `Map<string, ManagedPopup>`.

**Acceptance**:

- Given `popups.open({ id: 'p', position: [0, 0], content: 'hi' })` is called twice
- Then only one `ol/Overlay` exists for id `'p'`
- And the second call updates its `position` / `content`

### FR-4 — `OlPopupService.openComponent()` (Angular component)

`OlPopupService` **MUST** expose `openComponent<C>(options): PopupHandle` where:

```ts
interface PopupComponentOptions<C> {
  id?: string;
  position: Coordinate;
  component: Type<C>;
  bindings?: Binding[]; // inputBinding / outputBinding / twoWayBinding
  directives?: Array<Type<unknown> | { type: Type<unknown>; bindings?: Binding[] }>;
  injector?: Injector; // optional element injector
  positioning?: OverlayPositioning;
  offset?: [number, number];
  autoPan?: boolean;
  className?: string;
}
```

**MUST**:

- Internally call `createComponent(component, { environmentInjector, hostElement, bindings, directives })` with an injected `EnvironmentInjector`.
- Call `appRef.attachView(componentRef.hostView)` so CD ticks reach the dynamic component.
- Use the freshly-created `hostElement` as the `ol/Overlay` element.
- On close (or service destroy), call `appRef.detachView` then `componentRef.destroy()` to release the view.
- Be idempotent by id: a second call with the same id destroys the previous `ComponentRef`, then creates a new one.

**Acceptance**:

- Given `popups.openComponent({ id: 'c', position: [0, 0], component: CityCard, bindings: [inputBinding('city', () => city())] })`
- When `city()` updates
- Then the rendered `CityCard` reflects the new value (CD propagates)

- Given the popup is closed (`handle.close()` or `popups.closeAll()`)
- Then `componentRef.destroy()` is invoked exactly once
- And `appRef.detachView(componentRef.hostView)` is invoked exactly once
- And the OL overlay is removed from the map

### FR-5 — Cleanup on service destroy

When `OlPopupService` is destroyed (`DestroyRef`), it **MUST**:

- Iterate every managed popup and run the same cleanup as `close(id)`.
- Empty its internal map.

**Acceptance**:

- Given two open popups (one string, one component)
- When the providing injector is destroyed
- Then both `componentRef.destroy()` (for the component popup) and `map.removeOverlay()` (for both) are called

### FR-6 — Demo wiring

The `/demo/openlayers` page **MUST**:

- Show a popup using `<ol-popup>` triggered by clicking a city via the existing Select interaction (declarative path).
- Show a second popup opened via `OlPopupService.openComponent()` triggered from a toolbar button (programmatic path), rendering a small Angular `CityCard`-style component bound to a signal.
- Both popups close cleanly when their `position` is reset / their handle is closed.

### FR-7 — Tests

| Target                         | Style        | Coverage goal               |
| ------------------------------ | ------------ | --------------------------- |
| `OlPopupService.open`          | Vitest unit  | >90% stmts                  |
| `OlPopupService.openComponent` | Vitest unit  | >90% stmts; asserts destroy |
| `OlPopupComponent`             | Vitest smoke | renders + position update   |
| `OlTooltipDirective`           | Vitest smoke | constructs without error    |

Tests **MUST** follow the same patterns established in PR #106:

- Stubbed `OlMapService` exposing `getMap`, `onReady`.
- Pass-through `OlZoneHelper`.
- Direct `new Service()` with `runInInjectionContext` when needed.

### FR-8 — Documentation

- `packages/openlayers/README.md` and `README.es.md` **MUST** include an "Overlays" section documenting:
  - `<ol-popup>` declarative usage with content projection
  - `OlPopupService.open()` (string + HTMLElement)
  - `OlPopupService.openComponent()` with `inputBinding` / `outputBinding`
  - `[olTooltip]` directive
- A new `public/content/blog/openlayers-overlays.md` post **MUST** be created and registered in `src/app/blog/config/posts.data.ts`.

---

## Non-Functional Requirements

### NFR-1 — Bundle size

- Reuse `ol/Overlay` from the existing OL peer dep — no new runtime dependencies.
- Do **NOT** import from the `ol/source` barrel (lesson from PR #106). Use deep imports if any new `ol/*` modules are needed.

### NFR-2 — Zoneless compatibility

- All OL DOM operations stay outside Angular's zone via `OlZoneHelper.runOutsideAngular`.
- No `NgZone.run()` direct calls.

### NFR-3 — Accessibility

- Default close button **MUST** have `type="button"` and `aria-label="Close"`.
- Tooltip element **MUST** have `role="tooltip"`.
- Color contrast for default tooltip text **MUST** meet WCAG AA when used over the demo's map background.

### NFR-4 — Lint / format

- `npm run lint && npm run format:check` **MUST** pass with zero new errors.

### NFR-5 — Build

- `npm run build` (ng-packagr) for `@angular-helpers/openlayers` **MUST** succeed and produce the `overlays` secondary entry point.

---

## Scenarios

### S-1 — Declarative popup bound to selection

1. Consumer template:
   ```html
   <ol-map>
     <ol-tile-layer id="osm" source="osm" />
     <ol-vector-layer id="cities" [features]="cities()" />
     <ol-popup
       [position]="selectedCoord()"
       [closeButton]="true"
       [autoPan]="true"
       (closed)="clearSelection()"
     >
       <h3>{{ selected()?.name }}</h3>
       <p>{{ selected()?.description }}</p>
     </ol-popup>
   </ol-map>
   ```
2. User clicks a city → Select interaction updates `selectedCoord` and `selected` signals.
3. Popup appears at the city, projects the latest signal values, auto-pans into view.
4. User clicks the close button → `closed` emits → consumer clears selection → popup disappears.

### S-2 — Programmatic component popup from a toolbar button

1. Consumer has a `CityCardComponent` with `city = input.required<City>()` and `close = output()`.
2. On button click:
   ```ts
   const handle = popups.openComponent({
     id: 'random-city',
     position: randomCity.coord,
     component: CityCardComponent,
     bindings: [
       inputBinding('city', () => randomCity),
       outputBinding('close', () => handle.close()),
     ],
     autoPan: true,
   });
   ```
3. The `CityCardComponent` renders inside the OL overlay; CD reaches it via `appRef.attachView`.
4. On `close`, the handle's `close()` destroys the `ComponentRef` and removes the overlay.

### S-3 — Tooltip on hover

1. Template: `<ol-vector-layer id="cities" [features]="cities()" [olTooltip]="'name'">`.
2. User moves the cursor over a feature with `properties.name = 'Barcelona'`.
3. A `<div role="tooltip">Barcelona</div>` floats near the cursor.
4. User moves off the feature → tooltip hides.

### S-4 — Service queueing before map is ready

1. Consumer calls `popups.open({...})` during component construction (before the map is attached).
2. The service queues the call.
3. When `OlMapService` reports ready, the queued popups flush in order.

---

## Acceptance Criteria Summary

| ID   | Description                                                             | Verification                                            |
| ---- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| AC-1 | `npm run build` succeeds for `@angular-helpers/openlayers`              | Build pipeline                                          |
| AC-2 | All Vitest tests pass; service coverage >90% stmts                      | `cd packages/openlayers && npm run test:coverage --run` |
| AC-3 | `/demo/openlayers` shows declarative + programmatic popups              | Manual + Playwright smoke                               |
| AC-4 | Tooltip appears on hovering a vector feature in the demo                | Manual                                                  |
| AC-5 | `npm run lint && npm run format:check` clean                            | CI                                                      |
| AC-6 | README.md, README.es.md and blog post published                         | Review                                                  |
| AC-7 | Package version bumped to `0.3.0` in `packages/openlayers/package.json` | Review                                                  |

---

## Technical Constraints

- **Angular**: standalone components, signals (`input`, `output`, `model`), `OnPush`, `DestroyRef`, `inject()`, `createComponent + hostElement` API, `inputBinding` / `outputBinding`.
- **OpenLayers**: 10.x peer dependency.
- **Vitest**: jsdom environment; reuse the existing `vitest.config.ts` aliases.
- **No new runtime deps**.

---

## Edge Cases

1. **`open()` called before map is ready** → queued, flushed on `onReady`.
2. **`openComponent()` called with the same id twice in quick succession** → first `ComponentRef` is destroyed before the new one is created (no leak).
3. **`closeAll()` called when there are no popups** → no-op, does not throw.
4. **Component popup destroyed while a binding signal still holds a reference** → safe; signals do not retain destroyed views, but we still call `appRef.detachView` to ensure CD does not visit the dead view.
5. **Tooltip hover over a feature that lacks the requested property** → tooltip hides (does not display `'undefined'`).
6. **Map element not yet sized when `autoPan` runs** → fallback is OL's own behaviour; no extra logic.
7. **Two `<ol-popup>` instances with the same `id` input** → the service treats them as the same overlay; documented as undefined behaviour, recommend unique ids or omit `id`.

---

## Out of Scope (deferred)

- Popup show/hide animations.
- Multi-popup z-stack management.
- `ngComponentOutlet` integration helpers (consumers can still use it inside `<ol-popup>`).
- Tooltip render functions (only property keys in v0.3.0).
- Components as content for `OlPopupService.open()` (use `openComponent()` instead).
