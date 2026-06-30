# SDD Exploration: OpenLayers Component Disposal & Native Sources

This document outlines the exploration and refactoring plan for `@angular-helpers/openlayers` to address component disposal (memory leak prevention) and native URL/format support.

---

## 1. Component Disposal Audit & Memory Leak Prevention

OpenLayers objects (maps, layers, sources, interactions, and overlays) maintain internal WebGL contexts, canvas elements, tile/image caches, and event listeners. If these are not explicitly disposed of when Angular components are destroyed, they will cause severe memory leaks and detached DOM nodes.

### 1.1. Analysis of Current Implementations

After auditing the codebase, we identified several areas where disposal is missing or incomplete:

| Component / Service                                                                                                                                                                   | Current Disposal Behavior                                                           | Memory Leak Risk                                                                                                                      |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| [OlVectorLayerComponent](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/vector-layer.component.ts)                                      | Calls `layerService.removeLayer(id)`.                                               | **Low** (delegates disposal to service).                                                                                              |
| [OlWebGLTileLayerComponent](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/webgl-tile-layer.component.ts)                               | Removes layer from map and calls `layer.dispose()`.                                 | **Medium** (created sources like `XYZ` or `VectorTileSource` are never disposed).                                                     |
| [OlWebGLVectorLayerComponent](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/webgl-vector-layer.component.ts)                           | Removes layer from map and calls `layer.dispose()`.                                 | **Medium** (the internal `VectorSource` is never disposed or cleared).                                                                |
| [OlPopupComponent](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/overlays/src/features/popup.component.ts)                                                 | Removes overlay from map.                                                           | **High** (the `Overlay` instance is never disposed, leaking event listeners and keeping the host DOM element detached but in memory). |
| **Controls** (e.g., [OlAttributionControlComponent](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/controls/src/features/attribution-control.component.ts)) | Removes control from map.                                                           | **Medium** (the `Control` instances are never disposed).                                                                              |
| [OlLayerService](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/services/layer.service.ts)                                                       | `removeLayer` disposes layer and source. `updateVectorLayerConfig` replaces source. | **High** (replacing a source via `layer.setSource()` does not dispose the old source, leading to accumulated sources in memory).      |

---

### 1.2. Proposed Disposal Refactoring Plan

#### A. Fix `OlLayerService.updateVectorLayerConfig` Source Replacement

When updating a vector layer's configuration (e.g., changing the `url` or `format`), the old source must be explicitly cleared and disposed of before setting the new one:

```typescript
// Inside updateVectorLayerConfig in layer.service.ts
const oldSource = layer.getSource();
if (oldSource) {
  if ('getSource' in oldSource && typeof (oldSource as any).getSource === 'function') {
    const underlying = (oldSource as any).getSource();
    underlying?.clear?.(true);
    underlying?.dispose?.();
  }
  oldSource.clear?.(true);
  oldSource.dispose?.();
}
```

#### B. Dispose of Sources in WebGL Components

Update the WebGL layer components to clean up their sources on destroy:

- **`OlWebGLVectorLayerComponent`**:
  ```typescript
  this.destroyRef.onDestroy(() => {
    // ... remove layer ...
    this.vectorSource.clear(true);
    this.vectorSource.dispose();
  });
  ```
- **`OlWebGLTileLayerComponent`**: Keep a reference to the created `tileSource` and dispose it:
  ```typescript
  this.destroyRef.onDestroy(() => {
    // ... remove layer ...
    this.tileSource?.dispose();
  });
  ```

#### C. Explicitly Dispose Overlays and Controls

- **`OlPopupComponent`**: Call `dispose()` on the `Overlay` instance:
  ```typescript
  private dispose(): void {
    if (!this.overlay) return;
    const overlay = this.overlay;
    this.zoneHelper.runOutsideAngular(() => {
      if (this.wasVisible && this.currentMap) {
        this.currentMap.removeOverlay(overlay);
      }
      overlay.dispose(); // CRITICAL
    });
    this.overlay = null;
    this.currentMap = null;
  }
  ```
- **Controls** (Attribution, Fullscreen, Rotate, ScaleLine, Zoom): Call `dispose()` on the control:
  ```typescript
  destroyRef.onDestroy(() => {
    if (this.control) {
      const map = this.mapService.getMap();
      if (map) this.zoneHelper.runOutsideAngular(() => map.removeControl(this.control!));
      this.control.dispose(); // CRITICAL
    }
  });
  ```

---

## 2. Native URL & Format Support

OpenLayers can fetch and parse vector data (GeoJSON, TopoJSON, KML, GPX, etc.) natively when a `url` and `format` are provided to the `VectorSource`. This is highly performant because the fetching and parsing can happen off the main thread or directly inside OpenLayers without Angular knowing.

