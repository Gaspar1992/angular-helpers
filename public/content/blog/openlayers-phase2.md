---
title: OpenLayers for Angular — Phase 2 Complete
publishedAt: 2026-04-24
tags: ['angular', 'openlayers', 'maps', 'gis', 'standalone-components']
excerpt: A modern Angular wrapper for OpenLayers with standalone components, signals-based reactivity, and modular secondary entry points. Now with interactive controls and full demo.
---

# OpenLayers for Angular — Phase 2 Complete

We're excited to announce that `@angular-helpers/openlayers` has reached a major milestone with **Phase 2** — a fully functional, modern Angular wrapper for OpenLayers that's ready for real-world applications.

## The Problem

OpenLayers is the gold standard for web mapping, but integrating it with Angular has always been verbose:

- Manual lifecycle management (init, destroy, change detection)
- No reactivity with Angular signals
- Verbose control configuration
- Tight coupling between map state and UI state

Existing Angular wrappers either:

- Use old patterns (NgModules, no signals)
- Are monolithic (import everything or nothing)
- Don't support tree-shaking

## Our Solution

`@angular-helpers/openlayers` provides a **hybrid API** that separates concerns:

| Concern        | API Style | Example                                        |
| -------------- | --------- | ---------------------------------------------- |
| **Data**       | Inputs    | `[center]="coords"`, `[features]="points"`     |
| **UI**         | Template  | `<ol-zoom-control>`, `<ol-scale-line-control>` |
| **Operations** | Services  | `mapService.animateView({...})`                |

### Key Features

- **Standalone Components** — No NgModules, works directly in your components
- **Signals Integration** — Native Angular signals for reactive state
- **Modular Architecture** — Import only what you need via secondary entry points
- **Zoneless-Safe** — All operations run outside NgZone
- **Full TypeScript** — Strict mode compatible

## Architecture

### Secondary Entry Points

Like AgGrid, each feature is a separate entry point:

```typescript
// Core — map component and services
import { OlMapComponent, provideOpenLayers } from '@angular-helpers/openlayers/core';

// Layers — tile, vector, image layers
import { OlTileLayerComponent, withLayers } from '@angular-helpers/openlayers/layers';

// Controls — zoom, attribution, scale, fullscreen
import { OlZoomControlComponent, withControls } from '@angular-helpers/openlayers/controls';
```

### Reactivity with Signals

```typescript
@Component({
  template: `
    <ol-map [center]="center()" [zoom]="zoom()">
      <ol-tile-layer id="osm" source="osm"></ol-tile-layer>
      <ol-zoom-control></ol-zoom-control>
    </ol-map>
  `,
})
class MapComponent {
  center = signal<[number, number]>([2.17, 41.38]);
  zoom = signal<number>(12);
}
```

Inputs are signals, outputs emit events. Update a signal and the map updates. The map emits events and you react to them.

### Event Handling

```typescript
<ol-map
  (viewChange)="onViewChange($event)"
  (click)="onMapClick($event)"
  (dblclick)="onMapDblClick($event)">
</ol-map>
```

## What's Included

### Core (`@angular-helpers/openlayers/core`)

- `OlMapComponent` — The map container with inputs for center, zoom, rotation
- `OlMapService` — Programmatic API for animations, view changes, extent fitting
- `provideOpenLayers()` — Provider function for configuration

### Layers (`@angular-helpers/openlayers/layers`)

- `OlTileLayerComponent` — OSM, XYZ, WMS tile sources
- `OlVectorLayerComponent` — Vector layers with reactive features
- `OlLayerService` — Layer management (add, remove, set visibility/opacity)

### Controls (`@angular-helpers/openlayers/controls`)

- `OlZoomControlComponent`
- `OlAttributionControlComponent`
- `OlScaleLineControlComponent`
- `OlFullscreenControlComponent`

## Live Demo

See it in action at [angular-helpers demo](https://gaspar1992.github.io/angular-helpers/demo/openlayers):

- Interactive map with multiple cities
- Zoom, attribution, scale line, and fullscreen controls
- Click to get coordinates
- Jump to major cities (Barcelona, London, New York, Tokyo)

## Installation

```bash
npm install @angular-helpers/openlayers ol
```

Configure in your app:

```typescript
// app.config.ts
import { provideOpenLayers } from '@angular-helpers/openlayers/core';
import { withLayers } from '@angular-helpers/openlayers/layers';
import { withControls } from '@angular-helpers/openlayers/controls';

export const appConfig: ApplicationConfig = {
  providers: [provideOpenLayers(withLayers(), withControls())],
};
```

## What's NOT in Scope (Yet)

Phase 2 focuses on the foundation. Future releases will add:

- **Interactions** — Select, draw, modify (interaction providers planned)
- **Overlays** — Popups, tooltips with content projection
- **Military Features** — MIL-STD-2525 symbols via milsymbol
- **Advanced Layers** — Heatmap, WebGL tiles
- **Offline Support** — Tile caching

## Technical Decisions

### Why Secondary Entry Points?

Tree-shaking. If you only need the core map and a zoom control, you don't pay for vector layer logic or military symbols.

### Why Signals for Inputs?

Angular's future is signals. This wrapper is future-proof and works with zoneless change detection.

### Why Run Outside NgZone?

Map operations are performance-critical. We run all OpenLayers calls outside Angular's zone, then re-enter only for event emission.

## Try It

```bash
# Clone the repo
git clone https://github.com/Gaspar1992/angular-helpers.git
cd angular-helpers

# Install dependencies
npm install

# Build the package
cd packages/openlayers
npm run build

# Or see the demo
npm run dev
# Navigate to /demo/openlayers
```

## Feedback Welcome

This is just the beginning. If you have feature requests or find bugs, open an issue at [github.com/Gaspar1992/angular-helpers](https://github.com/Gaspar1992/angular-helpers).

Happy mapping! 🗺️
