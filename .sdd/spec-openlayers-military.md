# Spec — `@angular-helpers/openlayers/military` (v0.4.0)

**Companion to**: `.sdd/proposal-openlayers-military.md`

## 1. Functional requirements

### FR-1 — `OlMilitaryService.createEllipse(config)`

**Input** — `EllipseConfig`:

```ts
interface EllipseConfig {
  center: [number, number]; // [lon, lat] in EPSG:4326
  semiMajor: number; // meters
  semiMinor: number; // meters
  rotation?: number; // radians, default 0; 0 = semiMajor along East
  segments?: number; // vertex count, default 64, min 8
  properties?: Record<string, unknown>; // forwarded onto the feature
}
```

**Output** — `Feature<Polygon>`:

- `id` — auto-generated (`ellipse-<n>` or `crypto.randomUUID()` slice; deterministic across calls of the same config not required)
- `geometry.type === 'Polygon'`
- `geometry.coordinates` — `[[ [lon0, lat0], ..., [lon0, lat0] ]]` — single ring, **closed** (first vertex repeated as last)
- `properties` — merged with input `config.properties` if provided

**Behavior**:

1. Compute vertices on a local tangent plane (equirectangular approximation): `dx = cos(θ + rotation) * semiMajor; dy = sin(θ + rotation) * semiMinor` for θ ∈ [0, 2π).
2. Project (dx, dy) meters → degrees using `lat += dy / 111_320; lon += dx / (111_320 * cos(centerLat))`.
3. Close the ring by appending the first vertex.

**Errors**:

- `semiMajor <= 0` or `semiMinor <= 0` → throws `RangeError("semiMajor and semiMinor must be positive")`
- `segments < 8` → throws `RangeError("segments must be >= 8")`

### FR-2 — `OlMilitaryService.createSector(config)`

**Input** — `SectorConfig`:

```ts
interface SectorConfig {
  center: [number, number];
  radius: number; // meters
  startAngle: number; // radians, 0 = East, CCW positive
  endAngle: number; // radians, must be > startAngle
  segments?: number; // arc segments, default 32, min 4
  properties?: Record<string, unknown>;
}
```

**Output** — `Feature<Polygon>`:

- Vertex 0: `center`
- Vertices 1..N+1: arc points from `startAngle` to `endAngle`
- Vertex N+2: `center` (closes the pie slice)

**Errors**:

- `radius <= 0` → `RangeError`
- `endAngle <= startAngle` → `RangeError("endAngle must be greater than startAngle")`
- `endAngle - startAngle > 2π` → `RangeError("sector cannot exceed full circle")`
- `segments < 4` → `RangeError`

### FR-3 — `OlMilitaryService.createDonut(config)`

**Input** — `DonutConfig`:

```ts
interface DonutConfig {
  center: [number, number]; // [lon, lat] in EPSG:4326
  outerRadius: number; // meters, > innerRadius
  innerRadius: number; // meters, > 0
  segments?: number; // vertex count per ring, default 64, min 8
  properties?: Record<string, unknown>;
}
```

**Output** — `Feature<Polygon>`:

- `geometry.type === 'Polygon'`
- `geometry.coordinates` — exactly TWO rings:
  1. **Outer ring** — closed, wound **counter-clockwise** (CCW), `segments + 1` vertices, radius `outerRadius`.
  2. **Inner ring** — closed, wound **clockwise** (CW per GeoJSON right-hand rule for holes), `segments + 1` vertices, radius `innerRadius`.
- `properties` — merged with input `config.properties` if provided.

**Behavior**:

1. Compute outer ring vertices for θ ∈ [0, 2π) increasing (CCW): `dx = cos(θ) * outerRadius; dy = sin(θ) * outerRadius`.
2. Compute inner ring vertices for θ ∈ [0, 2π) **decreasing** (CW): traverse the same θ sequence in reverse so the hole satisfies the right-hand rule.
3. Project meters → degrees on the local tangent plane (same formulas as FR-1/FR-2).
4. Close each ring by repeating its first vertex as last.

**Errors**:

- `outerRadius <= 0` or `innerRadius <= 0` → `RangeError("radii must be positive")`
- `outerRadius <= innerRadius` → `RangeError("outerRadius must be greater than innerRadius")`
- `segments < 8` → `RangeError("segments must be >= 8")`

