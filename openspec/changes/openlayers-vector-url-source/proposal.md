# Proposal: OpenLayers Vector URL Source

## Intent

Unify vector source configuration for `OlVectorLayerComponent` and `OlWebGLVectorLayerComponent` via a reactive `source` input. Align remote URL loading, format decoding, projection mapping, and lifecycle management.

## Scope

### In Scope

- Unified `VectorSourceConfig` interface.
- Add `source` input supporting `VectorSourceConfig | string | Feature[]` on both components.
- Reactively recreate and dispose of sources on changes.
- Out-of-zone map event binding (`featuresloadend`, `error`) and `throttleTime` rate limiting.
- Graceful WebGL failures handling.

### Out of Scope

- Integrating WebGL layer creation into `OlLayerService`.

## Capabilities

### New Capabilities

- Reactive `source` configuration on `OlWebGLVectorLayerComponent`.
- Callback support (`onFeaturesLoaded`, `onError`) and `throttleTime` configuration parameter.
- iOS-like permission status exposure on layer configuration if needed (as design pattern).

### Modified Capabilities

- `OlVectorLayerComponent` accepts unified `source` input.

## Approach

1. **Interface Definition**:
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
2. **Component Updates**:
   - Add `source = input<VectorSourceConfig | string | Feature[]>();`
   - Map `source` to config object. If `string`, treat as URL. If `Feature[]`, treat as static features.
   - Run event listeners inside `zoneHelper.runOutsideAngular()`.
   - Implement `throttleTime` for `featuresloadend` state/callbacks if defined.
   - Clean up existing sources using `clear(true)` and `dispose()`.
   - Degrade gracefully if WebGL initialization fails.

## Affected Areas

- `packages/openlayers/layers/src/models/layer.types.ts`
- `packages/openlayers/layers/src/features/vector-layer.component.ts`
- `packages/openlayers/layers/src/features/webgl-vector-layer.component.ts`
- `packages/openlayers/layers/src/services/layer.service.ts`

## Risks & Mitigation

- **Memory Leaks**: Replacing sources reactively may leak WebGL resources.
  - _Mitigation_: Ensure `clear(true)` and `dispose()` are explicitly called on old sources during cleanup.

## Rollback Plan

Revert changes via git revert to restore previous input bindings.

## Success Criteria

- Remote datasets load correctly in `OlWebGLVectorLayerComponent`.
- Standard and WebGL components share the same reactive input type.
- Resource cleanup verifies no active leaks when changing sources.
