# 🗺️ @angular-helpers/openlayers

Modular, signal-first Angular 22+ wrapper for OpenLayers — standalone map, layer, control, interaction, and overlay components with tree-shakable entry points and typed `Feature<P>` generics.

---

## Quick Path

### 1. Installation

```bash
pnpm add @angular-helpers/openlayers ol
```

### 2. Provider Setup (`app.config.ts`)

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideOpenLayers } from '@angular-helpers/openlayers/core';
import { withControls } from '@angular-helpers/openlayers/controls';
import { withInteractions, withSelectInteraction } from '@angular-helpers/openlayers/interactions';
import { withLayers } from '@angular-helpers/openlayers/layers';
import { withOverlays } from '@angular-helpers/openlayers/overlays';

export const appConfig: ApplicationConfig = {
  providers: [
    provideOpenLayers(
      withLayers(),
      withControls(),
      withInteractions(),
      withSelectInteraction('main-select', { multi: true }),
      withOverlays(),
    ),
  ],
};
```

### 3. Component Usage

```typescript
import { Component } from '@angular/core';
import { OlMapComponent } from '@angular-helpers/openlayers/core';
import { OlVectorLayerComponent } from '@angular-helpers/openlayers/layers';
import { OlZoomControlComponent } from '@angular-helpers/openlayers/controls';

@Component({
  selector: 'app-map-view',
  imports: [OlMapComponent, OlVectorLayerComponent, OlZoomControlComponent],
  template: `
    <ol-map [center]="[-3.7038, 40.4168]" [zoom]="6" class="block h-96 w-full">
      <ol-vector-layer />
      <ol-zoom-control />
    </ol-map>
  `,
})
export class MapViewComponent {}
```

---

## Secondary Entry Points

| Entry Point                                | Description                                                                                                                |
| :----------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| `@angular-helpers/openlayers/core`         | `provideOpenLayers`, `OlMapComponent`, `OlMapService`, `OlTimeService`, generic `Feature<P>`.                              |
| `@angular-helpers/openlayers/layers`       | `withLayers`, `OlVectorLayerComponent`, `OlClusterComponent`, `OlHeatmapLayerComponent`, `OlWebGLVectorLayerComponent`.    |
| `@angular-helpers/openlayers/controls`     | `withControls`, zoom, attribution, scale-line, fullscreen, rotate, basemap switcher, `<ol-timeline>`.                      |
| `@angular-helpers/openlayers/interactions` | `withInteractions`, `withSelectInteraction`, `withDrawInteraction`, `withModifyInteraction`, `withMeasurementInteraction`. |
| `@angular-helpers/openlayers/overlays`     | `withOverlays`, `OlPopupComponent`, `OlTooltipDirective`.                                                                  |
| `@angular-helpers/openlayers/testing`      | Test harnesses and mocks for OpenLayers specs.                                                                             |

---

## Interactive Documentation & Demo

👉 **[OpenLayers Docs](https://gaspar1992.github.io/angular-helpers/docs/openlayers)**
👉 **[OpenLayers Live Demo](https://gaspar1992.github.io/angular-helpers/demo/openlayers)**

## License

MIT