**Renderer note**: OL's `GeoJSON` reader respects multi-ring polygons natively; the default fill style of `<ol-vector-layer>` will render only the band (the hole shows through). No style-resolver work is required for donuts beyond the existing default.

### FR-4 — `OlMilitaryService.createMilSymbol(config)`

**Input** — `MilSymbolConfig`:

```ts
interface MilSymbolConfig {
  sidc: string; // MIL-STD-2525 SIDC code, required
  position: [number, number]; // [lon, lat], required
  size?: number; // px, default 30
  monoColor?: string; // CSS color
  outlineColor?: string;
  iconColor?: string;
  additionalInformation?: string;
  staffComments?: string;
  quantity?: number;
  uniqueDesignation?: string;
  properties?: Record<string, unknown>;
}
```

**Output** — `Promise<Feature<Point>>`:

- `geometry.type === 'Point'`
- `geometry.coordinates === config.position`
- `properties.style.icon` — `{ src: string; size: [number, number]; anchor: [number, number] }`
  - `src` — `data:image/svg+xml;base64,…` from `milsymbol`'s `asSVG()` output
  - `size` — `[symbol.getSize().width, symbol.getSize().height]`
  - `anchor` — `[symbol.getAnchor().x / size.width, symbol.getAnchor().y / size.height]` (normalized 0..1, OL convention)
- `properties.sidc` — copied from config for downstream identification
- Other `MilSymbolConfig` fields merged into `properties` (excluding `position`, which lives in geometry)

**Behavior**:

1. On first call, lazy-load `milsymbol` via dynamic `import()`. Cache the Promise on the service (one in-flight load per service instance).
2. Construct `new Symbol(sidc, options)`, where `options` is the validated subset of the config.
3. Extract SVG via `symbol.asSVG()`, base64-encode (`btoa(unescape(encodeURIComponent(svg)))` to handle non-ASCII safely), prefix as data URL.
4. Read `getSize()` and `getAnchor()` from the symbol instance for icon metadata.
5. Return the feature.

**Errors**:

- `sidc` not a string of length ≥ 10 → `TypeError("sidc must be a non-empty MIL-STD-2525 SIDC string")`
- Running outside a browser environment (`typeof window === 'undefined'`) → `Error("createMilSymbol requires a browser environment")`
- `milsymbol` import fails → propagates the underlying error

### FR-5 — `OlMilitaryService.createMilSymbolSync(config)`

**Behavior**:

- Same output as FR-3, but synchronous.
- Throws `Error("milsymbol is not loaded yet; call createMilSymbol once first or preload via preloadMilsymbol()")` if the dynamic import has not resolved yet.

### FR-6 — `OlMilitaryService.preloadMilsymbol()`

**Behavior**:

- Returns `Promise<void>` that resolves when `milsymbol` is available.
- Idempotent: subsequent calls return the same cached promise.

### FR-7 — Vector layer icon-style support

The existing `OlVectorLayerComponent` style function in `packages/openlayers/layers/src/features/vector-layer.component.ts` is extended:

- If `feature.get('style')` is an object with shape `{ icon: { src: string; size: [number, number]; anchor: [number, number] } }`, build an `ol/style/Style` with an `ol/style/Icon`:
  ```ts
  new Style({ image: new Icon({ src, size, anchor }) });
  ```
- Otherwise: existing default style (unchanged).
- Optional: same path for `style.fill` (`ol/style/Fill`) and `style.stroke` (`ol/style/Stroke`) on Polygon/LineString features. **Default-off** unless the helper functions emit them; document for advanced users.

### FR-8 — Public exports from `@angular-helpers/openlayers/military`

```ts
export { OlMilitaryService } from './services/military.service';
export { withMilitary, provideMilitary } from './config/providers';
export type {
  EllipseConfig,
  SectorConfig,
  DonutConfig,
  MilSymbolConfig,
  MilSymbolStyleResult,
} from './models/military.types';
```

`addMilSymbol` (legacy stub method on the service) is **removed**. No deprecation alias because the stub never returned valid output.

### FR-9 — Demo updates

On `/demo/openlayers`:

- New toolbar group with four buttons: **➕ Symbol**, **➕ Ellipse**, **➕ Sector**, **➕ Donut**, plus a **Clear military** button.
- Clicks call the corresponding service method and append to a `militaryFeatures` signal.
- A `<ol-vector-layer id="military" [features]="militaryFeatures()" [zIndex]="12">` renders them.
- Layer registered in the layer switcher with toggle visibility.
- The first symbol click awaits `preloadMilsymbol()` if needed (the button shows a brief loading state).

