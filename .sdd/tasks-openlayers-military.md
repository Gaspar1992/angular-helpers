# Tasks — `@angular-helpers/openlayers/military` v0.4.0

Companion to `proposal-openlayers-military.md` + `spec-openlayers-military.md`.

Each task ends in a clean working tree + green local tests for the touched scope.

## 1. SDD docs + branch

- [x] Branch `feat/openlayers-military` cut from `main`
- [ ] Commit SDD docs (proposal + spec + tasks)

## 2. Dependency setup

- [ ] `npm install milsymbol@^2 --save-dev` at repo root (so the demo can use it)
- [ ] Add `milsymbol` to `peerDependenciesMeta: { milsymbol: { optional: true } }` in `packages/openlayers/package.json`
- [ ] If `@types/milsymbol` is missing/inadequate, add ambient types at `packages/openlayers/military/src/types/milsymbol.d.ts` covering `Symbol` constructor, `asSVG()`, `getSize()`, `getAnchor()`

## 3. Type model

- [ ] Extend `EllipseConfig` with optional `segments` and `properties`
- [ ] Extend `SectorConfig` with optional `segments` and `properties`
- [ ] Add `DonutConfig` (`center`, `outerRadius`, `innerRadius`, `segments?`, `properties?`)
- [ ] Extend `MilSymbolConfig` with the strict-typed milsymbol option subset (size, monoColor, outlineColor, iconColor, additionalInformation, staffComments, quantity, uniqueDesignation, properties)
- [ ] Add `MilSymbolStyleResult` (`{ src; size; anchor }`)

## 4. Pure-math helpers + tests

- [ ] Implement `OlMilitaryService.createEllipse(config)` per FR-1
- [ ] Implement `OlMilitaryService.createSector(config)` per FR-2
- [ ] Implement `OlMilitaryService.createDonut(config)` per FR-3 (CCW outer, CW inner)
- [ ] `military.service.spec.ts` — ellipse vertex count, semi-axes within ε at 0/π/2/π/3π/2, rotation correctness
- [ ] `military.service.spec.ts` — sector vertex count, included angle, fan closure, error cases
- [ ] `military.service.spec.ts` — donut two rings, signed shoelace area sign-flip (outer > 0, inner < 0), radii within ε, error cases
- [ ] Helper: small `signedArea(ring)` test util (private to spec)

## 5. milsymbol integration

- [ ] Implement `preloadMilsymbol(): Promise<void>` (cached promise)
- [ ] Implement `createMilSymbol(config): Promise<Feature<Point>>` per FR-4
- [ ] Implement `createMilSymbolSync(config): Feature<Point>` per FR-5 (throws if not loaded)
- [ ] Remove legacy `addMilSymbol` stub method
- [ ] Tests with `vi.mock('milsymbol', ...)`:
  - First call resolves and produces a valid data URL, anchor and size
  - Loader Promise is cached (only one import call across N invocations)
  - Sync API throws before load, succeeds after
  - SSR check: in a jsdom env where `window` is undefined, throws the documented error

## 6. Vector layer style resolver

- [ ] Read existing `OlVectorLayerComponent` style function in `packages/openlayers/layers/src/features/vector-layer.component.ts`
- [ ] Add icon path: if `feature.get('style')?.icon`, return `new Style({ image: new Icon({ src, size, anchor }) })`
- [ ] Backwards-compat: features without `style` keep current default
- [ ] New tests in the layer's spec file: feature without style → default; feature with `style.icon` → Icon style
- [ ] Run full layers test suite, no regressions

## 7. Public exports

- [ ] Update `packages/openlayers/military/src/index.ts` to export the new types and ensure no removed symbols leak
- [ ] Verify with `npm run build` that all 6 entry points compile clean

## 8. Demo wiring

- [ ] Add `Military` toolbar group to `src/app/demo/openlayers/openlayers-demo.component.ts` with 4 add buttons + Clear
- [ ] `militaryFeatures = signal<Feature[]>([])` + a `<ol-vector-layer id="military" [features]="militaryFeatures()" [zIndex]="12">`
- [ ] Symbol button shows brief loading state during first preload
- [ ] Register `military` layer in the layer switcher with toggle visibility

## 9. Docs

- [ ] New "Military symbology" section in `packages/openlayers/README.md` with examples for all four helpers
- [ ] Blog post `public/content/blog/openlayers-military.md`
- [ ] Register the post in `src/app/blog/config/posts.data.ts` as the latest entry
- [ ] Fix the obsolete `OlEllipseFeatureComponent` placeholder example at the bottom of the same README

## 10. Version + ship

- [ ] Bump `packages/openlayers/package.json` to `0.4.0`
- [ ] `npm run format && npm run lint` clean
- [ ] `cd packages/openlayers && npm test -- --run && npm run build` green
- [ ] Push, open PR against `main`
- [ ] CI green
- [ ] Merge + delete branches + archive SDD docs under `.sdd/.archive/openlayers-military/`
