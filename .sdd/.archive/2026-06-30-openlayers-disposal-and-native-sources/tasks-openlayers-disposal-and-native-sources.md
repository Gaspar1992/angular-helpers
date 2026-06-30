# Task Breakdown: OpenLayers Component Disposal & Native Sources Refactoring

This document outlines the specific, actionable, and verifiable tasks required to implement the OpenLayers component disposal and native sources refactoring, based on the design in [design-openlayers-disposal-and-native-sources.md](file:///home/gasparrv92/Repositorios/angular-helpers/.sdd/design-openlayers-disposal-and-native-sources.md).

## Review Workload Forecast

- **Estimated changed lines**: 250-350 lines of code.
- **400-line budget risk**: Low.
- **Chained PRs recommended**: No.
- **Delivery strategy**: single-pr.
- **Decision needed before apply**: No.

### Parser Directives

```
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low
```

---

## Tasks

### Phase 1: Types & Component Inputs

- [x] **Task 1.1: Update Layer Config Types**
  - File: [layer.types.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/models/layer.types.ts)
  - Import `FeatureFormat` from `ol/format/Feature`.
  - Update `VectorLayerConfig` interface's `format` property to allow `FeatureFormat` in addition to the string shorthands (`'geojson' | 'topojson' | 'kml' | FeatureFormat`).
  - _Verification_: The TypeScript compiler accepts `FeatureFormat` instances in vector layer configuration objects.

- [x] **Task 1.2: Update Vector Layer Component Inputs**
  - File: [vector-layer.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/vector-layer.component.ts)
  - Import `FeatureFormat` from `ol/format/Feature`.
  - Change `features` input to be optional and default to `undefined`: `features = input<Feature[] | undefined>(undefined);`.
  - Update `format` input type to accept `FeatureFormat`: `format = input<'geojson' | 'topojson' | 'kml' | FeatureFormat>();`.
  - _Verification_: The component compiles with the updated inputs.

---

## Phase 2: Disposal & Memory Leak Prevention (Service & Layers)

- [x] **Task 2.1: Update Layer Service for Safe Disposal and Zone Isolation**
  - File: [layer.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/services/layer.service.ts)
  - Inject `OlZoneHelper` via `inject(OlZoneHelper)`.
  - In `createLayer()`, wrap all layer and source creation/addition logic inside `this.zoneHelper.runOutsideAngular`.
  - In `removeLayer(id)`:
    - Wrap the entire removal and disposal logic inside `runOutsideAngular`.
    - Retrieve the source from the layer. If the source is a cluster source (i.e., has an underlying source), call `.clear(true)` and `.dispose()` on the underlying source.
    - Call `.clear(true)` and `.dispose()` on the main source.
    - Call `.dispose()` on the layer itself.
  - In `updateVectorLayerConfig(id, config)`:
    - Wrap the creation of `nextSource` and any `ClusterSource` in `runOutsideAngular`.
    - Wrap the disposal of `oldSource` (including any underlying source if it was clustered) in `runOutsideAngular`.
    - Ensure `.clear(true)` and `.dispose()` are called on the old source and its underlying source.
  - _Verification_: Verify via unit tests that all sources and layers are cleared and disposed of when layers are removed or reconfigured.

- [x] **Task 2.2: Implement Disposal in WebGL Tile Layer Component**
  - File: [webgl-tile-layer.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/webgl-tile-layer.component.ts)
  - Inject `OlZoneHelper`.
  - Add a private field `private sourceInstance: any = null;` to hold the reference to the created tile source.
  - Set `this.sourceInstance = tileSource;` inside the `afterNextRender` block where the source is instantiated.
  - In `destroyRef.onDestroy`, wrap the cleanup in `runOutsideAngular`:
    - Remove the layer from the map: `map.removeLayer(this.layer)`.
    - Call `dispose()` on `this.sourceInstance` (if it exists and has a dispose method).
    - Call `dispose()` on `this.layer` (if it exists).
  - _Verification_: The WebGL Tile Layer component compiles and cleans up resources on destroy.

- [x] **Task 2.3: Implement Disposal in WebGL Vector Layer Component**
  - File: [webgl-vector-layer.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/webgl-vector-layer.component.ts)
  - Inject `OlZoneHelper`.
  - In `destroyRef.onDestroy`, wrap the cleanup in `runOutsideAngular`:
    - Remove the layer from the map: `map.removeLayer(this.layer)`.
    - Call `clear(true)` and `dispose()` on `this.vectorSource`.
    - Call `dispose()` on `this.layer` (wrapping it in a `try/catch` block to safely ignore any WebGL-specific disposal errors).
  - _Verification_: The WebGL Vector Layer component compiles and cleans up resources on destroy.

---

## Phase 3: Disposal & Memory Leak Prevention (Overlays & Controls)

- [x] **Task 3.1: Implement Disposal in Popup Component**
  - File: [popup.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/overlays/src/features/popup.component.ts)
  - In the `dispose()` method, ensure the overlay is explicitly disposed:
    - Wrap the removal and disposal in `this.zoneHelper.runOutsideAngular`.
    - Call `overlay.dispose()` on the `Overlay` instance.
    - _Verification_: Unit tests confirm `overlay.dispose()` is called when the popup is destroyed.

- [x] **Task 3.2: Implement Disposal in Standard Control Components**
  - Files:
    - [attribution-control.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/controls/src/features/attribution-control.component.ts)
    - [fullscreen-control.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/controls/src/features/fullscreen-control.component.ts)
    - [rotate-control.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/controls/src/features/rotate-control.component.ts)
    - [scale-line-control.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/controls/src/features/scale-line-control.component.ts)
    - [zoom-control.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/controls/src/features/zoom-control.component.ts)
  - In `destroyRef.onDestroy`, wrap the control cleanup in `runOutsideAngular`:
    - Remove the control from the map: `map.removeControl(this.control)`.
    - Call `this.control.dispose()` on the `Control` instance.
  - _Verification_: All standard control components compile and dispose of their native control instances on destroy.

- [x] **Task 3.3: Implement Disposal in Geolocation Control Component**
  - File: [geolocation-control.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/controls/src/features/geolocation-control.component.ts)
  - In `destroyRef.onDestroy`, wrap the comprehensive cleanup in `runOutsideAngular`:
    - Remove the control from the map: `map.removeControl(this.control)`.
    - Remove the tracking layer from the map: `map.removeLayer(this.layer)`.
    - Turn off tracking and dispose of the geolocation object: `this.geolocation.setTracking(false)` and `this.geolocation.dispose()`.
    - Clear and dispose of the tracking layer's source: `source.clear(true)` and `source.dispose()`.
    - Dispose of the tracking layer: `this.layer.dispose()`.
    - Dispose of the control: `this.control.dispose()`.
  - _Verification_: The Geolocation control component compiles and disposes of all internal OpenLayers resources on destroy.

---

## Phase 4: Native URL & Format Support

- [x] **Task 4.1: Support Native FeatureFormat in Layer Service**
  - File: [layer.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/services/layer.service.ts)
  - In `createVectorSource(config, map)`:
    - Check if `config.format` is an instance of `FeatureFormat` (`config.format instanceof FeatureFormat`).
    - If it is, assign it directly to `sourceOptions.format`.
    - Otherwise, keep the existing string shorthand mapping (`'geojson'`, `'topojson'`, `'kml'`).
  - _Verification_: The service correctly assigns native `FeatureFormat` instances to the `VectorSource` options.

- [x] **Task 4.2: Implement Non-Destructive Feature Synchronization**
  - File: [vector-layer.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/vector-layer.component.ts)
  - In the features synchronization `effect`:
    - Add a guard: if `currentFeatures === undefined` and `this.url()` is configured, return early and do not call `this.layerService.updateFeatures`.
  - _Verification_: If a URL is set and features is undefined, the source features are not cleared.

---

## Phase 5: Unit Testing

- [x] **Task 5.1: Write Disposal and Memory Leak Prevention Tests**
  - File: Create or update appropriate `.spec.ts` files under `packages/openlayers/`.
  - Write Vitest tests to verify:
    - `OlPopupComponent` calling `.dispose()` on its `Overlay` instance upon component destruction.
    - Each control component (`OlAttributionControlComponent`, `OlFullscreenControlComponent`, `OlRotateControlComponent`, `OlScaleLineControlComponent`, `OlZoomControlComponent`, `OlGeolocationControlComponent`) calling `.dispose()` on its native `Control` instance (and other internal resources) upon component destruction.
    - `OlWebGLTileLayerComponent` and `OlWebGLVectorLayerComponent` calling `.dispose()` on their respective layers and sources upon component destruction.
    - `OlLayerService` calling `.clear(true)` and `.dispose()` on the old source (and its nested source if clustered) during `updateVectorLayerConfig` and `removeLayer`.

- [x] **Task 5.2: Write FeatureFormat Resolution Tests**
  - Write Vitest tests in `layer.service.spec.ts` to verify:
    - Passing a custom native `FeatureFormat` instance (e.g., `new GeoJSON()` or `new KML()`) to `createVectorSource` resulting in that exact instance being used by the created `VectorSource`.
    - Passing a string shorthand (like `'geojson'`) resulting in a new `GeoJSON` instance being created and used.

- [x] **Task 5.3: Write Feature Synchronization Tests**
  - Write Vitest tests in `vector-layer.component.spec.ts` to verify:
    - If `features` is `undefined` and `url` is configured, `updateFeatures` is NOT called on the service (features are not cleared).
    - If `features` is explicitly set to `[]`, the features are synchronized and cleared.