## 2. Non-functional requirements

### NFR-1 — Bundle size

- The `military` entry point itself (without `milsymbol`) ≤ 5 KB minified. Pure-math helpers + tiny lazy-loader.
- `milsymbol` chunk loads on-demand only.
- Verified by inspecting `dist/openlayers/military/fesm2022/*.mjs` size after `npm run build`.

### NFR-2 — Test coverage

- `military/**` ≥ 80% branches/lines (V8 coverage via Vitest).
- Adds a new test file each for `military.service.spec.ts` and an extension of the existing vector layer spec covering the icon path.

### NFR-3 — No regressions

- All 93 existing `packages/openlayers` tests keep passing.
- All 172 browser E2E tests keep passing (or hardened locators only).
- `npm run format:check` and `npm run lint` clean — no new warnings.

### NFR-4 — TypeScript strictness

- All new code passes `tsc --strict` with no `any`. Use `unknown` where appropriate; type the `milsymbol` import via a lightweight ambient declaration if `@types/milsymbol` is not adequate.

### NFR-5 — Accessibility

- Demo buttons have visible labels and `aria-label`s where icons are used.
- Symbols themselves are decorative on the canvas; no specific WCAG hooks required beyond the existing demo accessibility.

### NFR-6 — SSR / non-browser

- `createMilSymbol` is documented as client-only.
- The provider `withMilitary()` and the geometry helpers (`createEllipse`, `createSector`) work in any environment (no DOM dependency).
- `OlMilitaryService` does not throw at construction time outside a browser — only on `createMilSymbol`/`createMilSymbolSync` calls.

## 3. Use scenarios

### Scenario A — Drop a friendly-infantry symbol

```ts
const ml = inject(OlMilitaryService);
const features = signal<Feature[]>([]);

async addInfantry() {
  const f = await ml.createMilSymbol({
    sidc: 'SFGPUCI-----',
    position: [-3.7, 40.42], // Madrid
    size: 36,
  });
  features.update(prev => [...prev, f]);
}
```

```html
<ol-vector-layer id="military" [features]="features()" />
```

**Expected**: a NATO friendly-infantry pictogram appears at the Madrid coordinate.

### Scenario B — Defensive ellipse + sector

```ts
const ellipse = ml.createEllipse({
  center: [2.17, 41.38],
  semiMajor: 5_000,
  semiMinor: 2_500,
  rotation: Math.PI / 6,
});

const sector = ml.createSector({
  center: [-0.38, 39.47],
  radius: 8_000,
  startAngle: 0,
  endAngle: Math.PI / 3,
});

features.update((prev) => [...prev, ellipse, sector]);
```

**Expected**: a rotated ellipse around Barcelona and a 60° sector north of Valencia.

### Scenario B-2 — Range ring (donut)

```ts
const donut = ml.createDonut({
  center: [-5.99, 37.39], // Sevilla
  innerRadius: 5_000,
  outerRadius: 10_000,
});

features.update((prev) => [...prev, donut]);
```

**Expected**: an annular band 5–10 km from Sevilla. The 0–5 km core is empty (the underlying basemap shows through).

### Scenario C — Pre-load `milsymbol` to avoid first-call latency

```ts
ngOnInit() {
  this.ml.preloadMilsymbol(); // fire-and-forget
}
```

**Expected**: the first `createMilSymbol` call is synchronous (well, still async by signature, but the Promise resolves on next tick).

### Scenario D — Sync API after preload

```ts
await this.ml.preloadMilsymbol();
const f = this.ml.createMilSymbolSync({ sidc: '...', position: [...] });
```

**Expected**: returns synchronously. If called before preload completes, throws.

## 4. Acceptance criteria

A reviewer should be able to verify each of these:

