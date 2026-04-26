import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OlMapComponent, OlMapService } from '@angular-helpers/openlayers/core';
import {
  OlTileLayerComponent,
  OlVectorLayerComponent,
  OlLayerService,
} from '@angular-helpers/openlayers/layers';
import {
  OlZoomControlComponent,
  OlAttributionControlComponent,
  OlScaleLineControlComponent,
  OlFullscreenControlComponent,
  OlRotateControlComponent,
  OlLayerSwitcherComponent,
  OlBasemapSwitcherComponent,
  type BasemapConfig,
} from '@angular-helpers/openlayers/controls';
import type { Feature } from '@angular-helpers/openlayers/core';

interface City {
  name: string;
  coords: [number, number];
  population: number;
}

const BASEMAPS: BasemapConfig[] = [
  { id: 'osm', name: 'OpenStreetMap', type: 'osm', icon: '🗺️' },
  {
    id: 'satellite',
    name: 'Satellite',
    type: 'xyz',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attributions: 'Tiles © Esri',
    icon: '🛰️',
  },
  {
    id: 'terrain',
    name: 'Terrain',
    type: 'xyz',
    url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attributions: '© OpenTopoMap',
    icon: '⛰️',
  },
];

@Component({
  selector: 'app-openlayers-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    OlMapComponent,
    OlTileLayerComponent,
    OlVectorLayerComponent,
    OlZoomControlComponent,
    OlAttributionControlComponent,
    OlScaleLineControlComponent,
    OlFullscreenControlComponent,
    OlRotateControlComponent,
    OlLayerSwitcherComponent,
    OlBasemapSwitcherComponent,
  ],
  providers: [OlMapService, OlLayerService],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <!-- Header -->
      <header class="mb-8 sm:mb-12">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <span class="text-4xl">🗺️</span>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-base-content m-0">OpenLayers Demo</h1>
            <p class="text-sm sm:text-base text-base-content/80 m-0 mt-1">
              Interactive map with @angular-helpers/openlayers
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="badge badge-primary badge-md">Map Component</span>
          <span class="badge badge-secondary badge-md">Tile Layers</span>
          <span class="badge badge-accent badge-md">Vector Layers</span>
          <span class="badge badge-info badge-md">Controls</span>
        </div>
      </header>

      <!-- Map Card -->
      <div class="bg-base-200 border border-base-300 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
            🌍 Interactive Map
          </h2>
          <span class="badge badge-success">Live</span>
        </div>

        <div class="space-y-4">
          <!-- Map Container -->
          <div class="h-[400px] w-full rounded-lg overflow-hidden border border-base-300 relative">
            <ol-map
              [center]="center()"
              [zoom]="zoom()"
              (viewChange)="onViewChange($event)"
              (mapClick)="onMapClick($event)"
              class="w-full h-full"
            >
              <!-- Controls -->
              <ol-zoom-control [delta]="1"></ol-zoom-control>
              <ol-rotate-control [autoHide]="true"></ol-rotate-control>
              <ol-attribution-control [collapsible]="true"></ol-attribution-control>
              <ol-scale-line-control unit="metric"></ol-scale-line-control>
              <ol-fullscreen-control></ol-fullscreen-control>

              <!-- Layer Switcher -->
              <ol-layer-switcher position="top-right" [collapsible]="true" [showOpacity]="true">
              </ol-layer-switcher>

              <!-- Basemap Switcher -->
              <ol-basemap-switcher
                position="bottom-left"
                [basemaps]="basemaps"
                defaultBasemap="osm"
                (basemapChange)="onBasemapChange($event)"
              >
              </ol-basemap-switcher>

              <!-- Vector Layer: Cities -->
              <ol-vector-layer
                id="cities"
                [features]="cityFeatures()"
                [zIndex]="10"
                [visible]="true"
              >
              </ol-vector-layer>
            </ol-map>
          </div>

          <!-- Info Panel -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-base-100 rounded-lg p-4 border border-base-300">
              <h3 class="text-sm font-semibold text-base-content mb-2">View State</h3>
              <div class="space-y-1 text-sm text-base-content/80 font-mono">
                <div>
                  Center: {{ center()?.[0]?.toFixed(4) ?? '-' }},
                  {{ center()?.[1]?.toFixed(4) ?? '-' }}
                </div>
                <div>Zoom: {{ zoom() }}</div>
              </div>
            </div>

            <div class="bg-base-100 rounded-lg p-4 border border-base-300">
              <h3 class="text-sm font-semibold text-base-content mb-2">Last Click</h3>
              <div class="space-y-1 text-sm text-base-content/80 font-mono">
                @if (lastClick(); as click) {
                  <div>
                    Coord: {{ click.coordinate?.[0]?.toFixed(4) ?? '-' }},
                    {{ click.coordinate?.[1]?.toFixed(4) ?? '-' }}
                  </div>
                  <div>Pixel: {{ click.pixel?.[0] ?? '-' }}, {{ click.pixel?.[1] ?? '-' }}</div>
                } @else {
                  <div class="text-base-content/50">Click on map to see coordinates</div>
                }
              </div>
            </div>
          </div>

          <!-- Quick Navigation -->
          <div class="flex flex-wrap gap-2 pt-2">
            <span class="text-sm text-base-content/70 self-center mr-2">Jump to:</span>
            <button class="btn btn-sm btn-outline" (click)="jumpTo([2.17, 41.38], 12)">
              Barcelona
            </button>
            <button class="btn btn-sm btn-outline" (click)="jumpTo([-0.13, 51.51], 11)">
              London
            </button>
            <button class="btn btn-sm btn-outline" (click)="jumpTo([-74.01, 40.71], 11)">
              New York
            </button>
            <button class="btn btn-sm btn-outline" (click)="jumpTo([139.69, 35.69], 11)">
              Tokyo
            </button>
          </div>
        </div>
      </div>

      <!-- Package Info -->
      <div class="mt-8 bg-base-200 border border-base-300 rounded-xl p-6">
        <h2 class="text-lg font-bold text-base-content mb-4">Package Structure</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div class="bg-base-100 rounded-lg p-3 border border-base-300">
            <code class="text-primary font-semibold">@angular-helpers/openlayers/core</code>
            <p class="text-base-content/70 mt-1">Map component, services, base types</p>
          </div>
          <div class="bg-base-100 rounded-lg p-3 border border-base-300">
            <code class="text-secondary font-semibold">@angular-helpers/openlayers/layers</code>
            <p class="text-base-content/70 mt-1">Tile, vector, image layer components</p>
          </div>
          <div class="bg-base-100 rounded-lg p-3 border border-base-300">
            <code class="text-accent font-semibold">@angular-helpers/openlayers/controls</code>
            <p class="text-base-content/70 mt-1">Zoom, attribution, scale, fullscreen</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OpenLayersDemoComponent {
  protected basemaps = BASEMAPS;

  center = signal<[number, number]>([2.17, 41.38]);
  zoom = signal<number>(12);
  lastClick = signal<{ coordinate: [number, number]; pixel: [number, number] } | null>(null);

  // Sample city features for the vector layer
  cityFeatures = signal<Feature[]>([
    {
      id: 'barcelona',
      geometry: { type: 'Point', coordinates: [2.17, 41.38] },
      properties: { name: 'Barcelona', population: 1600000 },
    },
    {
      id: 'madrid',
      geometry: { type: 'Point', coordinates: [-3.7, 40.42] },
      properties: { name: 'Madrid', population: 3200000 },
    },
    {
      id: 'valencia',
      geometry: { type: 'Point', coordinates: [-0.38, 39.47] },
      properties: { name: 'Valencia', population: 790000 },
    },
    {
      id: 'seville',
      geometry: { type: 'Point', coordinates: [-5.98, 37.39] },
      properties: { name: 'Seville', population: 690000 },
    },
  ]);

  onViewChange(viewState: { center: [number, number]; zoom: number; rotation?: number }): void {
    this.center.set(viewState.center);
    this.zoom.set(viewState.zoom);
  }

  onMapClick(event: { coordinate: [number, number]; pixel: [number, number] }): void {
    this.lastClick.set(event);
  }

  onBasemapChange(basemapId: string): void {
    console.log('Switched to basemap:', basemapId);
  }

  jumpTo(coords: [number, number], zoom: number): void {
    this.center.set(coords);
    this.zoom.set(zoom);
  }
}
