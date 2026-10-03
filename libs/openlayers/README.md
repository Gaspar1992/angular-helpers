# 🗺️ @angular-helpers/openlayers

A modern, declarative Angular wrapper for OpenLayers with a modular sub-entry point architecture, standalone components, reactive Signal inputs, and GPU-accelerated layer rendering.

---

## Quick Path

### 1. Installation

```bash
pnpm add @angular-helpers/openlayers ol
```

### 2. Provider Configuration

Configure features via functional providers:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideOpenLayers } from '@angular-helpers/openlayers/core';
import { withLayers } from '@angular-helpers/openlayers/layers';
import { withControls } from '@angular-helpers/openlayers/controls';

export const appConfig: ApplicationConfig = {
  providers: [provideOpenLayers(withLayers(), withControls())],
};
```

### 3. Declarative Map Component

```typescript
import { Component } from '@angular/core';
import { OlMapComponent } from '@angular-helpers/openlayers/core';
import { OlTileLayerComponent } from '@angular-helpers/openlayers/layers';
import {
  OlZoomControlComponent,
  OlScaleLineControlComponent,
} from '@angular-helpers/openlayers/controls';

@Component({
  selector: 'app-interactive-map',
  imports: [
    OlMapComponent,
    OlTileLayerComponent,
    OlZoomControlComponent,
    OlScaleLineControlComponent,
  ],
  template: `
    <ol-map [center]="[0, 0]" [zoom]="3" class="w-full h-[500px] block">
      <ol-tile-layer source="osm" />
      <ol-zoom-control />
      <ol-scale-line-control />
    </ol-map>
  `,
})
export class InteractiveMapComponent {}
```

---

## Entry Points Architecture

| Entry Point                                | Content                                                                                  |
| :----------------------------------------- | :--------------------------------------------------------------------------------------- |
| `@angular-helpers/openlayers/core`         | Root `<ol-map>`, `OlMapService`, `GeometryService`, projection setup, and base types.    |
| `@angular-helpers/openlayers/layers`       | Tile layers (`<ol-tile-layer>`), Vector layers (`<ol-vector-layer>`), and WebGL shaders. |
| `@angular-helpers/openlayers/controls`     | Zoom, scale line, full screen, layer switcher, and custom HUD controls.                  |
| `@angular-helpers/openlayers/interactions` | Draw, select, modify, translate, and drag interactions managed via Signals.              |
| `@angular-helpers/openlayers/overlays`     | Contextual popups and HTML marker overlays pinned to coordinates.                        |

---

## Key Guarantees

- **True Tree-Shaking**: Sub-entry points ensure only components and OpenLayers modules you use are bundled.
- **Signals-First**: Map viewport (`zoom`, `center`, `rotation`) and layer properties bind to native Angular Signal inputs.
- **Zoneless & SSR Safe**: Map initialization runs safely in browser contexts, isolating canvas rendering from SSR hydration.
- **Military & Geodesic Precision**: Geodesic geometry algorithms for ellipsoids, range rings, and NATO symbology.

---

## Interactive Documentation & Demos

Live interactive map demos and component API references:
👉 **[Angular Helpers OpenLayers Docs](https://gaspar1992.github.io/angular-helpers/docs/openlayers)**
👉 **[OpenLayers Interactive Demo](https://gaspar1992.github.io/angular-helpers/demo/openlayers)**

---

## License

MIT
