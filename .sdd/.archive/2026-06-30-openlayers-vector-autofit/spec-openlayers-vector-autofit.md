# Spec: OpenLayers Package — Auto-Fitting Vector Layers (`autoFit`)

**Linked change**: `openlayers-vector-autofit`  
**Target package**: `@angular-helpers/openlayers`  
**Source branch**: `feature/openlayers-vector-autofit`

---

## 1. Introduction & Goal

When working with vector data in maps, a common requirement is to automatically adjust the map's view (center and zoom level) to show all features on the layer. Currently, developers must manually retrieve the map view, query the layer source extent, and trigger the fit animation.

This specification introduces a declarative `autoFit` feature for `OlVectorLayerComponent`. By enabling `autoFit`, the layer automatically adjusts the map view to encompass its features during initialization, after remote data is loaded, and when features are reactively updated.

---

## 2. Functional Requirements

### FR-1 — Declarative `autoFit` Input & Config Type

The `OlVectorLayerComponent` **MUST** expose an `autoFit` input that accepts either a boolean or configuration options for the fit animation.

1. **Input Signature**:
   ```typescript
   autoFit = input<boolean | AutoFitOptions>(false);
   ```
2. **Configuration Interface (`AutoFitOptions`)**:
   ```typescript
   export interface AutoFitOptions {
     padding?: number[];
     duration?: number;
   }
   ```
3. **Configuration Extensibility**:
   - The `VectorLayerConfig` interface **MUST** be updated to include the `autoFit` property:
     ```typescript
     export interface VectorLayerConfig extends LayerConfig {
       // ... existing properties
       autoFit?: boolean | AutoFitOptions;
     }
     ```

---

### FR-2 — Auto-Fitting Logic in `OlLayerService`

The `OlLayerService` **MUST** implement the core logic for computing the layer extent and fitting the map view.

1. **Method Signature**:
   ```typescript
   fitToLayer(id: string, options?: AutoFitOptions): void
   ```
2. **Map and Layer Retrieval**:
   - Retrieve the map instance using `this.mapService.getMap()`.
   - Retrieve the layer instance from the internal layer cache. If the layer is not found or is not a vector/heatmap layer, the method **MUST** return early.
3. **Source Extraction & Clustering Handling**:
   - Retrieve the source from the layer.
   - If the source is an instance of OpenLayers `ClusterSource`, the method **MUST** extract the underlying `VectorSource` by calling `source.getSource()`.
4. **Extent Retrieval & Validation**:
   - Retrieve the source's extent using `source.getExtent()`.
   - Validate the extent before fitting. An extent is valid if and only if:
     - It contains exactly 4 elements.
     - Every element in the extent is a finite number (i.e., `isFinite(extent[i])` is true for `i = 0..3`).
     - It is not the default empty extent `[Infinity, Infinity, -Infinity, -Infinity]`.
5. **Zone-Aware View Fitting**:
   - If the extent is valid, retrieve the map view using `map.getView()`.
   - The call to `view.fit(extent, fitOptions)` **MUST** be wrapped in `this.zoneHelper.runOutsideAngular` to prevent triggering Angular change detection.
   - Apply options (`padding`, `duration`) if provided. If `autoFit` was passed as `true`, default options (no padding, no duration/instant fit) are used.

---

### FR-3 — Event-Driven Fit on Remote Source Loading (`featuresloadend`)

When a vector layer is configured with a remote URL, features are loaded asynchronously. The map view **MUST** fit to the features once they are fully loaded.

1. **Initialization Listener**:
   - During layer initialization in `OlVectorLayerComponent`, if `autoFit` is enabled (truthy):
     - The component **MUST** obtain the created source from the service or listen to the source's `'featuresloadend'` event.
     - Alternatively, the component can register a listener on the source when it is created.
2. **Execution**:
   - Upon the `'featuresloadend'` event, the component **MUST** call `layerService.fitToLayer(id, options)` where `options` matches the parsed `autoFit` input.

---

### FR-4 — Fit on Reactive Feature Changes

When the `features` input of `OlVectorLayerComponent` is updated reactively, the map view **MUST** fit to the new features.

1. **Reactive Effect Integration**:
   - Inside the feature synchronization `effect()` in `OlVectorLayerComponent`:
     - If the features are updated and `autoFit` is enabled:
       - The component **MUST** schedule a call to `layerService.fitToLayer(id, options)`.
       - This call **MUST** be deferred using a microtask (e.g., `Promise.resolve().then(...)`) or `setTimeout(..., 0)` to ensure OpenLayers has fully added and processed the features in the source before the extent is calculated.

