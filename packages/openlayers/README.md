# @angular-helpers/openlayers

A modern Angular wrapper for OpenLayers with modular architecture, standalone components, and a hybrid template/programmatic API.

## Features

- **Standalone Components** - No NgModule boilerplate, use directly in your components
- **Signals Integration** - Native Angular signals for reactive state management
- **Modular Loading** - Import only what you need with AgGrid-style sub-entry points
- **Dual API** - Template for UI, Inputs for data, Services for operations
- **Tree-shaking** - Unused OpenLayers code is eliminated from your bundle
- **TypeScript First** - Full type safety with strict mode support
- **Military Features** - Ellipses, sectors, NATO symbology, and MGRS coordinates

## Installation

```bash
npm install @angular-helpers/openlayers ol
```

## Quick Start

### 1. Configure in your app

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideOpenLayers } from '@angular-helpers/openlayers';
import { withLayers } from '@angular-helpers/openlayers/layers';
import { withControls } from '@angular-helpers/openlayers/controls';

export const appConfig: ApplicationConfig = {
  providers: [provideOpenLayers(withLayers(), withControls())],
};
```

### 2. Use in your component

```typescript
// map.component.ts
import { Component, inject } from '@angular/core';
import { OlMapComponent } from '@angular-helpers/openlayers';
import { OlVectorLayerComponent } from '@angular-helpers/openlayers/layers';
import { OlCustomControlComponent } from '@angular-helpers/openlayers/controls';
import { OlMapService } from '@angular-helpers/openlayers';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [OlMapComponent, OlVectorLayerComponent, OlCustomControlComponent],
  template: `
    <ol-map [center]="[2.2945, 48.8584]" [zoom]="12">
      <!-- Data via Input -->
      <ol-tile-layer [source]="{ type: 'osm' }"></ol-tile-layer>
      <ol-vector-layer [features]="points" [zIndex]="10"></ol-vector-layer>

      <!-- UI via Template -->
      <ol-custom-control position="top-right">
        <button (click)="flyToEiffel()">Eiffel Tower</button>
      </ol-custom-control>
    </ol-map>
  `,
})
export class MapComponent {
  private ol = inject(OlMapService);

  points = [{ id: '1', geometry: { type: 'Point', coordinates: [2.2945, 48.8584] } }];

  flyToEiffel() {
    this.ol.animateView({ center: [2.2945, 48.8584], zoom: 15, duration: 1000 });
  }
}
```

## Architecture

### Data vs UI Separation

| Use Case                             | Approach                    | Example                                                       |
| ------------------------------------ | --------------------------- | ------------------------------------------------------------- |
| **Data** (features, layers, coords)  | `@Input()`                  | `<ol-vector-layer [features]="data">`                         |
| **UI** (buttons, popups, toolbars)   | Template/content projection | `<ol-custom-control><button>...</button></ol-custom-control>` |
| **Operations** (animations, queries) | Service via `inject()`      | `this.ol.animateView({...})`                                  |

### Sub-Entry Points

Import only what you need:

```typescript
// Core only (~45KB gzipped)
import { OlMapComponent, OlMapService } from '@angular-helpers/openlayers';

// Add layers (~35KB additional)
import { OlVectorLayerComponent, withLayers } from '@angular-helpers/openlayers/layers';

// Add controls (~15KB additional)
import { OlCustomControlComponent, withControls } from '@angular-helpers/openlayers/controls';

// Add interactions (~40KB additional)
import {
  OlDrawInteractionComponent,
  withInteractions,
} from '@angular-helpers/openlayers/interactions';

// Add military features (~10KB additional)
import { OlEllipseFeatureComponent, withMilitary } from '@angular-helpers/openlayers/military';
```

## API Reference

See the [documentation](https://gaspar1992.github.io/angular-helpers/docs/openlayers) for full API reference and examples.

## Comparison with Other Libraries

| Feature               | ngx-openlayers | ngx-ol-library | IGO2-lib | **This Library**         |
| --------------------- | -------------- | -------------- | -------- | ------------------------ |
| Angular 21+           | ❌             | ✅             | ❌       | ✅                       |
| Standalone Components | ❌             | ✅             | ❌       | ✅                       |
| Signals               | ❌             | ❌             | ❌       | ✅                       |
| Modular Loading       | ❌             | Partial        | ❌       | ✅                       |
| Programmatic API      | ❌             | ❌             | Partial  | ✅                       |
| Military Features     | ❌             | ❌             | ❌       | ✅                       |
| Bundle Size           | ~180KB         | ~200KB         | ~500KB   | **~145KB (all modules)** |

## License

MIT

## Contributing

See the main repository for contribution guidelines.
