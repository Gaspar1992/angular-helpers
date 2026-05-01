---
title: 'openlayers v0.4.0: Military symbology — Ellipse, Sector, Donut, and lazy-loaded MIL-STD-2525'
publishedAt: '2026-04-27'
tags:
  - openlayers
  - angular
  - maps
  - military
  - milsymbol
  - mil-std-2525
  - geometry
  - lazy-loading
excerpt: >-
  Phase 2 closes. v0.4.0 fills in the last entry point with real implementations of createEllipse, createSector, and createDonut (pure math, zero deps), plus createMilSymbol that lazy-loads milsymbol on first use. Donuts ship with the right-hand-rule winding so the hole actually renders. Service-only API, no per-symbol component.
---

# openlayers v0.4.0 — Military symbology

This is the last Phase 2 slice. The `military` entry point of `@angular-helpers/openlayers` was previously a **stub**: `OlMilitaryService` returned fabricated `Feature` objects with empty geometry, `milsymbol` wasn't installed, no tests. v0.4.0 makes it real.

## What's in v0.4.0

| Helper                        | What it produces                                                                                | Dependencies           |
| ----------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------- |
| `createEllipse(config)`       | `Feature<Polygon>` — N-segment ellipse with optional rotation                                   | None                   |
| `createSector(config)`        | `Feature<Polygon>` — circular pie slice (apex-arc-apex)                                         | None                   |
| `createDonut(config)`         | `Feature<Polygon>` — annular ring with two opposite-wound rings                                 | None                   |
| `createMilSymbol(config)`     | `Feature<Point>` with `style.icon` carrying a NATO MIL-STD-2525 symbol as a base64 SVG data URL | Lazy-loads `milsymbol` |
| `createMilSymbolSync(config)` | Same shape, synchronous — throws if `milsymbol` is not loaded yet                               | Same                   |
| `preloadMilsymbol()`          | `Promise<void>` — fire-and-forget on app init                                                   | Triggers the lazy load |

`milsymbol` is declared as an **optional peer dependency**. Consumers who never use the symbol helper don't pay the bundle cost.

## Why service-only, not a `<ol-mil-symbol>` component

The original Phase 2 sketch mentioned `OlMilitarySymbolComponent`. Once we sat down with the existing `data-via-[features]` pattern that the rest of the package already follows, a per-symbol component started to look like duplication: either you instantiate one component per symbol (bad for hundreds of pins) or you take a `[symbols]` array, which is just `[features]` with a different shape and no clear win.

The clean call site is:

```ts
const symbol = await this.ml.createMilSymbol({ sidc: 'SFGPUCI-----', position: [-3.7, 40.42] });
features.update((prev) => [...prev, symbol]);
```

Same `[features]` API as everything else; the symbol is a regular `Feature<Point>` that happens to carry an `style.icon` field the vector layer knows how to render. If a real per-symbol component need shows up later, it can be added without breaking this surface.

## Donuts (range rings) and the right-hand rule

Annular rings — disk with a hole — are a daily-driver primitive for range rings, exclusion zones, and minimum-safe-distance overlays. Trick: a `Polygon` with two rings only renders the band IF the inner ring is wound **opposite** to the outer ring (GeoJSON / OGC right-hand rule). Get the winding wrong and the renderer fills the entire disk; the hole disappears silently.

```ts
const donut = ml.createDonut({
  center: [-5.99, 37.39], // Sevilla
  innerRadius: 5_000, // 5 km core stays empty
  outerRadius: 10_000, // 10 km outer edge
});
```

We sample the same `θ` sequence for both rings, then `inner.reverse()` so the inner ring is traversed clockwise while the outer stays counter-clockwise. A unit test computes the **signed shoelace area** of each ring and asserts the sign-flip — that's the only way to catch a winding regression at the data level (the visual symptom is "looks like a disk", which is too easy to miss in a screenshot diff).

## `milsymbol` lazy-load

`milsymbol` is ~50 KB gzipped. Importing it eagerly from a feature most consumers never use is exactly the wrong default for a tree-shakable library. The pattern:

