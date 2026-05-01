# Proposal — `@angular-helpers/openlayers/military` (Phase 2 final slice)

**Status**: Draft, awaiting approval
**Target version**: `@angular-helpers/openlayers@0.4.0`
**Branch (proposed)**: `feat/openlayers-military`

## Problem

The Phase 2 plan (`.sdd/proposal-openlayers-phase2.md`) carved out a `military` entry point to expose:

1. NATO MIL-STD-2525 symbology via [`milsymbol`](https://github.com/spatialillusions/milsymbol)
2. Ellipse, sector and donut (annular-ring) geometry helpers — defensive perimeters, fields-of-fire, search areas, exclusion zones, range rings; common GIS military primitives

The entry point is currently a **stub**: `OlMilitaryService` returns fabricated `Feature` objects with empty geometry, `milsymbol` is not installed, no component exists, no tests, and no demo. Any user importing from `@angular-helpers/openlayers/military` today gets non-functional code.

This is the only remaining Phase 2 deliverable. After this slice the entry point ships feature-complete and we cut a Phase 2 wrap-up release.

## Goal

Deliver a real, tested, documented `military` entry point that:

- Generates valid polygon geometry for ellipses, circular sectors and donuts (annular rings) via pure math (no extra deps).
- Renders MIL-STD-2525 symbols on the map using `milsymbol`, **lazy-loaded** so the dependency stays out of the bundle until actually used.
- Stays consistent with the existing **data-vs-UI separation**: the service produces `Feature` objects that the user assigns to `<ol-vector-layer [features]="...">`. No new render component is required if we can express symbol icons through feature style metadata.
- Comes with unit tests (>80% coverage of the service), a demo on `/demo/openlayers`, and README + blog post.

## Scope — Included

### Geometry helpers (pure, no deps)

- `OlMilitaryService.createEllipse(config)` → returns a `Feature<Polygon>` approximating an ellipse with N segments (default 64). Supports `center`, `semiMajor`, `semiMinor`, `rotation` (radians, optional, default 0).
- `OlMilitaryService.createSector(config)` → returns a `Feature<Polygon>` for a circular pie-slice sector. Supports `center`, `radius`, `startAngle`, `endAngle` (radians, with `endAngle > startAngle`).
- `OlMilitaryService.createDonut(config)` → returns a `Feature<Polygon>` for an annular ring (disk with a circular hole). The output polygon has TWO rings: an outer ring (CCW) and an inner ring (CW per the right-hand rule), so OpenLayers / GeoJSON renderers fill only the band. Supports `center`, `outerRadius`, `innerRadius` (with `outerRadius > innerRadius > 0`).
- Coordinates emitted in EPSG:4326 (lon/lat) and computed on a local tangent plane (small-area assumption documented in JSDoc; acceptable for typical military symbology distances < 100 km).

### MIL-STD-2525 symbology

- `OlMilitaryService.createMilSymbol(config)` → returns a `Feature<Point>` carrying styling metadata in `properties.style` so that `<ol-vector-layer>` can render the symbol as an icon overlay on the map.
- `MilSymbolConfig` extended (back-compat) with optional `size`, `monoColor`, `outlineColor`, `iconColor`, `additionalInformation`, `staffComments`, `quantity`, etc. — a strict-typed subset of `milsymbol`'s `SymbolOptions`. The `sidc` field stays mandatory.
- `milsymbol` imported via **dynamic `import()`** inside the service. First call awaits the chunk, caches the constructor, subsequent calls are sync. Output is a base64-encoded SVG `data:` URL plus anchor and size metadata.
- Optional sync API: `createMilSymbolSync(config)` that throws if the library is not yet loaded — for advanced users who control preloading.
- Public types: `MilSymbolConfig`, `MilSymbolStyleResult` (`{ src: string; size: [number, number]; anchor: [number, number] }`).

### Vector layer integration

- The existing `OlVectorLayerComponent` is extended (or its style resolver tweaked) so that a feature with `properties.style.icon = { src, size, anchor }` renders as an `ol/style/Icon`. Polygon features keep their default fill/stroke unless `properties.style.fill` / `properties.style.stroke` is set.
- Backwards compatible: features without `properties.style` keep the current default style.

### Tests

- Unit tests for `OlMilitaryService`:
  - `createEllipse` produces N+1 closed-ring vertices, axes match `semiMajor/semiMinor` at 0/π/2/π/3π/2 within ε
  - Rotation matrix verified at known angles
  - `createSector` produces correct vertex count, first/last vertex on the radius, included angle equals `endAngle - startAngle` within ε, fan-shape closed
  - `createMilSymbol` lazy-loads, caches the loader, outputs a valid `data:image/svg+xml;base64,…` URL, anchor/size finite
  - `createMilSymbolSync` throws before first async load resolves, returns valid result after
- Vector layer style resolver: feature with `properties.style.icon` → `ol/style/Style` with an `ol/style/Icon`.
- Coverage target: >80% on `military/**`.

### Demo

- Add a "Military symbology" toolbar group on `/demo/openlayers` that:
  - Drops a friendly-infantry symbol (`SFGPUCI-----` or similar) on Madrid
  - Adds an ellipse around Barcelona
  - Adds a 60° sector north of Valencia
  - Adds a donut (range ring) around Sevilla — inner radius 5 km, outer radius 10 km
- The new features go into a dedicated `military-features` vector layer, toggleable from the layer switcher.

### Docs

- New "Military" section in `packages/openlayers/README.md` covering the four helpers (ellipse, sector, donut, mil-symbol) + the lazy-load behavior of `milsymbol`.
- Blog post `public/content/blog/openlayers-military.md` registered in `posts.data.ts`.
- Update `dist/openlayers/README.md` placeholder example to use real exported symbols (currently references a fictional `OlEllipseFeatureComponent`).

### Versioning

- `@angular-helpers/openlayers` bumps to `0.4.0`.
- `milsymbol` added as **optional peer dependency** + dev dependency (so the demo works in the monorepo). Documented as optional in the README.

## Scope — Excluded

- **Symbol clustering / WebGL rendering** — not needed for typical use cases; reserved for a Phase 3 perf slice if requested.
- **MIL-STD-2525D vs 2525C selection UI** — `milsymbol` defaults are kept; advanced consumers can pass through `MilSymbolConfig.standard` if/when needed.
- **Editing of military symbols via Modify interaction** — symbols are points; ellipses/sectors are rendered geometry, not editable polygons. Out of scope.
- **Coordinate-system flexibility beyond EPSG:4326** — projection helpers stay where they are (`fromLonLat` consumer-side).
- **Animation of symbols** (movement traces, blinking, etc.) — Phase 3 if needed.
- **Server-side rendering of `milsymbol`** — `milsymbol` is browser-only; the dynamic import is gated behind a `typeof window !== 'undefined'` check and the service is documented as client-only.

## Approach

### 1. Architectural alignment — data-driven, no new component

The existing pattern is firmly **data via `[features]`, UI via templates, operations via services** (see `packages/openlayers/README.md` Architecture section). The cheapest, most consistent path is:

```ts
const symbol = await ml.createMilSymbol({ sidc: 'SFGPUCI-----', position: [...] });
features.update(prev => [...prev, symbol]);
```

The user gets back a `Feature<Point>` carrying its own style; the existing `<ol-vector-layer [features]>` renders it. **No new component is needed**; we only enrich the vector-layer style resolver.

This is a deliberate departure from the original Phase 2 sketch which mentioned `OlMilitarySymbolComponent`. A component would force users to either: (a) instantiate one component per symbol (bad for hundreds of symbols), or (b) take a `[symbols]` array which is identical to `[features]` but with a different shape — duplicating the layer's API.

If a real need for a per-symbol component appears later, it can be added without breaking the service-based API.

### 2. `milsymbol` lazy load

```ts
private mlLoader: Promise<typeof import('milsymbol')> | null = null;

private loadMilsymbol() {
  return (this.mlLoader ??= import('milsymbol'));
}
```

Webpack/esbuild splits this into a separate chunk. The base `military` entry point compiles down to ~3 KB without the dep; consumers pay the ~50 KB gzipped only when they call `createMilSymbol` for the first time.

### 3. Style resolver in `OlVectorLayerComponent`

A minimal extension of the existing style function: if `feature.get('style')` is an object with `icon: { src, size, anchor }`, build an `ol/style/Style` with an `ol/style/Icon`. Otherwise fall back to the current default. This is the only edit to an existing entry point; it stays additive and back-compat.

### 4. Demo wiring

A new toolbar group `Military` on `/demo/openlayers` with four buttons (`+ Symbol`, `+ Ellipse`, `+ Sector`, `+ Donut`), backed by signals. A `Clear military` button empties the layer. Layer is registered with the layer switcher.

## Risks

| Risk                                                                           | Likelihood | Impact | Mitigation                                                                                                                              |
| ------------------------------------------------------------------------------ | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `milsymbol` API surface drift between major versions                           | Low        | Medium | Pin to `^2.x`, list as optional peer dep, narrow our typed surface to a vetted subset                                                   |
| Vector layer style resolver edit breaks existing default styling               | Medium     | High   | Add tests covering features WITHOUT `properties.style` first, then add icon path; gate icon detection on explicit `style.icon` presence |
| Coordinate math errors on ellipse/sector/donut at high latitudes / large radii | Medium     | Low    | Document small-area assumption, use local tangent plane; defer Geodesic-correct math to Phase 3 if requested                            |
| Donut inner-ring winding wrong → entire disk fills (hole disappears)           | Medium     | Medium | Inner ring emitted clockwise per GeoJSON right-hand rule; explicit unit test on winding order                                           |
| Lazy import breaks SSR / non-browser environments                              | Low        | Medium | Gate `import()` on `typeof window !== 'undefined'`, throw a clear error otherwise; document as client-only                              |
| Demo bundle bloat from `milsymbol`                                             | Low        | Low    | Already lazy; demo only loads on first symbol button click                                                                              |
| `MilSymbolConfig` extension breaks existing stub consumers                     | Very low   | Low    | All new fields optional; `sidc` and `position` stay required; add `@deprecated` only if we actually rename anything (we don't)          |

## Open assumptions

1. **The original `OlMilitarySymbolComponent` from the Phase 2 sketch is dropped in favor of a service-only API.** Cheaper, more consistent, future component still possible. → **Confirm with reviewer.**
2. **EPSG:4326 output is acceptable** for ellipse/sector vertices. The existing `OlVectorLayerComponent` consumes lon/lat features (we transform via `fromLonLat` style-side). → Consistent with current demo.
3. **`milsymbol` 2.x is the right pin.** Latest at time of writing; stable API. → Verify in implementation.
4. **The vector-layer style resolver lives in `layers/`, not `military/`.** A small, focused edit there is preferable to inventing a new "renderer registration" indirection. → Confirm.
5. **No new public types beyond `MilSymbolStyleResult` and the extended `MilSymbolConfig`.** → Likely sufficient.

## Pending decisions

- **Sync vs async-only for `createMilSymbol`?** Default plan: ship both `createMilSymbol` (async, lazy-loads) and `createMilSymbolSync` (throws if not loaded). Alternative: async-only, simpler API. Defaulting to "ship both" for ergonomics but happy to drop the sync variant.
- **Naming**: `createMilSymbol` vs `addMilSymbol` (the current stub name is `addMilSymbol`, which suggests imperative side-effect). The slice will rename to `createMilSymbol` for consistency with `createEllipse` / `createSector` / `createDonut`. The stub method is unused externally so this is safe.
- **Should the layer style resolver edit live in this slice or in a separate small refactor PR first?** Leaning toward bundling it here to keep the change cohesive. Worth flagging.
- **Donut as a single helper, or as `createDonut` + future `createMultiRing` (concentric N-rings) helper?** Defaulting to a single-band `createDonut` for this slice; multi-ring is trivial to compose by calling `createDonut` N times client-side. A `createRangeRings(config)` could be added later if usage justifies it.

## Reference / prior art

- Phase 2 master proposal: `.sdd/proposal-openlayers-phase2.md`
- Overlays slice (just merged, PR #107): `.sdd/.archive/openlayers-overlays/`
- Interactions slice: `.sdd/.archive/openlayers-overlays/proposal-openlayers-overlays.md` references the SRP refactor
- Existing stub: `packages/openlayers/military/src/`
- `milsymbol` docs: https://spatialillusions.com/milsymbol/

## Out-of-scope follow-ups (Phase 3 candidates)

- Geodesic-correct ellipse/sector/donut math (Vincenty's formulae) for very large or polar shapes
- `createRangeRings(config)` helper for concentric N-band donuts (artillery range rings)
- WebGL/cluster rendering for >1000 symbols
- Symbol editing via Modify interaction
- Animated symbol traces
- Server-side rendering pipeline (Node-side `milsymbol` via canvas polyfill)
