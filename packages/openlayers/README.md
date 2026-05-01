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
import { provideOpenLayers } from '@angular-helpers/openlayers/core';
import { withLayers } from '@angular-helpers/openlayers/layers';
import { withControls } from '@angular-helpers/openlayers/controls';

export const appConfig: ApplicationConfig = {
  providers: [provideOpenLayers(withLayers(), withControls())],
};
```

### 2. Use in your component

```typescript
// map.component.ts
import { Component, inject, signal } from '@angular/core';
import { OlMapComponent } from '@angular-helpers/openlayers/core';
import { OlTileLayerComponent } from '@angular-helpers/openlayers/layers';
import {
  OlZoomControlComponent,
  OlScaleLineControlComponent,
} from '@angular-helpers/openlayers/controls';
import { OlMapService } from '@angular-helpers/openlayers/core';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    OlMapComponent,
    OlTileLayerComponent,
    OlZoomControlComponent,
    OlScaleLineControlComponent,
  ],
  template: `
    <ol-map
      [center]="center()"
      [zoom]="zoom()"
      (viewChange)="onViewChange($event)"
      (click)="onMapClick($event)"
      style="display: block; height: 400px;"
    >
      <!-- Base Layer -->
      <ol-tile-layer id="osm" source="osm"></ol-tile-layer>

      <!-- Controls -->
      <ol-zoom-control></ol-zoom-control>
      <ol-scale-line-control unit="metric"></ol-scale-line-control>
    </ol-map>

    <p>Clicked: {{ lastClick()?.coordinate | json }}</p>
  `,
})
export class MapComponent {
  private mapService = inject(OlMapService);

  center = signal<[number, number]>([2.2945, 48.8584]);
  zoom = signal<number>(12);
  lastClick = signal<{ coordinate: [number, number]; pixel: [number, number] } | null>(null);

  onViewChange(state: { center: [number, number]; zoom: number }): void {
    this.center.set(state.center);
    this.zoom.set(state.zoom);
  }

  onMapClick(event: { coordinate: [number, number]; pixel: [number, number] }): void {
    this.lastClick.set(event);
  }

  flyToEiffel() {
    this.mapService.animateView({ center: [2.2945, 48.8584], zoom: 15, duration: 1000 });
  }
}
```

## Overlays — popups and tooltips

Available since `0.3.0` from `@angular-helpers/openlayers/overlays`.

### `<ol-popup>` — declarative popup with content projection

The popup's host element is used directly as the underlying `ol/Overlay` element, so projected children stay inside Angular's view tree and benefit from change detection without any extra plumbing.

```typescript
import { OlPopupComponent } from '@angular-helpers/openlayers/overlays';

@Component({
  imports: [OlMapComponent, OlVectorLayerComponent, OlPopupComponent],
  template: `
    <ol-map [center]="[2.17, 41.38]" [zoom]="12">
      <ol-vector-layer id="cities" [features]="cities()" />

      <ol-popup
        [position]="selectedCoord()"
        [closeButton]="true"
        [autoPan]="true"
        (closed)="clearSelection()"
      >
        <h3>{{ selected()?.name }}</h3>
        <p>{{ selected()?.description }}</p>
      </ol-popup>
    </ol-map>
  `,
})
export class MyMap {
  // …
}
```

Setting `[position]="null"` hides the popup and emits `closed`.

### `[olTooltip]` — feature hover tooltip

```html
<ol-vector-layer
  id="cities"
  [features]="cities()"
  [olTooltip]="'name'"
  [olTooltipLayer]="'cities'"
/>
```

Reads `feature.get('name')` for any feature on layer `cities` under the cursor and renders a styled `<div role="tooltip">` near the pointer. Use the `.ol-tooltip` class to override the default look.

### `OlPopupService` — programmatic popups

Three content modes from a service:

```typescript
const popups = inject(OlPopupService);

// 1) Plain text / HTMLElement
popups.open({
  id: 'simple',
  position: [2.17, 41.38],
  content: 'Hello map',
  positioning: 'bottom-center',
  autoPan: true,
});

