---
title: 'openlayers v0.2.0: SRP-refactored interactions, Circle draw, and a native-style toolbar'
publishedAt: 2026-04-27
tags: ['openlayers', 'angular', 'maps', 'interactions', 'srp', 'signals']
excerpt: The interactions entry point gets a clean Single-Responsibility split into Select / Draw / Modify services, a dedicated InteractionStateService for signal-based state, public types for every config and event, Circle drawing, and a demo toolbar restyled to match the native OpenLayers control aesthetic.
---

# openlayers v0.2.0: SRP-refactored interactions, Circle draw, and a native-style toolbar

`@angular-helpers/openlayers/interactions` shipped in [Phase 2](/blog/openlayers-phase2) as a single placeholder service. v0.2.0 turns it into a real, modular interactions surface — split by responsibility, fully typed, signal-first, and zoneless-safe.

## What was wrong with v0.1

The first interactions service was a stub:

```typescript
@Injectable()
export class OlInteractionService {
  enableInteraction(type: InteractionType, config: unknown): unknown {
    return null;
  }
  disableInteraction(id: string): void {}
  startDrawing(type: string, options?: DrawConfig): Observable<Feature> {
    return new Observable<Feature>();
  }
}
```

Three problems:

1. **One service for everything** — Select, Draw, and Modify share almost no logic. Bundling them violates SRP and makes the surface impossible to extend.
2. **Untyped configs** — `config: unknown` and a generic `enableInteraction()` push every type-check to call sites.
3. **No state model** — Selected features, active interactions, and draw events were not exposed as signals or observables.

## The new architecture

```
OlInteractionService          (orchestrator — public API)
├── InteractionStateService   (signals + observables — single source of truth)
├── SelectInteractionService  (creates ol/Select, syncs selection)
├── DrawInteractionService    (creates ol/Draw, emits drawStart/drawEnd)
└── ModifyInteractionService  (creates ol/Modify, emits modify events)
```

Each specialized service has **one job**: build an OL interaction, wire it to the map, push state into `InteractionStateService`, and return a `cleanup()` closure. The orchestrator never touches `ol/*` directly — it only delegates.

### Typed, intentional API

Three explicit methods replace the old `enableInteraction(unknown)`:

```typescript
const interactions = inject(OlInteractionService);

interactions.enableSelect('cities-select', {
  layers: ['cities', 'drawn-features'],
  multi: true,
  hitTolerance: 5,
});

interactions.enableDraw('drawer', {
  type: 'Circle',
  source: 'drawn-features',
  freehand: false,
});

interactions.enableModify('editor', {
  source: 'drawn-features',
  snapTolerance: 8,
});
```

Each `enable*` returns `{ cleanup: () => void }` so call sites can dispose without remembering the id.

### Public types

Every config and event is now exported from the entry point:

```typescript
export type {
  InteractionType,
  InteractionConfig,
  SelectConfig,
  DrawConfig,
  ModifyConfig,
  DragAndDropConfig,
  SelectEvent,
  DrawEndEvent,
  DrawStartEvent,
  ModifyEvent,
  InteractionState,
} from '@angular-helpers/openlayers/interactions';
```

No more digging into private files for a config shape.

### Signals + observables, picked deliberately

`InteractionStateService` exposes both, and the orchestrator re-exports them:

```typescript
readonly selectedFeatures = this.stateService.selectedFeatures;   // Signal<Feature[]>
readonly selectionCount   = this.stateService.selectionCount;     // Signal<number>
readonly hasSelection     = this.stateService.hasSelection;       // Signal<boolean>
readonly activeInteractions = this.stateService.activeInteractions; // Signal<InteractionState[]>

readonly drawStart$ = this.stateService.drawStart$;   // Observable<DrawStartEvent>
readonly drawEnd$   = this.stateService.drawEnd$;     // Observable<DrawEndEvent>
readonly modify$    = this.stateService.modify$;      // Observable<ModifyEvent>
```

**State that is read in templates uses signals.** **Event streams that are consumed once with `takeUntilDestroyed()` use Subjects/Observables.** Mixing them on purpose, not by accident.

### Zoneless-safe cleanup

`disableInteraction()` runs the OL teardown outside Angular's zone:

```typescript
disableInteraction(id: string): void {
  const interaction = this.stateService.findInteraction(id);
  if (!interaction) return;

  this.zoneHelper.runOutsideAngular(() => interaction.cleanup());
  this.stateService.removeInteraction(id);

  if (interaction.type === 'select') {
    this.stateService.clearSelection();
  }
}
```

Removing 300 features from a vector source no longer triggers a full change-detection cycle.

### Idempotent enable

Calling `enableSelect('cities-select', …)` twice with the same id is now a no-op instead of a duplicate interaction:

```typescript
if (this.stateService.findInteraction(id)) {
  return { cleanup: () => this.disableInteraction(id) };
}
```

## Circle drawing + better Modify UX

`DrawConfig.type` accepts `'Circle'` end-to-end (state, event payload, demo toolbar). Modify now auto-enables Select if it's not active — you can't modify what you can't pick.

## Demo toolbar matches the map

The interactive demo's bottom toolbar was restyled to match the native OL control aesthetic:

- White panel with the same `box-shadow` and 4 px radius as the Layer Switcher and Basemap card
- Light-gray buttons (`#f5f5f5`) with dark icons (`#333`) on hover-darken
- OL-blue active state (`#1976d2`) instead of DaisyUI purple
- Soft blue tint (`#e3f2fd` / `#1976d2`) for the selected draw type, matching the `vector` layer badge

End result: the toolbar reads as part of the map, not as a UI component dropped on top of it.

## What's NOT in scope

- **Drag-and-drop file import** — the `DragAndDropConfig` type is exported but the service is still a stub. Coming next.
- **Snap interaction** — vertices snap during Modify, but standalone Snap (snap-to-existing-features while drawing) lands later.
- **Drawing styles per type** — every drawn feature uses OL's default style. A `style` input on `DrawConfig` is on the roadmap.

## Try it

```bash
npm i @angular-helpers/openlayers ol
```

```typescript
import { OlMapComponent, OlMapService } from '@angular-helpers/openlayers/core';
import {
  OlInteractionService,
  InteractionStateService,
  SelectInteractionService,
  DrawInteractionService,
  ModifyInteractionService,
} from '@angular-helpers/openlayers/interactions';

@Component({
  providers: [
    OlMapService,
    OlInteractionService,
    InteractionStateService,
    SelectInteractionService,
    DrawInteractionService,
    ModifyInteractionService,
  ],
  template: `<ol-map [center]="[2.17, 41.38]" [zoom]="12" />`,
})
class MapDemo {
  private interactions = inject(OlInteractionService);

  enableDraw() {
    this.interactions.enableDraw('demo', { type: 'Polygon', source: 'drawn' });
  }
}
```

Live demo: [angular-helpers.dev/demo/openlayers](https://gaspar1992.github.io/angular-helpers/demo/openlayers).

Feedback at [github.com/Gaspar1992/angular-helpers](https://github.com/Gaspar1992/angular-helpers/issues). 🗺️