---

## 3. Scenarios (Given/When/Then)

### Scenario 1 — Static Features Auto-Fit (Happy Path)

- **Given** a map containing an `<ol-vector-layer>` with `[features]="staticFeatures"` and `[autoFit]="true"`
- **When** the map and layer are initialized
- **Then** the component detects `autoFit` is enabled
- **And** `OlLayerService.fitToLayer` is called
- **And** the map view fits the extent of `staticFeatures` immediately without animation.

### Scenario 2 — Remote URL Features Auto-Fit (Happy Path)

- **Given** a map containing an `<ol-vector-layer>` with `[url]="'assets/data.json'"` and `[autoFit]="{ padding: [20, 20, 20, 20], duration: 300 }"`
- **When** the remote features finish loading and the `'featuresloadend'` event is fired by the source
- **Then** `OlLayerService.fitToLayer` is called with the padding and duration options
- **And** the map view smoothly animates over 300ms to fit the loaded features with a 20px padding.

### Scenario 3 — Reactive Feature Updates (Happy Path)

- **Given** an initialized `<ol-vector-layer>` with `[features]="dynamicFeatures()"` and `[autoFit]="true"`
- **When** the `dynamicFeatures` signal is updated with a new set of features
- **Then** the feature sync effect updates the source features
- **And** a deferred microtask triggers `OlLayerService.fitToLayer`
- **And** the map view adjusts to the new extent of the updated features.

### Scenario 4 — Empty Source Extent (Edge Case)

- **Given** an `<ol-vector-layer>` with no features and `[autoFit]="true"`
- **When** the layer is initialized
- **Then** the source extent is retrieved as `[Infinity, Infinity, -Infinity, -Infinity]`
- **And** `OlLayerService.fitToLayer` validates the extent as invalid (non-finite)
- **And** the method returns early without calling `view.fit` or throwing any errors.

### Scenario 5 — Clustered Source Auto-Fit (Edge Case)

- **Given** an `<ol-vector-layer>` configured with `[cluster]="{ enabled: true }"` and `[autoFit]="true"`
- **When** features are loaded or updated
- **Then** `OlLayerService.fitToLayer` detects that the layer's source is a `ClusterSource`
- **And** it extracts the underlying `VectorSource` via `source.getSource()`
- **And** it calculates the extent of the underlying features
- **And** it fits the map view to that extent.

### Scenario 6 — Layer/Map Destroyed Mid-Process (Edge Case)

- **Given** an `<ol-vector-layer>` with a remote URL and `[autoFit]="true"`
- **When** the component is destroyed before the remote features finish loading
- **Then** the source and layer are disposed
- **And** when the asynchronous load event or deferred microtask executes, `OlLayerService.fitToLayer` detects the layer or map is missing
- **And** the method returns early without throwing errors.

---

## 4. Non-Functional Requirements

### NFR-1 — Performance & Change Detection

- All calls to `view.fit()` **MUST** run outside the Angular zone using `OlZoneHelper.runOutsideAngular` to prevent triggering global Angular change detection cycles during map panning/zooming.

### NFR-2 — Memory Leak Prevention

- Any event listeners registered on the OpenLayers source (such as `'featuresloadend'`) **MUST** be cleaned up. Since the source is disposed of when the layer is removed/updated, standard OpenLayers disposal handles listener cleanup, but care must be taken to avoid retaining references in closures.

---

## 5. Acceptance Criteria Summary

| ID       | Description                   | Verification Method                                                                                                          |
| -------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **AC-1** | Declarative input type safety | Verify that `OlVectorLayerComponent` compiles with `autoFit` input supporting `boolean` and `AutoFitOptions`.                |
| **AC-2** | Extent validation             | Unit test verifying that `fitToLayer` does not call `view.fit` when the source is empty (returns `[Infinity, ...]` extent).  |
| **AC-3** | Clustered source support      | Unit test verifying that `fitToLayer` successfully retrieves the underlying source from a `ClusterSource` and fits the view. |
| **AC-4** | Remote source auto-fit        | Unit test / Integration test verifying that `featuresloadend` triggers `fitToLayer`.                                         |
| **AC-5** | Reactive features auto-fit    | Unit test verifying that updating the `features` signal triggers `fitToLayer` in a deferred manner.                          |
| **AC-6** | Zoneless execution            | Verify using spy/mock that `view.fit` is called within the context of `runOutsideAngular`.                                   |
| **AC-7** | No regressions                | All existing tests in `@angular-helpers/openlayers` continue to pass.                                                        |
