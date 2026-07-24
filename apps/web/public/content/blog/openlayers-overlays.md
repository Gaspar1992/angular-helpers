---
title: 'openlayers v0.3.0: Overlays — Popups, Tooltips, and Dynamic Angular Components on the Map'
publishedAt: '2026-04-27'
tags:
  - openlayers
  - angular
  - maps
  - overlays
  - popups
  - tooltips
  - createcomponent
  - signals
excerpt: >-
  The overlays entry point grows up. v0.3.0 ships <ol-popup> with content projection, [olTooltip] for hover labels, and a real OlPopupService that supports three content modes — string, HTMLElement, and dynamic Angular components via createComponent + hostElement. Selecting a feature, popping a card, and binding live signals to it now works out of the box, both declaratively and programmatically.
---

# openlayers v0.3.0 — Overlays

The interactions slice merged in [v0.2.0](/blog/openlayers-interactions-srp) made selecting and drawing features feel right. The thing that immediately followed in every demo we tried: _"OK, you clicked Madrid. Now what do I do with that selection?"_. Nine times out of ten the answer is **show a popup with rich, reactive content where the feature is**. Until now the overlays entry point shipped a stub — it was time to make it real.

This release ships the popup component, the tooltip directive, and a service that wires popups programmatically with the modern Angular `createComponent + hostElement` API.

## What's in v0.3.0

| Symbol                           | Purpose                                                                                                          | Where                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `<ol-popup>`                     | Declarative popup with `<ng-content>`, signal inputs, and an optional close button                               | `@angular-helpers/openlayers/overlays` |
| `[olTooltip]`                    | Hover tooltip rendered from a feature property; optional layer filter                                            | same                                   |
| `OlPopupService.open()`          | Programmatic popup with `string` or `HTMLElement` content                                                        | same                                   |
| `OlPopupService.openComponent()` | Programmatic popup with a **dynamic Angular component**, with `inputBinding` / `outputBinding` / `twoWayBinding` | same                                   |

Internal types — `PopupOpenOptions`, `PopupComponentOptions`, `PopupHandle`, `OverlayPositioning` — are exported as well, with the v0.2 stub aliases (`PopupOptions`, `OverlayPosition`) kept for backwards compatibility and marked `@deprecated`.

## Why three content modes

Popups split into three families in real apps:

1. **Tiny notice** — "5 features selected", "Click to draw". A `string` is enough.
2. **Pre-rendered DOM** — a chart, a third-party widget, a custom-element. An `HTMLElement` reference is the pragmatic interop point.
3. **A real Angular component** — anything you'd build for the rest of your UI: cards, forms, lazy-loaded views, components that bind to signals and emit outputs.

The first two are trivial. The third is where most maps libraries either give up ("here's a string") or expose a leaky escape hatch ("write your own DOM and we'll position it"). Angular finally has the right primitive: `createComponent({ environmentInjector, hostElement, bindings, directives })` (Angular 16.2+).

## The declarative path: `<ol-popup>` + content projection

```html
<ol-map [center]="[2.17, 41.38]" [zoom]="12">
  <ol-vector-layer
    id="cities"
    [features]="cities()"
    [olTooltip]="'name'"
    [olTooltipLayer]="'cities'"
  />

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

The trick that makes this work cheaply: the popup component's **host element IS the `ol/Overlay`'s element**. OL doesn't wrap or move the DOM into a different subtree; it only applies CSS transforms to position the host. Projected children stay inside Angular's component tree, so signals propagate, OnPush works, structural directives keep behaving — no `ApplicationRef.attachView`, no manual change detection.

`[position]="null"` hides the popup and emits `closed` exactly once per visible→hidden transition. This makes integration with the Select interaction natural: selectedCoord becomes `null` when nothing is selected, and the popup just disappears.

## The programmatic path: `OlPopupService.openComponent()`

When you don't want a `<ol-popup>` in the template — e.g. opening a popup from a toolbar button, an effect, an interaction handler, or a service:

```typescript
import { inject, inputBinding, outputBinding } from '@angular/core';
import { OlPopupService } from '@angular-helpers/openlayers/overlays';
import { fromLonLat } from 'ol/proj';

const popups = inject(OlPopupService);

