# Technical Design: OpenLayers Vector URL Source

## 1. Technical Approach

We introduce a unified `source` input on [OlVectorLayerComponent](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/vector-layer.component.ts) and [OlWebGLVectorLayerComponent](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/webgl-vector-layer.component.ts). This input accepts a `VectorSourceConfig` object, a string URL, or a static `Feature[]` array, resolving polymorphic signatures into a single config.

We update `createVectorSource` in [layer.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/services/layer.service.ts) to respect `coordinateProjection` (the data's coordinate system) and explicitly pass it as `dataProjection` to the format constructors (`GeoJSON`, `TopoJSON`, `KML`), with `featureProjection` mapped to the map view's projection.

Event listeners (`featuresloadend`, `error`) are registered outside the Angular Zone using `OlZoneHelper` to prevent redundant change detection loops. We transform loaded OL features back to core `Feature[]` via `olFeatureToFeature` and invoke user-defined callbacks (`onFeaturesLoaded`, `onError`) outside the zone. Optional callback and auto-fitting rate-limiting is supported via `throttleTime`.

On configuration updates, we reactively destroy the old source by calling `clear(true)` and `dispose()` to prevent memory and WebGL context leaks.

---

## 2. Architecture Decisions

| Decision Area          | Choices Considered                                          | Selected Option & Rationale                                                                                                                                         |
| :--------------------- | :---------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Input Interface**    | Separate inputs vs. Unified `source` input                  | **Unified `source` input**. Resolves signatures into a single `VectorSourceConfig` computed signal, keeping template interfaces cleaner and simplifying reactivity. |
| **Format Projections** | Rely on OpenLayers defaults vs. Explicit projection passing | **Explicit projection passing**. Format instances receive explicit `dataProjection` and `featureProjection` options, resolving coordinate mismatches.               |
| **Resource Disposal**  | Automatic garbage collection vs. Reactive cleanup           | **Reactive cleanup**. Forces explicit calling of `clear(true)` and `dispose()` on replaced sources, preventing WebGL context leaks.                                 |

---

## 3. Data Flow Diagram

```
[Component Input: source]
         │
         ▼ (resolve config)
 [VectorSourceConfig] ──► [OlLayerService.createVectorSource] ──► [new VectorSource]
         │                                                            │
         ▼ (runs outside NgZone)                                      ▼ (loads url)
[Event Listeners & Throttling] ◄─── (featuresloadend / error) ────────┘
         │
         ├─────────────────────────────────┐
         ▼ (mapped to core Features)       ▼
 [onFeaturesLoaded(features)]      [fitToLayer(extent)]
```

---

## 4. Code Contracts

```typescript
export interface VectorSourceConfig {
  features?: Feature[];
  url?: string;
  format?: 'geojson' | 'topojson' | 'kml' | FeatureFormat;
  coordinateProjection?: string;
  autoFit?: boolean | AutoFitOptions;
  onError?: (error: Error) => void;
  onFeaturesLoaded?: (features: Feature[]) => void;
  throttleTime?: number;
}
```

Components ([OlVectorLayerComponent](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/vector-layer.component.ts), [OlWebGLVectorLayerComponent](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/webgl-vector-layer.component.ts)) will expose:

- `source = input<VectorSourceConfig | string | Feature[]>();`

---

## 5. Detailed File Changes

1. **[layer.types.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/models/layer.types.ts)**:
   - Define `VectorSourceConfig` interface.
   - Refactor `VectorLayerConfig` to extend `VectorSourceConfig`.
2. **[layer.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/services/layer.service.ts)**:
   - Update `createVectorSource()` to construct formats with configured `dataProjection` and `featureProjection`.
   - Update `updateVectorLayerConfig()` to ensure reactive disposal on configuration changes.
3. **[vector-layer.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/vector-layer.component.ts)**:
   - Replace individual inputs (`url`, `features`, etc.) with the unified `source` input.
   - Bind `featuresloadend` and `error` events outside Angular zone using `OlZoneHelper`.
   - Execute user callbacks outside Angular zone, with throttling support.
4. **[webgl-vector-layer.component.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/openlayers/layers/src/features/webgl-vector-layer.component.ts)**:
   - Add unified `source` input.
   - Rebuild vector source reactively on changes, ensuring clean disposal.

---

## 6. Testing Strategy

Using **Vitest**, we will:

1. **Mock Projections**: Validate that `dataProjection` and `featureProjection` are passed to format constructors.
2. **Zone Execution**: Assert that `onFeaturesLoaded` and `onError` run outside the zone.
3. **Throttling**: Mock timer-based emissions and verify `throttleTime` rate-limits callbacks.
4. **Cleanup**: Assert `clear(true)` and `dispose()` are called on old sources.

---

## Appendix: Device Orientation & Motion APIs

### API Signatures

```typescript
export function injectDeviceOrientation(config?: DeviceSensorConfig): DeviceOrientationRef;
export function injectDeviceMotion(config?: DeviceSensorConfig): DeviceMotionRef;

@Injectable({ providedIn: 'root' })
export class DeviceOrientationService extends BrowserApiBaseService<DeviceOrientationData | null> {
  watch(config?: DeviceSensorConfig): Observable<DeviceOrientationData | null>;
  requestPermission(): Promise<PermissionState>;
}

@Injectable({ providedIn: 'root' })
export class DeviceMotionService extends BrowserApiBaseService<DeviceMotionData | null> {
  watch(config?: DeviceSensorConfig): Observable<DeviceMotionData | null>;
  requestPermission(): Promise<PermissionState>;
}

export interface DeviceSensorConfig {
  runOutsideAngular?: boolean;
  throttleTime?: number;
}
```

### Encapsulation & Shared Logic

- [device-orientation.utils.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/utils/device-orientation.utils.ts) encapsulates permission checks, out-of-zone listener execution, and RxJS `throttleTime` piping, keeping [device-orientation.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/services/device-orientation.service.ts) and [device-motion.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/browser-web-apis/src/services/device-motion.service.ts) and functional helpers DRY.

### Test Strategy

- Mock global orientation/motion events and check zone isolation and virtual-time throttling.