```ts
private milsymbolModule: typeof import('milsymbol') | null = null;
private milsymbolLoader: Promise<typeof import('milsymbol')> | null = null;

private loadMilsymbol() {
  if (!this.milsymbolLoader) {
    this.milsymbolLoader = import('milsymbol').then((mod) => {
      this.milsymbolModule = mod;
      return mod;
    });
  }
  return this.milsymbolLoader;
}
```

esbuild splits the dynamic `import()` into a separate chunk. The base `military` entry point compiles down to ~3 KB without the dep; you pay the rest only when `createMilSymbol` runs.

`createMilSymbolSync` is the back door for advanced users who control their own preload sequence — call `preloadMilsymbol()` at app init, then use the sync API in hot paths.

## Vector layer learns about icons

`<ol-vector-layer>` previously rendered every feature with a single static default style. To support `createMilSymbol`'s output without wrapping users in a custom layer, the layer's style construction now becomes a per-feature function:

```ts
const styleFn = (olFeature) => {
  const abstractStyle = olFeature.get('__angular_helpers_style__');
  if (abstractStyle?.icon?.src) {
    return new Style({ image: new Icon({ src, size, anchor }) });
  }
  return defaultStyle;
};
```

`Style` from `core/types.ts` gained an optional `icon` field. Two new tests guard the contract: a feature without `style` keeps the default fill/stroke; a feature with `style.icon` resolves to an `ol/style/Icon`.

## SSR / non-browser

`milsymbol` is browser-only. The geometry helpers (`createEllipse` / `createSector` / `createDonut`) are **pure math** — they work in any environment. `createMilSymbol` and `createMilSymbolSync` throw a clear "requires a browser environment" error when `window` is undefined; the unit tests cover that path by hiding `globalThis.window` and asserting the rejection.

## Tests

26 new unit tests in `military.service.spec.ts`:

- Ellipse — vertex count, axis radii at 0/π/2 within ε, rotation correctness (vertex 0 lands due North after π/2 rotation), error paths
- Sector — apex-arc-apex shape, vertex-on-radius assertion, error paths
- Donut — two rings, **signed-area sign-flip** (CCW outer, CW inner), radii within ε, error paths
- `createMilSymbol` — base64 data URL, anchor and size, multiple-call coverage, numeric `quantity` coercion, invalid SIDC rejection
- `createMilSymbolSync` — throws before load, succeeds after `preloadMilsymbol()`
- Non-browser — throws with the documented error when `window` is hidden

Plus 2 new layer-service tests covering the icon-style resolver path.

Total package tests: **93 → 121**, all green. Build clean across all 6 entry points. Unit footprint of the `military` entry point itself: ~3 KB minified before the dynamic chunk.

## Demo

`/demo/openlayers` gets a four-button "Military" group:

- **➕ Symbol** — drops a friendly-infantry NATO symbol with a slight random offset around Madrid. The button locks while `milsymbol` is being lazy-loaded for the very first call (you can see the network request fire in DevTools); subsequent clicks are sub-millisecond.
- **➕ Ellipse** — rotated ellipse around Barcelona.
- **➕ Sector** — 60° pie-slice north of Valencia.
- **➕ Donut** — 5–10 km range ring around Sevilla.
- **🧹 Clear** — empties the layer.

All four feed a single `militaryFeatures` signal, which a dedicated `<ol-vector-layer id="military" [features]="militaryFeatures()" [zIndex]="12">` renders.

## What's next

Phase 2 ships feature-complete with v0.4.0. The roadmap from here:

- **Phase 2 wrap-up post** — overview of `core` / `layers` / `controls` / `interactions` / `overlays` / `military` as a single coherent picture
- **Phase 3 candidates** — geodesic-correct ellipse/sector/donut math (Vincenty), `createRangeRings(config)` for N concentric bands, WebGL/cluster rendering for >1000 symbols, Modify-interaction for symbols, server-side `milsymbol` rendering

If you're already on `0.3.0`, the upgrade is purely additive. The previous `addMilSymbol` stub method (which never returned valid output) is removed; `createMilSymbol` replaces it.

— v0.4.0 is on `feat/openlayers-military`, going to `main` shortly.
