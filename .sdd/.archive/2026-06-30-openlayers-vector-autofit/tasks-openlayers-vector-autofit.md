# Tasks: OpenLayers Package — Auto-Fitting Vector Layers (`autoFit`)

This document defines the specific, actionable, and verifiable tasks required to implement the `autoFit` feature on vector layers in the `@angular-helpers/openlayers` package.

---

## Review Workload Forecast

- **Estimated changed lines:** 80-120 lines of code.
- **400-line budget risk:** Low.
- **Chained PRs recommended:** No.
- **Delivery strategy:** `single-pr`
- **Decision needed before apply:** No

```
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low
```

---

## Tasks

### Phase 1: Types & Component Inputs

- [x] **Task 1.1: Update types in `packages/openlayers/layers/src/models/layer.types.ts`**
  - [x] Add `AutoFitOptions` interface:
    ```typescript
    export interface AutoFitOptions {
      padding?: number[];
      duration?: number;
    }
    ```
  - [x] Update `VectorLayerConfig` interface to include the `autoFit` property:
    ```typescript
    autoFit?: boolean | AutoFitOptions;
    ```
  - [x] **Verification:** Run TypeScript compiler (`npx tsc --noEmit`) to verify no compilation errors.

- [x] **Task 1.2: Add `autoFit` input to `OlVectorLayerComponent`**
  - [x] Open [vector-layer.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/vector-layer.component.ts).
  - [x] Add the input signal:
    ```typescript
    autoFit = input<boolean | AutoFitOptions>(false);
    ```
  - [x] Update the `this.layerService.addLayer` call in `afterNextRender` to pass `autoFit: this.autoFit()` in the config object.
  - [x] **Verification:** Verify that the component compiles without errors.

---

### Phase 2: Auto-Fitting Service Implementation

- [x] **Task 2.1: Implement `fitToLayer` in `OlLayerService`**
  - [x] Open [layer.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/services/layer.service.ts).
  - [x] Add the `fitToLayer` method:

    ```typescript
    fitToLayer(id: string, options?: AutoFitOptions): void {
      const map = this.mapService.getMap();
      if (!map) return;

      const layer = this.layerCache.get(id);
      if (!layer || !(layer instanceof VectorLayer || layer instanceof HeatmapLayer)) return;

      const source = (layer as any).getSource();
      if (!source) return;

      // Unwrap ClusterSource to the underlying VectorSource if necessary
      const vectorSource =
        'getSource' in source && typeof source.getSource === 'function'
          ? source.getSource()
          : source;

      if (!vectorSource || typeof vectorSource.getExtent !== 'function') return;

      const extent = vectorSource.getExtent();

      // Validate extent: must be of length 4, all elements finite, and not the default empty extent
      if (
        !extent ||
        extent.length !== 4 ||
        !extent.every((val: number) => isFinite(val)) ||
        (extent[0] === Infinity &&
          extent[1] === Infinity &&
          extent[2] === -Infinity &&
          extent[3] === -Infinity)
      ) {
        return;
      }

      const view = map.getView();
      if (!view) return;

      this.zoneHelper.runOutsideAngular(() => {
        view.fit(extent, {
          padding: options?.padding,
          duration: options?.duration,
        });
      });
    }
    ```

  - [x] Import `VectorLayer` and `HeatmapLayer` if not already imported or if they are not typed properly.
  - [x] **Verification:** Ensure compilation succeeds.

---

### Phase 3: Component Integration

- [x] **Task 3.1: Inject `OlMapService` and handle initial fit in `OlVectorLayerComponent`**
  - [x] Open [vector-layer.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/vector-layer.component.ts).
  - [x] Inject `OlMapService`:
    ```typescript
    private mapService = inject(OlMapService);
    ```
  - [x] In `afterNextRender`, add the logic to handle initial auto-fitting:
    - [x] Check if `this.autoFit()` is active.
    - [x] If active, parse the options (use them if it's an object, otherwise `undefined`).
    - [x] Define `setupFitListener()` to retrieve the layer and source, then:
      - [x] If `this.url()` is set, listen to `'featuresloadend'` on the source and call `this.layerService.fitToLayer(this.id(), parsedOptions)`.
      - [x] If `this.url()` is not set, call `this.layerService.fitToLayer(this.id(), parsedOptions)` immediately.
    - [x] Execute `setupFitListener()` immediately if map is ready (`this.mapService.getMap()` is truthy), otherwise register it on `this.mapService.onReady()`.
  - [x] **Verification:** Check that a layer with static features fits on load, and a layer with a URL fits once features are loaded.

- [x] **Task 3.2: Implement reactive feature updates fitting in `OlVectorLayerComponent`**
  - [x] In [vector-layer.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/vector-layer.component.ts), update the feature-synchronization `effect`.
  - [x] If `this.autoFit()` is active, queue a microtask to fit the map view to the layer:
    ```typescript
    const autoFitActive = this.autoFit();
    if (autoFitActive) {
      const parsedOptions = typeof autoFitActive === 'object' ? autoFitActive : undefined;
      queueMicrotask(() => {
        this.layerService.fitToLayer(this.id(), parsedOptions);
      });
    }
    ```
  - [x] **Verification:** Check that updating the `features` input dynamically triggers a map view fit.

---

### Phase 4: Unit Testing

- [x] **Task 4.1: Add unit tests for `fitToLayer` in `packages/openlayers/layers/src/services/layer.service.spec.ts`**
  - [x] Test successful view fitting:
    - [x] Mock a `VectorLayer` with a `VectorSource` returning a valid extent (e.g. `[0, 0, 10, 10]`).
    - [x] Call `fitToLayer` and assert that `view.fit` was called with the extent and correct options.
    - [x] Assert that `runOutsideAngular` was invoked.
  - [x] Test cluster source unwrapping:
    - [x] Mock a `VectorLayer` whose source is a `ClusterSource` (has `getSource()` method returning the underlying `VectorSource`).
    - [x] Verify `fitToLayer` correctly unwraps it and fits the view to the underlying source's extent.
  - [x] Test invalid/empty extent validation:
    - [x] Mock a source returning `[Infinity, Infinity, -Infinity, -Infinity]` or `undefined`.
    - [x] Verify `view.fit` is not called.
  - [x] Test gracefulness:
    - [x] Verify calling `fitToLayer` with an invalid ID or when the map is not initialized does not throw an error.
  - [x] **Verification:** Run tests using `npm run test` or Vitest directly, verifying all new tests pass.

- [x] **Task 4.2: Add unit tests for `OlVectorLayerComponent` in `packages/openlayers/layers/src/features/vector-layer.component.spec.ts`**
  - [x] Test static features auto-fit on init:
    - [x] Render component with `[features]="staticFeatures"` and `[autoFit]="true"`.
    - [x] Assert `layerService.fitToLayer` is called upon initialization.
  - [x] Test remote features auto-fit on `'featuresloadend'`:
    - [x] Render component with `[url]="'https://example.com'"` and `[autoFit]="{ padding: [10], duration: 150 }"`.
    - [x] Retrieve the mocked source and trigger the `'featuresloadend'` event.
    - [x] Assert `layerService.fitToLayer` is called with the custom options.
  - [x] Test reactive features auto-fit:
    - [x] Render component with `[features]="initialFeatures"` and `[autoFit]="true"`.
    - [x] Update the `features` input to `newFeatures`.
    - [x] Flush the microtask queue (`await Promise.resolve()`).
    - [x] Assert `layerService.fitToLayer` is called again.
  - [x] **Verification:** Run the component tests and verify all new tests pass.
