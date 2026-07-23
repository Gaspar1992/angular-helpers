# Tasks: OpenLayers Vector URL Source

## Review Workload Forecast

| Field                   | Value           |
| ----------------------- | --------------- |
| Estimated changed lines | 150 - 250 lines |
| 400-line budget risk    | Low             |
| Chained PRs recommended | No              |
| Suggested split         | Single PR       |
| Delivery strategy       | single-pr       |
| Chain strategy          | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal                                              | Likely PR | Focused test command                    | Runtime harness       | Rollback boundary            |
| ---- | ------------------------------------------------- | --------- | --------------------------------------- | --------------------- | ---------------------------- |
| 1    | Polymorphic source input & reactive layer updates | PR 1      | `vitest run packages/openlayers/layers` | N/A - unit test suite | `packages/openlayers/layers` |

## Phase 1: Foundation & Types

- [x] 1.1 Define `VectorSourceConfig` interface in `packages/openlayers/layers/src/models/layer.types.ts`
- [x] 1.2 Refactor `VectorLayerConfig` to extend `VectorSourceConfig` in `packages/openlayers/layers/src/models/layer.types.ts`

## Phase 2: Layer Service Updates

- [x] 2.1 Update `createVectorSource()` in `packages/openlayers/layers/src/services/layer.service.ts` to map `coordinateProjection` as `dataProjection` on format constructors
- [x] 2.2 Update `updateVectorLayerConfig()` in `packages/openlayers/layers/src/services/layer.service.ts` to call `clear(true)` and `dispose()` when replacing vector sources

## Phase 3: Component Implementation

- [x] 3.1 Add unified `source` input to `OlVectorLayerComponent` in `packages/openlayers/layers/src/features/vector-layer.component.ts` and handle out-of-zone events
- [x] 3.2 Add unified `source` input to `OlWebGLVectorLayerComponent` in `packages/openlayers/layers/src/features/webgl-vector-layer.component.ts` with reactive source creation and disposal

## Phase 4: Verification & Testing

- [x] 4.1 Add tests for format `dataProjection` mapping in `packages/openlayers/layers/src/services/layer.service.spec.ts`
- [x] 4.2 Add unit tests for `OlVectorLayerComponent` & `OlWebGLVectorLayerComponent` reactive source changes and disposal in `packages/openlayers/layers/src/features/webgl-layer.components.spec.ts`
