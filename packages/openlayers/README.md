# @angular-helpers/openlayers

A modern Angular wrapper for OpenLayers with modular architecture, standalone components, and a hybrid template/programmatic API.

## Features

- **Standalone Components** - No NgModule boilerplate, use directly in your components
- **Signals Integration** - Native Angular signals for reactive state management
- **Modular Loading** - Import only what you need with AgGrid-style sub-entry points
- **Dual API** - Template for UI, Inputs for data, Services for operations
- **Tree-shaking** - Unused OpenLayers code is eliminated from your bundle
- **TypeScript First** - Full type safety with strict mode support
- **Military Features** - True geodesic precision for ellipses and sectors, NATO symbology, and MGRS coordinates
- **Proj4 Integration** - Declarative registration of local coordinate systems (like UTM)
- **WebGL Accelerated** - Mapbox Vector Tiles (MVT) and GPU raster expressions

## Installation

```bash
pnpm add @angular-helpers/openlayers ol
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
  providers: [
    provideOpenLayers(
      withLayers(),
      withControls(),
      // Optional: Register custom coordinate systems with proj4
      // withProjections(proj4, [{ code: 'EPSG:32630', proj4def: '...', extent: [...] }])
    ),
  ],
};
```

### 2. Use in your component

````typescript
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
## Custom Projections & Coordinate Systems

Available since `0.4.1` in `@angular-helpers/openlayers/core` and `@angular-helpers/openlayers/layers`.

When working with local reference systems (like UTM zones), you can register custom projections globally and pass coordinates in those reference systems directly to `[center]` or `[features]` without manual transforms:

### 1. Register custom projections globally

```typescript
// app.config.ts
import { provideOpenLayers } from '@angular-helpers/openlayers/core';
import { withProjections } from '@angular-helpers/openlayers/core';
import proj4 from 'proj4';

export const appConfig = {
  providers: [
    provideOpenLayers(
      withProjections(proj4, [
        {
          code: 'EPSG:25830', // UTM Zone 30N
          def: '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
          extent: [0, 0, 1000000, 10000000],
        },
      ]),
    ),
  ],
};
````

### 2. Pass local coordinates natively to the map

By setting `[coordinateProjection]` to match the custom projection, the component automatically bypasses longitude/latitude conversion, feeding UTM coordinates directly into OpenLayers:

```html
<ol-map
  [projection]="'EPSG:25830'"
  [coordinateProjection]="'EPSG:25830'"
  [center]="[440291, 4474255]" <!-- Madrid UTM Zone 30 coordinates -->
  [zoom]="12"
  (viewChange)="onViewChange($event)"
>
  <ol-vector-layer
    id="shapes"
    [features]="utmFeatures()"
    [coordinateProjection]="'EPSG:25830'"
  />
</ol-map>
```

---

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

## WebGL Layers — GPU-accelerated rendering

Available since `0.3.0` from `@angular-helpers/openlayers/layers`.

WebGL layers render directly on the GPU, making them perfect for extremely heavy tile configurations (with real-time styling expressions) and massive coordinate datasets (10,000+ vector points).

### `<ol-webgl-tile-layer>` — Raster style manipulation

Renders tile layers (OSM, XYZ, MVT) via WebGL. Supports the dynamic application of WebGL tile styles (raster expressions) for dynamic, GPU-powered adjustments like brightness, contrast, saturation, and gamma.

```html
<ol-webgl-tile-layer
  id="satellite-webgl"
  source="xyz"
  [url]="'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'"
  [tileStyle]="{
    brightness: 0.1,
    contrast: 0.2,
    saturation: -0.5
  }"
/>
```

### `<ol-webgl-vector-layer>` — Smooth massive datasets (10k+ features)

Renders points, lines, and polygons using WebGL 2. For peak performance, hit detection is disabled by default, and styling must be declared using `FlatStyleLike` expressions rather than standard `ol/style/Style` instances.

```html
<ol-webgl-vector-layer
  id="massive-points"
  [features]="densePoints()"
  [flatStyle]="{
    'circle-radius': 6,
    'circle-fill-color': '#10b981',
    'stroke-color': '#334155',
    'stroke-width': 1
  }"
  [disableHitDetection]="true"
/>
```

Rigorous cleanup guarantees that WebGL contexts, framebuffers, and active buffers are fully released on destroy (`layer.dispose()`), preventing GPU leaks.

## Geodesic Geometry Helpers

Available from `@angular-helpers/openlayers/core` via `OlGeometryService`.

Approximates standard shapes in metric space using true geodesic calculations (`Vincenty`'s formulae via `ol/sphere`). This means your shapes remain mathematically accurate and visually consistent (without map projection scale distortion) across massive global distances.

```typescript
import { inject, Component, signal } from '@angular/core';
import { OlGeometryService } from '@angular-helpers/openlayers/core';
import type { Feature } from '@angular-helpers/openlayers/core';