1. `cd packages/openlayers && npm test -- --run` → ≥ 93 + ~12 new tests, all green.
2. `cd packages/openlayers && npm run build` → clean build of all 6 entry points (`core`, `layers`, `controls`, `interactions`, `overlays`, `military`).
3. `npm run format:check && npm run lint` → clean, no new warnings.
4. Open `/demo/openlayers` in a browser; click ➕ Symbol → a NATO icon appears on Madrid. Click ➕ Ellipse / ➕ Sector / ➕ Donut → polygons appear on Barcelona / Valencia / Sevilla respectively. Toggle the `military` layer in the layer switcher → all four disappear/reappear.
5. Inspect `dist/openlayers/military/fesm2022/*.mjs` → ≤ 5 KB minified (the `milsymbol` library lives in a separate chunk).
6. Browser DevTools Network tab on first `createMilSymbol` call → a separate JS chunk for `milsymbol` is fetched.
7. Calling `createMilSymbolSync` before `preloadMilsymbol`/first `createMilSymbol` resolves → throws with the documented message.
8. New unit test file `military.service.spec.ts` exists and asserts: ellipse vertex count + axis lengths, sector arc closure + included angle, donut two-ring structure + opposite winding (signed area sign-flip between rings) + radii, `createMilSymbol` icon URL shape + caching of the loader, sync API throws-then-works flow.
9. New section in `packages/openlayers/README.md` titled "Military symbology" with examples for all four helpers (ellipse, sector, donut, mil-symbol).
10. New blog post `public/content/blog/openlayers-military.md` registered as the latest post in `posts.data.ts`.
11. `packages/openlayers/package.json` version is `0.4.0` and lists `milsymbol` under `optionalPeerDependencies` (or `peerDependenciesMeta` with `optional: true`).
12. SDD documents archived under `.sdd/.archive/openlayers-military/` after merge.

## 5. Technical constraints

- Angular ≥ 21, TypeScript strict, OnPush, signals-first (matching the rest of the package).
- Output entry point is `Angular Package Format` via `ng-packagr`, no change to existing build setup.
- `milsymbol` declared as `peerDependenciesMeta: { milsymbol: { optional: true } }` so consumers without it can still build the package; clear runtime error if they call `createMilSymbol` without it installed.
- No global side effects on import. The dynamic `import('milsymbol')` happens only inside service methods.
- No tooling changes (Vitest, oxlint, ng-packagr versions stay).

## 6. Edge cases & assumptions

- **Ellipse with `semiMajor === semiMinor`** → degenerates to a circle; supported, no special path needed.
- **Sector with `endAngle - startAngle === 2π`** → full circle; allowed (capped at `2π`).
- **Sector spanning across 2π boundary** (e.g., `startAngle = 7π/4, endAngle = 9π/4`) → caller is responsible for normalizing; we accept any `endAngle > startAngle` ≤ `start + 2π`.
- **Donut with `outerRadius` only marginally larger than `innerRadius`** (e.g., a 1 m band) → supported; renderers may have AA artifacts but math is correct.
- **Donut winding correctness** → verified by computing the signed shoelace area of each ring: outer must be > 0 (CCW), inner must be < 0 (CW). Asserted in tests.
- **Very large radii (>200 km) at high latitudes** — small-area approximation distorts; documented in JSDoc with a note pointing to Phase 3.
- **`milsymbol` 2.x types** — if `@types/milsymbol` doesn't ship adequate types, declare a minimal ambient module in `military/src/types/milsymbol.d.ts` covering only the constructor, `asSVG()`, `getSize()`, `getAnchor()`. Avoid importing all of milsymbol's surface.
- **Multiple service instances** — each has its own loader Promise. Acceptable; calls are cheap after first resolution. If this becomes a problem, lift the loader to a module-level cache.
- **`btoa` Unicode safety** — use `btoa(unescape(encodeURIComponent(svg)))` to handle non-ASCII in symbol labels safely. Document.
- **Test environment** — same Vitest + Analog combo as the rest of the package. Mock `milsymbol` via Vitest's `vi.mock('milsymbol', ...)` to avoid loading the real library in tests; assert the loader is called the expected number of times.

## 7. Implementation phases (preview)

For traceability — full task breakdown is out of scope for this spec and lives in `tasks-openlayers-military.md` (created in the implementation phase, not this approval gate). Rough order of operations:

1. SDD docs (this PR) + branch
2. Install `milsymbol` (regular dep for the demo + optionalPeer for consumers)
3. Type model: extend `MilSymbolConfig`, add `MilSymbolStyleResult`
4. Implement `createEllipse` + `createSector` (pure math, fully unit-tested first)
5. Implement `createMilSymbol` + `createMilSymbolSync` + `preloadMilsymbol` with mocked tests
6. Vector layer style resolver: icon path + tests
7. Demo wiring + Playwright smoke
8. README + blog post
9. Version bump to 0.4.0
10. PR + CI green + merge + archive
