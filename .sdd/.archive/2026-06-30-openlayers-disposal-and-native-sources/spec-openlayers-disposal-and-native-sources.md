# Spec: OpenLayers Component Disposal & Native Sources Refactoring

**Linked Proposal**: `.sdd/explore-openlayers-disposal-and-native-sources.md`  
**Target Package**: `@angular-helpers/openlayers`  
**Artifact Store Mode**: Hybrid

---

## 1. Functional Requirements

### FR-1: Explicit Source Disposal on Re-configuration

When a vector layer's configuration is updated via `OlLayerService.updateVectorLayerConfig`, the service **MUST** explicitly clear and dispose of the old `Source` instance before assigning the new one to the layer.

- If the old source is a `ClusterSource`, the service **MUST** clear and dispose of both the `ClusterSource` and its underlying `VectorSource`.
- If the old source is a standard `VectorSource`, the service **MUST** clear and dispose of it.
- Clearing the source **MUST** use `.clear(true)` to ensure fast and complete reference removal.

### FR-2: Standalone Layer Component Disposal

All layer components **MUST** dispose of their internal OpenLayers `Source` and `Layer` instances when the component is destroyed.

- **`OlVectorLayerComponent`**: Its destruction delegates to `OlLayerService.removeLayer()`, which **MUST** be updated to verify that the layer and all its sources (including nested cluster sources) are cleared and disposed of.
- **`OlWebGLTileLayerComponent`**: **MUST** keep a reference to the instantiated `tileSource` (whether `OSM`, `XYZ`, or `VectorTileSource`) and explicitly call `.dispose()` on it, along with calling `.dispose()` on the `WebGLTileLayer` or `WebGLVectorTileLayer` instance inside the `DestroyRef.onDestroy` hook.
- **`OlWebGLVectorLayerComponent`**: **MUST** explicitly call `.clear(true)` and `.dispose()` on its internal `vectorSource` (`VectorSource`), and `.dispose()` on the `WebGLVectorLayer` instance inside the `DestroyRef.onDestroy` hook.

### FR-3: Declarative Popup Overlay Disposal

`OlPopupComponent` **MUST** call `.dispose()` on the OpenLayers `Overlay` instance when destroyed.

- In `DestroyRef.onDestroy`, the component **MUST** remove the overlay from the map (if it was visible) and call `.dispose()` on the `Overlay` instance to clean up event listeners and prevent keeping the host DOM element detached in memory.

### FR-4: UI Map Control Disposal

All Map Control components (Attribution, Fullscreen, Rotate, ScaleLine, Zoom) **MUST** call `.dispose()` on their respective OpenLayers `Control` instances when destroyed.

- In their `DestroyRef.onDestroy` hooks, they **MUST** remove the control from the map and call `.dispose()` on the `Control` instance.

### FR-5: Outside-Angular Disposal

All disposal, clearing, and removal operations **MUST** run outside the Angular zone when possible.

- The components and services **MUST** use `OlZoneHelper.runOutsideAngular` to execute `.clear(true)`, `.dispose()`, `map.removeLayer()`, `map.removeOverlay()`, and `map.removeControl()`.

### FR-6: Flexible Format Input

The `format` input on `OlVectorLayerComponent` and the `format` property in `VectorLayerConfig` **MUST** accept either a string shorthand (`'geojson' | 'topojson' | 'kml'`) or a native OpenLayers `FeatureFormat` instance (imported from `ol/format/Feature`).

- `OlLayerService.createVectorSource` **MUST** check if the provided `format` is an instance of `FeatureFormat`. If so, it **MUST** use it directly. Otherwise, it resolves the string shorthand to the corresponding format class (`GeoJSON`, `TopoJSON`, or `KML`).

### FR-7: Zoneless Source Instantiation

`OlLayerService` **MUST** instantiate all sources and layers outside the Angular zone.

- The service **MUST** wrap the creation of sources (e.g. `VectorSource`, `ClusterSource`, `TileSource`, `ImageSource`) and layers, as well as their addition to the map, inside `OlZoneHelper.runOutsideAngular`.
- This ensures that any asynchronous network requests (e.g., fetching a remote URL configured on a `VectorSource`) and subsequent parsing of features happen entirely outside the Angular zone, preventing unnecessary change detection cycles.

### FR-8: Optional Features Input

The `features` input on `OlVectorLayerComponent` **MUST** be optional and default to `undefined`.

- Type signature: `features = input<Feature[] | undefined>(undefined);`

### FR-9: Non-destructive Feature Synchronization

The feature synchronization effect in `OlVectorLayerComponent` **MUST NOT** clear the layer's source if `url` is configured and `features` is not explicitly provided (is `undefined`).

- If `features()` is `undefined` and `url()` is configured, the effect **MUST** skip calling `layerService.updateFeatures()`.
- If `features()` is explicitly provided (even if it is an empty array `[]`), and no `url` is configured, or if the user wants to override the URL features, the effect **MUST** synchronize the features.

---

## 2. Non-Functional Requirements

### NFR-1: Zero Memory Leaks

- Memory heap profiles after repeatedly creating and destroying maps, layers, controls, and popups **MUST** show zero growth in detached OpenLayers-related objects (`Map`, `Layer`, `Source`, `Overlay`, `Control`).

### NFR-2: Zero Change Detection Overhead on Native Loads

- Loading a vector layer via a remote `url` **MUST** trigger exactly `0` Angular change detection cycles during the HTTP fetch and GeoJSON/KML parsing phases.

### NFR-3: Complete Zoneless Compatibility