@Component({
  imports: [OlMapComponent, OlVectorLayerComponent],
  template: `
    <ol-map [center]="[2.17, 41.38]" [zoom]="8">
      <ol-tile-layer id="osm" source="osm" />
      <ol-vector-layer id="shapes" [features]="features()" />
    </ol-map>
  `,
})
export class GeodesicDemo {
  private geomSvc = inject(OlGeometryService);
  features = signal<Feature[]>([]);

  ngOnInit() {
    const ellipse = this.geomSvc.createEllipse({
      center: [2.17, 41.38],
      semiMajor: 6_000,
      semiMinor: 3_000,
      rotation: Math.PI / 6,
    });
    const sector = this.geomSvc.createSector({
      center: [-0.38, 39.47],
      radius: 8_000,
      startAngle: Math.PI / 6,
      endAngle: Math.PI / 2,
    });
    const donut = this.geomSvc.createDonut({
      center: [-5.99, 37.39],
      innerRadius: 5_000,
      outerRadius: 10_000,
    });
    this.features.set([ellipse, sector, donut]);
  }
}
```

| Method                  | Output             | Notes                                                                                                                  |
| ----------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `createEllipse(config)` | `Feature<Polygon>` | Optional `rotation` in radians, configurable `segments` (default 64)                                                   |
| `createSector(config)`  | `Feature<Polygon>` | Pie-slice (apex-arc-apex). `startAngle < endAngle ≤ start + 2π`                                                        |
| `createDonut(config)`   | `Feature<Polygon>` | Two rings: outer CCW, inner CW (right-hand rule). Renders as an annular band with the basemap visible through the hole |

---

## Military Symbology & Tactical Graphics

Available since `0.4.0` from `@angular-helpers/openlayers/military`.

Exposes NATO MIL-STD-2525 symbol rendering backed by the optional [`milsymbol`](https://github.com/spatialillusions/milsymbol) peer dependency, plus tactical military graphic components (frontlines, attack vectors).

### MIL-STD-2525 Point Symbology (`OlMilitaryService`)

Lazy-loads the heavy `milsymbol` package dynamically on demand, returning a styled `Feature<Point>` so the vector layer renders it natively.

```typescript
import { inject, Component, signal } from '@angular/core';
import { OlMilitaryService } from '@angular-helpers/openlayers/military';
import type { Feature } from '@angular-helpers/openlayers/core';

@Component({
  imports: [OlMapComponent, OlVectorLayerComponent],
  providers: [OlMilitaryService],
  template: `
    <ol-map [center]="[-3.7, 40.42]" [zoom]="8">
      <ol-vector-layer id="military" [features]="features()" />
    </ol-map>
  `,
})
export class MilDemo {
  private milSvc = inject(OlMilitaryService);
  features = signal<Feature[]>([]);

  async ngOnInit() {
    const symbol = await this.milSvc.createMilSymbol({
      sidc: 'SFGPUCI-----', // Friendly Infantry Unit
      position: [-3.7, 40.42],
      size: 36,
    });
    this.features.set([symbol]);
  }
}
```

Install the optional peer dependency if utilizing NATO symbology:

```bash
pnpm add milsymbol
```

Three execution strategies:

- **`createMilSymbol(config)`** — async; lazy-loads on first call.
- **`createMilSymbolSync(config)`** — sync; throws if `milsymbol` is not loaded yet.
- **`preloadMilsymbol()`** — fire-and-forget on app init to make the first symbol render synchronous.

The service throws clearly on non-browser environments (`createMilSymbol` requires `window`).

### Tactical Graphics (`OlTacticalGraphicsService`)

Builds advanced multi-point military tactical graphic features (frontlines with directional teeth, attack arrow coordinates) and provides custom styles.

```typescript
import { OlTacticalGraphicsService } from '@angular-helpers/openlayers/military';

const tacticalSvc = inject(OlTacticalGraphicsService);

// Create a frontline graphic
const frontline = tacticalSvc.createFrontLine(
  [
    [2.1, 41.3],
    [2.2, 41.4],
  ],
  'friendly',
);

// Apply specialized style for frontline teeth
const frontlineStyle = tacticalSvc.createFrontLineStyle('#4f46e5', 'friendly');
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