// 2) Dynamic Angular component (createComponent + hostElement)
const handle = popups.openComponent({
  id: 'city-popup',
  position: [2.17, 41.38],
  component: CityCardComponent,
  bindings: [
    inputBinding('city', () => selected()),
    outputBinding<void>('closed', () => handle.close()),
  ],
});
```

`open` is idempotent by `id` and updates the existing overlay in place. `openComponent` always recreates the `ComponentRef` on a repeated id and disposes the previous one (`appRef.detachView` + `ref.destroy`) to avoid CD leaks. Calls made before the map is ready are queued and replayed on `OlMapService.onReady`.

## Military symbology

Available since `0.4.0` from `@angular-helpers/openlayers/military`.

Three pure-math geometry helpers (no extra deps) plus a NATO MIL-STD-2525 symbol helper backed by the optional [`milsymbol`](https://github.com/spatialillusions/milsymbol) peer dependency.

```typescript
import { inject, signal } from '@angular/core';
import { OlMilitaryService } from '@angular-helpers/openlayers/military';
import type { Feature } from '@angular-helpers/openlayers/core';

@Component({
  // …
  imports: [OlMapComponent, OlVectorLayerComponent],
  template: `
    <ol-map [center]="[2.17, 41.38]" [zoom]="8">
      <ol-tile-layer id="osm" source="osm" />
      <ol-vector-layer id="military" [features]="features()" [zIndex]="10" />
    </ol-map>
  `,
})
export class MilDemo {
  private ml = inject(OlMilitaryService);
  features = signal<Feature[]>([]);

  async ngOnInit() {
    const ellipse = this.ml.createEllipse({
      center: [2.17, 41.38],
      semiMajor: 6_000,
      semiMinor: 3_000,
      rotation: Math.PI / 6,
    });
    const sector = this.ml.createSector({
      center: [-0.38, 39.47],
      radius: 8_000,
      startAngle: Math.PI / 6,
      endAngle: Math.PI / 2,
    });
    const donut = this.ml.createDonut({
      center: [-5.99, 37.39],
      innerRadius: 5_000,
      outerRadius: 10_000,
    });
    const symbol = await this.ml.createMilSymbol({
      sidc: 'SFGPUCI-----',
      position: [-3.7, 40.42],
      size: 36,
    });
    this.features.set([ellipse, sector, donut, symbol]);
  }
}
```

### Geometry helpers

| Method                  | Output             | Notes                                                                                                                  |
| ----------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `createEllipse(config)` | `Feature<Polygon>` | Optional `rotation` in radians, configurable `segments` (default 64)                                                   |
| `createSector(config)`  | `Feature<Polygon>` | Pie-slice (apex-arc-apex). `startAngle < endAngle ≤ start + 2π`                                                        |
| `createDonut(config)`   | `Feature<Polygon>` | Two rings: outer CCW, inner CW (right-hand rule). Renders as an annular band with the basemap visible through the hole |

Coordinates are emitted in `EPSG:4326` (lon/lat) using a local tangent-plane projection. Accurate up to ~100 km from the center; for very large radii or polar regions, geodesic-correct math is on the Phase 3 roadmap.

### MIL-STD-2525 symbols

`createMilSymbol` lazy-loads `milsymbol` on first use and returns a `Feature<Point>` with style metadata (`feature.style.icon`) so the vector layer renders it as an `ol/style/Icon`. The library is declared as an **optional peer dependency** — install it only if you use this helper:

```bash
npm install milsymbol
```

```ts
const symbol = await ml.createMilSymbol({
  sidc: 'SFGPUCI-----', // friendly infantry, ground unit
  position: [-3.7, 40.42],
  size: 36,
  uniqueDesignation: 'A1',
});
```

Three flavors:

- **`createMilSymbol(config)`** — async; lazy-loads on first call.
- **`createMilSymbolSync(config)`** — sync; throws if `milsymbol` is not loaded yet.
- **`preloadMilsymbol()`** — fire-and-forget on app init to make the first symbol render synchronous.

The service throws clearly on non-browser environments (`createMilSymbol` requires `window`).

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

// Add military features — pure-math helpers + lazy-loaded milsymbol
import { OlMilitaryService, withMilitary } from '@angular-helpers/openlayers/military';
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
