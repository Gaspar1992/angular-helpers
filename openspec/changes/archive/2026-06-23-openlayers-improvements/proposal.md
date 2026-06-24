# Proposal: OpenLayers Improvements

## Intent

Improve the geodesic accuracy of military geometry sector rendering at large scales (>100km), and enable declarative hover events with change-detection optimization.

## Scope

### In Scope

- Geodesic densification for radial straight edges of sectors in `createSector` (8-16 steps).
- Add `hoverEvent` output to `OlSelectInteractionComponent`.
- Implement `hover$` event stream in `InteractionStateService` and `OlSelectInteractionService` run inside Angular zone only on value change.

### Out of Scope

- Map click selection logic modifications.
- General performance optimization of other rendering pipelines.

## Capabilities

### New Capabilities

- `openlayers-core`: High-fidelity geodesic math for military and tactical geometry generation.
- `openlayers-interactions`: Declarative, performance-optimized hover and click interaction outputs for map components.

### Modified Capabilities

None

## Approach

- Update `createSector` in `geometry.service.ts` to generate intermediate vertices along start and end bearings.
- Expose `hoverEvent` using `output()` in `OlSelectInteractionComponent`.
- Emit updates inside Angular zone only when hovered feature changes to prevent change-detection overload.

## Affected Areas

| Area                                                                            | Impact   | Description                                      |
| ------------------------------------------------------------------------------- | -------- | ------------------------------------------------ |
| `packages/openlayers/core/src/services/geometry.service.ts`                     | Modified | Densify radial lines in `createSector`.          |
| `packages/openlayers/core/src/services/geometry.service.spec.ts`                | Modified | Test densified points.                           |
| `packages/openlayers/interactions/src/features/select-interaction.component.ts` | Modified | Add `hoverEvent` output.                         |
| `packages/openlayers/interactions/src/services/interaction-state.service.ts`    | Modified | Add `hoveredFeature$` state flow.                |
| `packages/openlayers/interactions/src/services/select-interaction.service.ts`   | Modified | Connect select interaction to `hoveredFeature$`. |
| `packages/openlayers/interactions/src/models/interaction.types.ts`              | Modified | Type definitions for events.                     |

## Risks

| Risk                                            | Likelihood | Mitigation                                                                                               |
| ----------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| Angular change detection flood from mouse moves | Medium     | Guard emits in `select-interaction.service.ts` by ensuring the feature ID has changed before triggering. |
| Performance overhead from vertex counts         | Low        | Limit densification to 8-16 steps per radial line.                                                       |

## Rollback Plan

Revert changes using:

```bash
git checkout packages/openlayers/
```

## Dependencies

None

## Success Criteria

- [ ] Sector radial lines contain densified vertices following geodesic paths.
- [ ] `OlSelectInteractionComponent` emits distinct `hoverEvent` outputs.
- [ ] No redundant change detection runs when mouse moves within the same feature.