### 2.1. Analysis of Current Issues

1. **Change Detection Overhead**: OpenLayers fetches the URL using standard XHR/fetch. If this runs inside Angular's zone, it triggers change detection cycles on every request lifecycle event, causing UI lag.
2. **Conflict with `[features]` Input**:
   In [vector-layer.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/vector-layer.component.ts), the `features` input defaults to `[]`.
   The following effect always runs on initialization:
   ```typescript
   effect(() => {
     const currentFeatures = this.features();
     if (this.layerService.getLayer(this.id())) {
       this.layerService.updateFeatures(this.id(), currentFeatures);
     }
   });
   ```
   Because `features()` is `[]`, it immediately calls `updateFeatures(id, [])` which clears any features that OpenLayers natively loaded from the `url`.
3. **Limited Format Support**: The `format` type is restricted to `'geojson' | 'topojson' | 'kml'`, preventing users from passing custom `FeatureFormat` instances (e.g., to configure custom coordinate projections or use unsupported formats like `GPX` or `MVT`).

---

### 2.2. Proposed Integration & Refactoring Plan

#### A. Expand `format` Type to Support `FeatureFormat`

Modify [layer.types.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/models/layer.types.ts) and [vector-layer.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/vector-layer.component.ts) to accept `FeatureFormat` from `ol/format/Feature`:

```typescript
import FeatureFormat from 'ol/format/Feature';

// In layer.types.ts
export interface VectorLayerConfig extends LayerConfig {
  // ...
  format?: 'geojson' | 'topojson' | 'kml' | FeatureFormat;
}
```

In `OlLayerService.createVectorSource`, resolve the format instance:

```typescript
import FeatureFormat from 'ol/format/Feature';

private createVectorSource(config: VectorLayerConfig, _map: OLMap): VectorSource {
  const sourceOptions: { url?: string; format?: FeatureFormat } = {};

  if (config.url && config.format) {
    sourceOptions.url = config.url;
    if (config.format instanceof FeatureFormat) {
      sourceOptions.format = config.format;
    } else if (config.format === 'geojson') {
      sourceOptions.format = new GeoJSON();
    } else if (config.format === 'topojson') {
      sourceOptions.format = new TopoJSON();
    } else if (config.format === 'kml') {
      sourceOptions.format = new KML();
    }
  }

  return new VectorSource(sourceOptions);
}
```

#### B. Execute Source Loading Outside Angular's Zone

Inject `OlZoneHelper` into `OlLayerService` and wrap the source creation and layer additions inside `runOutsideAngular`:

```typescript
// Inside OlLayerService
private zoneHelper = inject(OlZoneHelper);

private createLayer(config: AnyLayerConfig, map: OLMap): { id: string } {
  return this.zoneHelper.runOutsideAngular(() => {
    // ... existing layer creation logic ...
  });
}
```

Since the `VectorSource` is instantiated outside the Angular zone, OpenLayers' internal XHR/fetch requests and parsing will run outside `NgZone`, completely avoiding unnecessary change detection cycles.

#### C. Resolve the `[features]` and `url` Conflict

Modify the feature synchronization effect in `OlVectorLayerComponent` to only sync features if `features` has been explicitly provided OR if `url` is not set.

We can achieve this by checking if the `features` input value has elements or by making the `features` input optional and checking if it is defined:

```typescript
// In OlVectorLayerComponent
features = input<Feature[] | undefined>(undefined);

// In constructor
effect(() => {
  const currentFeatures = this.features();
  const hasUrl = !!this.url();

  // Only update features if they are explicitly provided
  // If url is set and features is undefined/empty, do not clear the source
  if (currentFeatures !== undefined && (!hasUrl || currentFeatures.length > 0)) {
    if (this.layerService.getLayer(this.id())) {
      this.layerService.updateFeatures(this.id(), currentFeatures);
    }
  }
});
```

---

## 3. Recommended Implementation Steps

1. **Phase 1: Disposal & Memory Leak Fixes**
   - Update `OlLayerService.updateVectorLayerConfig` to dispose of old sources.
   - Update WebGL components, overlays, and controls to call `dispose()` on their respective OpenLayers objects inside `DestroyRef.onDestroy`.
   - Run existing test suite to ensure no regressions.

2. **Phase 2: Native URL & Format Support**
   - Update types in `layer.types.ts` to allow `FeatureFormat` instances.
   - Inject `OlZoneHelper` in `OlLayerService` and wrap source/layer creation.
   - Update `OlVectorLayerComponent` to make `features` input optional and adjust the sync effect.
   - Add unit tests verifying that passing a custom `FeatureFormat` instance works, and that features are not cleared when `url` is used.