const handle = popups.openComponent({
  id: 'random-city',
  position: fromLonLat([-3.7, 40.42]) as [number, number],
  component: CityCardComponent,
  autoPan: true,
  bindings: [
    inputBinding('name', () => 'Madrid'),
    inputBinding('population', () => 3_200_000),
    outputBinding<void>('closed', () => handle.close()),
  ],
});
```

Under the hood the service:

1. Creates an `HTMLDivElement` host.
2. Calls `createComponent(component, { environmentInjector, hostElement, bindings, directives })`.
3. Registers the host view with `ApplicationRef.attachView` so change detection ticks reach the dynamic component.
4. Builds a single `ol/Overlay` and registers it on the map.
5. On close (`handle.close()` or `popups.closeAll()`), runs the inverse: `map.removeOverlay`, `appRef.detachView`, `ref.destroy()`.

Idempotent by `id`: a second `openComponent({ id: 'x', … })` call destroys the previous `ComponentRef` cleanly before creating a new one — no leaked views, no zombies on the map.

Calls made before the map is ready are queued and replayed on `OlMapService.onReady`, matching the pattern already used by `OlLayerService`.

## Tooltips

```html
<ol-vector-layer
  id="cities"
  [features]="cities()"
  [olTooltip]="'name'"
  [olTooltipLayer]="'cities'"
/>
```

The directive subscribes to `pointermove` outside Angular's zone, runs `forEachFeatureAtPixel` with an optional `layerFilter`, and updates a single floating `<div role="tooltip">` appended to the map viewport. Standard accessibility shape (`role="tooltip"`), minimal default style, override via the `.ol-tooltip` class.

Layer filter is optional — leave `[olTooltipLayer]` out and it picks up whatever feature is under the cursor.

## What it took to make it boring

The interesting work in this slice wasn't the API surface (those were obvious from the spec). It was the boring parts that determine whether a library is _actually_ usable:

- **Cleanup is centralized in the service close path.** Every popup tracks both its `ol/Overlay` and its optional `ComponentRef`, behind a single `dispose()` closure that runs `map.removeOverlay` + `appRef.detachView` + `ref.destroy`. The unit tests assert `componentRef.destroy()` runs exactly once on close.
- **Idempotency is by id, not by reference.** The string content path updates the existing overlay in place when called again with the same id. The component path always recreates — re-binding inputs on an existing `ComponentRef` is a foot-gun.
- **Pre-ready calls are queued.** Same pattern as the layer service. No surprising silent drops, no race conditions.
- **`OlPopupComponent` does NOT delegate to the service.** It manages its own overlay lifecycle directly so the host element can be reused as the OL element. Going through the service would wrap content in an extra `<div>` and break content projection.

## Tests

There are 21 new unit tests for this slice (84 → 93 in the full suite — see [the previous post](/blog/openlayers-interactions-srp)):

- `popup.service.spec.ts` — 12 tests covering both `open()` and `openComponent()`, idempotency, queueing, cleanup paths, `appRef.detachView` and `ref.destroy()` invocations.
- `popup.component.spec.ts` — 7 tests on overlay registration, reactive position/offset/positioning, `closed` emissions, the close button, and destroy cleanup.
- `tooltip.directive.spec.ts` — 2 smoke tests on listener registration and DOM element lifecycle.

A footnote for anyone hitting it: `TestBed.configureTestingModule` currently fails in our Vitest + Analog combo with `Cannot read properties of null (reading 'ngModule')`. The workaround we use is to bootstrap a tiny throwaway application once with `bootstrapApplication(EmptyComponent, { providers: [provideZonelessChangeDetection()] })`, capture its `EnvironmentInjector`, and create per-test environment injectors with `createEnvironmentInjector(providers, parent)`. This gives `createComponent` everything it needs without TestBed compilation.

## Demo

`/demo/openlayers` now wires both paths:

- Click a city → declarative `<ol-popup>` with the city's name and population.
- Click the **🎯 Random component popup** toolbar button → a `DemoCityCardComponent` opened via `OlPopupService.openComponent()`, with `inputBinding`s for name and population and an `outputBinding` for close.
- Hover any city → tooltip with the name.

## What's next

The remaining Phase 2 surface is `military` (`OlMilitarySymbolComponent` + lazy `milsymbol`). After that, the entry point ships feature-complete and we'll cut a Phase 2 wrap-up release.

If you're already on `0.2.0`, the upgrade is purely additive — `PopupOptions` and `OverlayPosition` are kept as deprecated aliases, so existing code keeps compiling.

— v0.3.0 is on `feat/openlayers-overlays`, going to `main` shortly.
