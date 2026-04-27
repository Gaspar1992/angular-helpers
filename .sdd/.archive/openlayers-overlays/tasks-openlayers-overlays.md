# Tasks: OpenLayers Overlays — Popup Component + Tooltip Directive

**Linked spec**: `.sdd/spec-openlayers-overlays.md`
**Branch**: `feat/openlayers-overlays`

Apply tasks top-to-bottom; each block is independently committable.

---

## 1. Models & types

- [ ] 1.1 Extend `packages/openlayers/overlays/src/models/overlay.types.ts` with:
  - `OverlayPositioning` (string literal union mirroring `ol/Overlay`'s positioning values, e.g. `'bottom-center' | 'top-center' | ...`).
  - `PopupHandle` (interface with `id: string`, `close(): void`).
  - `PopupOpenOptions` (string / HTMLElement content).
  - `PopupComponentOptions<C>` (Angular component content, with `bindings` and optional `directives` / `injector`).
  - Internal `ManagedPopup` interface (overlay + optional `componentRef`).

## 2. Service: `OlPopupService`

- [ ] 2.1 Replace the stub in `packages/openlayers/overlays/src/services/popup.service.ts`:
  - Inject `OlMapService`, `OlZoneHelper`, `EnvironmentInjector`, `ApplicationRef`, `DestroyRef`.
  - Internal `Map<string, ManagedPopup>` and a pending-queue array for calls before the map is ready.
- [ ] 2.2 Implement `open(options): PopupHandle`.
  - Resolve id (use provided or generate `popup-${random}`).
  - If id exists → update overlay's position / element / className; return existing handle.
  - Wrap `new Overlay(...)`, `setPosition`, `map.addOverlay` in `runOutsideAngular`.
  - Convert `string` content to a wrapper `<div>` whose `textContent` is set (no `innerHTML`).
- [ ] 2.3 Implement `openComponent<C>(options): PopupHandle`.
  - Build a host element (`document.createElement('div')`).
  - Call `createComponent(component, { environmentInjector, hostElement, bindings, directives })`.
  - Call `appRef.attachView(ref.hostView)`.
  - Store both `overlay` and `componentRef` in the managed map.
  - Idempotency: if id exists, destroy the previous `ComponentRef` (`detachView` + `destroy`) before creating a new one.
- [ ] 2.4 Implement `close(id)` and `closeAll()` with consistent cleanup:
  - `map.removeOverlay`, `overlay.dispose?.()` (defensive), `appRef.detachView`, `componentRef.destroy()` if present, delete from the map.
  - All inside `runOutsideAngular`.
- [ ] 2.5 Register a `DestroyRef.onDestroy` callback that calls `closeAll()`.
- [ ] 2.6 Queue + flush logic: when `getMap()` is null, push an `(options, kind)` tuple into the pending list; subscribe via `onReady` once and replay in order.

## 3. Component: `OlPopupComponent`

- [ ] 3.1 Create `packages/openlayers/overlays/src/features/popup.component.ts`:
  - Selector `ol-popup`, `OnPush`, inline template with the close button (conditional via `@if`) + `<ng-content />`.
  - Inputs: `position`, `offset`, `positioning`, `autoPan`, `closeButton`, `id` (all via `input()`).
  - Output: `closed` (via `output<void>()`).
  - Inject `OlMapService`, `OlZoneHelper`, `ElementRef`, `DestroyRef`.
- [ ] 3.2 In `effect()` or via `afterNextRender`: when `position()` becomes non-null and the map is ready, register an `ol/Overlay` with `element = elementRef.nativeElement`. When `position()` is null, remove it and emit `closed` (only on transitions).
- [ ] 3.3 Update `setOffset` / `setPositioning` reactively when their signals change.
- [ ] 3.4 Default close button: a `<button type="button" aria-label="Close" class="popup-close">×</button>` styled minimally; clicking emits `closed` and the component sets internal "hidden" state.
- [ ] 3.5 Cleanup overlay in `DestroyRef.onDestroy`.

## 4. Directive: `OlTooltipDirective`

- [ ] 4.1 Create `packages/openlayers/overlays/src/features/tooltip.directive.ts`:
  - Selector `[olTooltip]`.
  - Input: `olTooltip = input.required<string>()`.
  - Inject `OlMapService`, `OlZoneHelper`, `OlLayerService` (from `@angular-helpers/openlayers/layers`), `ElementRef`, `DestroyRef`.
- [ ] 4.2 In `afterNextRender` (or `OlMapService.onReady`):
  - Read the host layer id (from the host element / its directive context).
  - Create a floating `<div role="tooltip">` appended to `map.getViewport()`.
  - Subscribe to `pointermove` on the map; for each event, call `forEachFeatureAtPixel` filtered to the host vector layer; update text and position; hide if no feature.
- [ ] 4.3 Run pointer logic outside Angular zone; only use signals if needed.
- [ ] 4.4 Cleanup listeners and the floating element on destroy.

## 5. Public exports & providers

- [ ] 5.1 Update `packages/openlayers/overlays/src/index.ts`:
  - Export `OlPopupService`, `OlPopupComponent`, `OlTooltipDirective`.
  - Export `withOverlays`, `provideOverlays`.
  - Export public types from `models/overlay.types.ts`.
- [ ] 5.2 Confirm `withOverlays()` provides `OlPopupService` (already does in v0.2.0; keep as-is).

## 6. Tests (Vitest)

- [ ] 6.1 `popup.service.spec.ts`:
  - `open` creates and tracks a single overlay; idempotent by id.
  - `open` queues when the map is not ready and flushes on ready.
  - `openComponent` creates a `ComponentRef`, calls `appRef.attachView`, sets the overlay element to the host element.
  - `close` and `closeAll` destroy any `ComponentRef` and remove the overlay.
  - Service `DestroyRef.onDestroy` triggers `closeAll`.
  - Use stubbed `ApplicationRef` (`attachView` / `detachView` spies) and `EnvironmentInjector` (real `Injector.create`).
  - Use mocked `OlMapService` (`getMap`, `onReady` with manual flush) and pass-through `OlZoneHelper`.
  - Goal: >90% statements.
- [ ] 6.2 `popup.component.spec.ts`:
  - Smoke: component compiles and renders projected text in a TestBed harness.
  - Position update: setting `position` triggers an overlay update (verified via spies on the injected service stub).
  - `closed` emits when `position` transitions non-null → null.
- [ ] 6.3 `tooltip.directive.spec.ts`:
  - Smoke: directive constructs and registers / cleans up listeners (spy on `map.on('pointermove')` / `un`).

## 7. Demo wiring

- [ ] 7.1 Update `src/app/demo/openlayers/openlayers-demo.component.ts`:
  - Import `OlPopupComponent`, `OlTooltipDirective`, `OlPopupService`.
  - Add a `<ol-popup>` bound to a `selectedCoord()` signal that is set from the existing Select interaction handler.
  - Add a toolbar button "Open random city popup" that calls `popups.openComponent({ component: DemoCityCardComponent, ... })` with `inputBinding`.
  - Tooltip: add `[olTooltip]="'name'"` on the cities vector layer.
- [ ] 7.2 Create a small `DemoCityCardComponent` inside the demo folder for the programmatic popup.

## 8. Documentation

- [ ] 8.1 `packages/openlayers/README.md`: add an "Overlays" section with the three popup modes (string, HTMLElement, Angular component) and the tooltip directive.
- [ ] 8.2 `packages/openlayers/README.es.md`: same in Spanish (rioplatense tone).
- [ ] 8.3 `public/content/blog/openlayers-overlays.md`: blog post (English) covering the WHY, the design tradeoffs (declarative vs programmatic), the `createComponent + hostElement` choice, and examples for each mode.
- [ ] 8.4 Register the post in `src/app/blog/config/posts.data.ts`.

## 9. Versioning

- [ ] 9.1 Bump `packages/openlayers/package.json` to `0.3.0`.
- [ ] 9.2 No CHANGELOG entry needed (managed by semantic-release on the main branch).

## 10. Verification (pre-PR)

- [ ] 10.1 `cd packages/openlayers && npm test -- --run` → all green.
- [ ] 10.2 `cd packages/openlayers && npm run test:coverage -- --run` → service ≥ 90% stmts.
- [ ] 10.3 `cd packages/openlayers && npm run build` → succeeds.
- [ ] 10.4 `npm run format` (apply) and `npm run format:check` → clean.
- [ ] 10.5 `npm run lint` → no new errors.
- [ ] 10.6 Smoke-run the demo (`npm run start`) and visit `/demo/openlayers`:
  - Click a city → declarative popup appears with content.
  - Click toolbar button → programmatic component popup appears.
  - Hover features → tooltip works.
- [ ] 10.7 Open PR `feat/openlayers-overlays` → `main` referencing the SDD files and the spec acceptance criteria.

---

## Notes / Reminders

- **Imports policy**: cross-entry uses `@angular-helpers/openlayers/core|layers`; intra-entry uses relative paths.
- **`ol/source` barrel**: do NOT import from it; use deep paths (lesson from PR #106).
- **Pre-push hook**: `npx playwright install chromium` already runs automatically.
- **Conventional commits**: feat / test / docs scopes; no AI attribution lines.