- All interactions, rendering, and lifecycle updates within the OpenLayers package **MUST** remain compatible with Zoneless Angular applications.

---

## 3. Scenarios

### Scenario 1: Re-configuring Vector Layer Source (Happy Path)

- **Given** a vector layer with ID `"vector-layer-1"` already added to the map using a `VectorSource`.
- **When** `OlLayerService.updateVectorLayerConfig` is called with a new configuration (e.g. new URL or format).
- **Then** the service must retrieve the old `VectorSource`.
- **And** call `.clear(true)` and `.dispose()` on it outside the Angular zone.
- **And** instantiate the new `VectorSource` outside the Angular zone.
- **And** associate the new source with the layer using `layer.setSource()`.

### Scenario 2: WebGL Layer Component Destruction (Happy Path)

- **Given** an `<ol-webgl-tile-layer>` component initialized with an `XYZ` source.
- **When** the component is destroyed by Angular.
- **Then** the `DestroyRef.onDestroy` hook must trigger outside the Angular zone.
- **And** remove the layer from the map.
- **And** call `.dispose()` on the `XYZ` source instance.
- **And** call `.dispose()` on the `WebGLTileLayer` instance.

### Scenario 3: Popup Component Destruction (Happy Path)

- **Given** an `<ol-popup>` component currently showing an active overlay on the map.
- **When** the component is destroyed.
- **Then** the `DestroyRef.onDestroy` hook must run outside the Angular zone.
- **And** remove the overlay from the map.
- **And** call `.dispose()` on the `Overlay` instance.

### Scenario 4: Map Control Component Destruction (Happy Path)

- **Given** an `<ol-zoom-control>` component currently active on the map.
- **When** the component is destroyed.
- **Then** the `DestroyRef.onDestroy` hook must run outside the Angular zone.
- **And** remove the control from the map.
- **And** call `.dispose()` on the `Zoom` control instance.

### Scenario 5: Native FeatureFormat Instance Support (Happy Path)

- **Given** a custom `FeatureFormat` instance (e.g. `new GPX()`).
- **When** passing this instance to the `[format]` input of `<ol-vector-layer>`.
- **Then** `OlLayerService.createVectorSource` must detect that the format is an instance of `FeatureFormat`.
- **And** pass it directly to the `VectorSource` options without attempting to map it as a string shorthand.

### Scenario 6: Feature Synchronization with URL and Undefined Features (Edge Case)

- **Given** an `<ol-vector-layer>` component configured with `[url]="'https://example.com/data.json'"` and `[format]="'geojson'"`.
- **And** the `[features]` input is not bound (defaults to `undefined`).
- **When** the component is initialized and the feature synchronization effect runs.
- **Then** the effect must detect that `features` is `undefined` and `url` is present.
- **And** it must NOT call `updateFeatures` or clear the source.
- **And** OpenLayers must be allowed to fetch and parse the features from the URL natively.

### Scenario 7: Feature Synchronization with URL and Explicit Empty Features (Edge Case)

- **Given** an `<ol-vector-layer>` component configured with `[url]="'https://example.com/data.json'"` and `[format]="'geojson'"`.
- **And** the `[features]` input is explicitly bound to an empty array `[]`.
- **When** the component is initialized and the feature synchronization effect runs.
- **Then** the effect must synchronize the features.
- **And** call `updateFeatures` with `[]`.

---

## 4. Acceptance Criteria Summary

| ID       | Description                                                    | Verification                                                                                                                  |
| :------- | :------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| **AC-1** | Old sources are disposed of on config updates                  | Unit test verifying `dispose` is called on the old source when `updateVectorLayerConfig` is invoked with a new configuration. |
| **AC-2** | WebGL layers and sources are disposed of on destroy            | Unit tests verifying that `DestroyRef.onDestroy` calls `dispose` on both the layer and its source.                            |
| **AC-3** | Popup overlay is disposed of on destroy                        | Unit test verifying that `DestroyRef.onDestroy` calls `dispose` on the `Overlay` instance.                                    |
| **AC-4** | Map controls are disposed of on destroy                        | Unit tests verifying that `DestroyRef.onDestroy` calls `dispose` on the `Control` instance for all control components.        |
| **AC-5** | Operations run outside the Angular zone                        | Spies on `NgZone.runOutsideAngular` or `OlZoneHelper.runOutsideAngular` showing they wrap instantiation and disposal.         |
| **AC-6** | Native `FeatureFormat` instances are accepted                  | Unit test passing a native `GPX` or `GeoJSON` instance to `format` input and verifying it is configured correctly.            |
| **AC-7** | `features` defaults to `undefined` and does not clear URL data | Unit test verifying that if `url` is configured and `features` is `undefined`, the source is not cleared.                     |

---

## 5. Technical Constraints & Types

### Updated Types in `layer.types.ts`

```typescript
import FeatureFormat from 'ol/format/Feature';

export interface VectorLayerConfig extends LayerConfig {
  type: 'vector';
  features?: Feature[];
  url?: string;
  format?: 'geojson' | 'topojson' | 'kml' | FeatureFormat; // Updated
  style?: Style | ((feature: Feature) => Style);
  cluster?: ClusterConfig;
  coordinateProjection?: string;
}
```

### Updated Component Input in `OlVectorLayerComponent`

```typescript
import FeatureFormat from 'ol/format/Feature';

// ...
features = input<Feature[] | undefined>(undefined); // Updated
format = input<'geojson' | 'topojson' | 'kml' | FeatureFormat>(); // Updated
```
