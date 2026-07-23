## Exploration: openlayers-vector-url-source

### Current State

1. **OlVectorLayerComponent:**
   - Exposes `url`, `format`, and `coordinateProjection` inputs.
   - Delegates source creation to `OlLayerService.createVectorSource()`, which configures a `VectorSource` with `url` and `format` properties.
   - Automatically supports formats like `'geojson'`, `'topojson'`, `'kml'`, and native `FeatureFormat` instances.
   - Uses an `effect` to reactively update the source when these inputs change by calling `OlLayerService.updateVectorLayerConfig()`.
   - Supports declarative auto-fitting (`autoFit` input) by listening to the `'featuresloadend'` event on the source if a URL is provided, or fitting immediately if static features are used.

2. **OlWebGLVectorLayerComponent:**
   - Exposes standard layer inputs (`id`, `features`, `flatStyle`, `zIndex`, `opacity`, `visible`, `variables`, `disableHitDetection`).
   - Lacks `url`, `format`, and `coordinateProjection` inputs.
   - Hardcodes a static `VectorSource` (`new VectorSource()`).
   - Features must be passed as a client-side array (`Feature[]`) and mapped to `ol/Feature` objects on the main thread via `fromLonLat` in a reactive effect, which is highly inefficient for large datasets.
   - Does not register with `OlLayerService` cache or state, rendering and managing the layer lifecycle autonomously directly via `map.addLayer()` inside `afterNextRender()`.

### Affected Areas

- [packages/openlayers/layers/src/features/webgl-vector-layer.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/webgl-vector-layer.component.ts) — Add `url`, `format`, `coordinateProjection`, and `autoFit` inputs; implement reactive source re-creation and feature mapping updates.
- [packages/openlayers/layers/src/services/layer.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/services/layer.service.ts) — Resolve the `coordinateProjection` mapping gap by passing the `dataProjection` option to format constructors.
- [packages/openlayers/layers/src/features/webgl-layer.components.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/webgl-layer.components.spec.ts) — Add unit tests for `OlWebGLVectorLayerComponent` to cover remote data loading, format handling, `coordinateProjection` mapping, and reactive source update/disposal.
- [packages/openlayers/layers/src/services/layer.service.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/services/layer.service.spec.ts) — Add unit tests verifying `coordinateProjection` configuration on formats in `createVectorSource()`.

### Approaches

#### 1. Implementing Native URL/Format Decoding in `OlWebGLVectorLayerComponent`

- **Approach A: Component-Managed Source Lifecycle (RECOMMENDED)**
  - Replicate `createVectorSource` logic inside `OlWebGLVectorLayerComponent`. Reactively manage source creation, updates, and disposal inside the component via an Angular `effect` listening to `url`, `format`, and `coordinateProjection` changes. Maintain coordinate projection transformation in the client-side feature mapper by transforming coordinates based on the component's `coordinateProjection` and the map's current view projection instead of hardcoding `fromLonLat`.
  - _Pros:_ Maintains self-contained, clean component logic. WebGL vector layers have totally different configuration properties (`flatStyle`, dynamic `variables`, etc.) and do not support features like clustering or spiderfication, so keeping them independent of `OlLayerService` is cleaner.
  - _Cons:_ Duplicates source instantiation code (unless shared or utility functions are used).
  - _Effort:_ Medium

- **Approach B: Refactoring `OlLayerService` to Support WebGL Vector Layers**
  - Modify `OlLayerService` to recognize a new `'webgl-vector'` layer type and register it in `layerCache` and `layerState`.
  - _Pros:_ Consolidates all layer creations into a single service.
  - _Cons:_ Bloats `OlLayerService` with complex logic for managing WebGL-specific properties (`flatStyle`, shader variables, webgl disposal methods) which are radically different from standard layers.
  - _Effort:_ High

#### 2. Resolving the `coordinateProjection` Gap in `OlVectorLayerComponent`

- **Approach A: Configure Format Constructors with `dataProjection` (RECOMMENDED)**
  - In `OlLayerService.createVectorSource()`, instantiate formats with the projection passed to the component: `new GeoJSON({ dataProjection: config.coordinateProjection })`.
  - _Pros:_ Fully resolves the projection transformation gap for remote files, aligning with the expected behavior of `coordinateProjection`.
  - _Cons:_ None.
  - _Effort:_ Low

- **Approach B: Overriding the Source Loader Function**
  - Implement a custom remote loader function that manually fetches, reads, and reprojects the coordinates during parsing.
  - _Pros:_ Highly customizable fetch phase.
  - _Cons:_ Bypasses OpenLayers' internal optimizations, adding unnecessary complexity.
  - _Effort:_ Medium

### Recommendation

1. **OlWebGLVectorLayerComponent:** Implement **Approach A (Component-Managed Source Lifecycle)**. Add inputs for `url`, `format`, `coordinateProjection`, and `autoFit`. Recreate the `VectorSource` reactively, set it on the WebGL layer, and dispose of the old source properly to prevent WebGL memory leaks. Update feature mapping to support non-geographic static features by querying map view projection and reprojecting dynamically.
2. **OlVectorLayerComponent's URL/Format Gaps:** Implement **Approach A (Configure Format Constructors with `dataProjection`)** in `OlLayerService.createVectorSource()`. This ensures that remote datasets in arbitrary projections are correctly parsed and reprojected.

### Risks

- **Memory Leaks during Source Updates:** Re-creating `VectorSource` on input changes could cause WebGL resource leaks if old sources are not cleaned up properly.
  - _Mitigation:_ Ensure `oldSource.clear(true)` and `oldSource.dispose()` are called whenever a source is replaced.
- **Race Conditions with Concurrent Inputs:** If a user configures both `url` and `features`, they could collide.
  - _Mitigation:_ Match `OlVectorLayerComponent` behavior: if `features` is `undefined`, remote URL loading takes precedence; if `features` is defined (even as an empty array), it overrides remote loading.

### Ready for Proposal

Yes
