import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OlMapComponent, OlMapService } from '@angular-helpers/openlayers/core';
import { transformExtent } from 'ol/proj';
import {
  OlVectorLayerComponent,
  OlLayerService,
  type TileLayerConfig,
} from '@angular-helpers/openlayers/layers';
import {
  OlZoomControlComponent,
  OlAttributionControlComponent,
  OlScaleLineControlComponent,
  OlFullscreenControlComponent,
  OlRotateControlComponent,
  OlLayerSwitcherComponent,
  OlBasemapSwitcherComponent,
  ROTATE_CONTROL_MAP_SERVICE,
} from '@angular-helpers/openlayers/controls';
import {
  OlInteractionService,
  InteractionStateService,
  SelectInteractionService,
  DrawInteractionService,
  ModifyInteractionService,
} from '@angular-helpers/openlayers/interactions';
import type { BasemapConfig, LayerSwitcherItem } from '@angular-helpers/openlayers/controls';
import type { Feature } from '@angular-helpers/openlayers/core';
import type { DrawEndEvent } from '@angular-helpers/openlayers/interactions';

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
    OlVectorLayerComponent,
    OlZoomControlComponent,
    OlAttributionControlComponent,
    OlScaleLineControlComponent,
    OlFullscreenControlComponent,
    OlRotateControlComponent,
    OlLayerSwitcherComponent,
    OlBasemapSwitcherComponent,
  ],
  providers: [
    OlMapService,
    OlLayerService,
    OlInteractionService,
    InteractionStateService,
    SelectInteractionService,
    DrawInteractionService,
    ModifyInteractionService,
    // Provide the rotate control with access to map service
    { provide: ROTATE_CONTROL_MAP_SERVICE, useExisting: OlMapService },
  ],
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
              <ol-layer-switcher
                position="top-right"
                [layers]="layerSwitcherItems()"
                [collapsible]="true"
                [showOpacity]="true"
                (visibilityChange)="onLayerVisibilityChange($event)"
                (opacityChange)="onLayerOpacityChange($event)"
              >
              </ol-layer-switcher>

              <!-- Basemap Switcher -->
              <ol-basemap-switcher
                position="top-center"
                [basemaps]="basemaps"
                [activeBasemap]="activeBasemap()"
                (basemapChange)="onBasemapChange($event)"
              >
              </ol-basemap-switcher>

              <!-- Vector Layer: Cities + Drawn Features -->
              <ol-vector-layer
                id="cities"
                [features]="allFeatures()"
                [zIndex]="10"
                [visible]="true"
              >
              </ol-vector-layer>
            </ol-map>

            <!-- Interaction Controls (floating over map) -->
            <div
              class="absolute top-20 left-2 z-[1000] flex flex-col gap-1 bg-base-100/90 backdrop-blur rounded-lg p-2 shadow-lg border border-base-300"
            >
              <!-- Select Toggle -->
              <button
                class="btn btn-square btn-sm"
                [class.btn-primary]="selectActive()"
                [class.btn-ghost]="!selectActive()"
                (click)="toggleSelect()"
                title="Select Features"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                </svg>
              </button>

              <!-- Draw Toggle -->
              <button
                class="btn btn-square btn-sm"
                [class.btn-primary]="drawActive()"
                [class.btn-ghost]="!drawActive()"
                (click)="toggleDraw()"
                title="Draw {{ drawType() }}"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </button>

              <!-- Modify Toggle -->
              <button
                class="btn btn-square btn-sm"
                [class.btn-primary]="modifyActive()"
                [class.btn-ghost]="!modifyActive()"
                (click)="toggleModify()"
                title="Modify Features"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>

              @if (selectActive() && interactionService.hasSelection()) {
                <button
                  class="btn btn-square btn-sm btn-ghost"
                  (click)="clearSelection()"
                  title="Clear Selection"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              }

              <!-- Draw Type Selector - only when draw is active -->
              @if (drawActive()) {
                <div class="border-t border-base-300 my-1 pt-1"></div>
                <div class="flex flex-col gap-1">
                  <button
                    class="btn btn-square btn-xs"
                    [class.btn-secondary]="drawType() === 'Polygon'"
                    [class.btn-ghost]="drawType() !== 'Polygon'"
                    (click)="onDrawTypeClick('Polygon')"
                    title="Polygon"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M12 2l10 6v10l-10 6-10-6V8z" />
                    </svg>
                  </button>
                  <button
                    class="btn btn-square btn-xs"
                    [class.btn-secondary]="drawType() === 'LineString'"
                    [class.btn-ghost]="drawType() !== 'LineString'"
                    (click)="onDrawTypeClick('LineString')"
                    title="Line"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M5 19L19 5" />
                    </svg>
                  </button>
                  <button
                    class="btn btn-square btn-xs"
                    [class.btn-secondary]="drawType() === 'Point'"
                    [class.btn-ghost]="drawType() !== 'Point'"
                    (click)="onDrawTypeClick('Point')"
                    title="Point"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  </button>
                  <button
                    class="btn btn-square btn-xs"
                    [class.btn-secondary]="drawType() === 'Circle'"
                    [class.btn-ghost]="drawType() !== 'Circle'"
                    (click)="onDrawTypeClick('Circle')"
                    title="Circle"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </button>
                </div>
              }
            </div>

            <!-- Status Badge -->
            @if (interactionService.selectionCount() > 0 || drawnFeatures().length > 0) {
              <div class="absolute bottom-2 left-2 z-[1000] flex gap-2">
                @if (interactionService.selectionCount() > 0) {
                  <span class="badge badge-sm badge-primary">
                    {{ interactionService.selectionCount() }} selected
                  </span>
                }
                @if (drawnFeatures().length > 0) {
                  <span class="badge badge-sm badge-secondary">
                    {{ drawnFeatures().length }} drawn
                  </span>
                  <button
                    class="badge badge-sm badge-ghost cursor-pointer"
                    (click)="clearDrawnFeatures()"
                  >
                    Clear
                  </button>
                }
              </div>
            }
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
            <button class="btn btn-sm btn-primary" (click)="fitToCities()">
              🗺️ View all cities
            </button>
            <button class="btn btn-sm btn-outline" (click)="jumpTo([2.17, 41.38], 12)">
              Barcelona
            </button>
            <button class="btn btn-sm btn-outline" (click)="jumpTo([-3.7, 40.42], 12)">
              Madrid
            </button>
            <button class="btn btn-sm btn-outline" (click)="jumpTo([-0.38, 39.47], 12)">
              Valencia
            </button>
            <button class="btn btn-sm btn-outline" (click)="jumpTo([-5.98, 37.39], 12)">
              Sevilla
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
  private layerService = inject(OlLayerService);
  private mapService = inject(OlMapService);
  readonly interactionService = inject(OlInteractionService);
  protected basemaps = BASEMAPS;

  center = signal<[number, number]>([2.17, 41.38]);
  zoom = signal<number>(12);
  lastClick = signal<{ coordinate: [number, number]; pixel: [number, number] } | null>(null);
  activeBasemap = signal<string>('osm');

  // Interaction state
  selectActive = signal<boolean>(false);
  drawActive = signal<boolean>(false);
  modifyActive = signal<boolean>(false);
  drawType = signal<'Polygon' | 'LineString' | 'Point' | 'Circle'>('Polygon');

  // Track drawn features for display
  drawnFeatures = signal<Feature[]>([]);

  // Combine original cities with drawn features for the layer
  allFeatures = computed<Feature[]>(() => [...this.cityFeatures(), ...this.drawnFeatures()]);

  constructor() {
    // Initialize default basemap on component creation
    this.createBasemapLayer('osm');

    // Subscribe to draw events
    this.interactionService.drawEnd$.subscribe((event: DrawEndEvent) => {
      this.drawnFeatures.update((features) => [...features, event.feature]);
    });

    // React to selection changes automatically via signals
  }

  // Layer switcher items derived from service state
  layerSwitcherItems = computed<LayerSwitcherItem[]>(() => {
    return this.layerService.layers().map((layer) => ({
      id: layer.id,
      name: layer.id.charAt(0).toUpperCase() + layer.id.slice(1),
      type: layer.type,
      visible: layer.visible,
      opacity: layer.opacity,
    }));
  });

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
    this.activeBasemap.set(basemapId);
    this.createBasemapLayer(basemapId);
  }

  private createBasemapLayer(basemapId: string): void {
    // Remove existing basemap layer
    this.layerService.removeLayer('basemap');

    const basemap = this.basemaps.find((b) => b.id === basemapId);
    if (!basemap) return;

    // Add new basemap layer using TileLayerConfig
    const layerConfig: TileLayerConfig = {
      id: 'basemap',
      type: 'tile',
      source: {
        type: basemap.type,
        url: basemap.url,
        params: basemap.params,
        attributions: basemap.attributions,
      },
      zIndex: 0,
      visible: true,
      opacity: 1,
    };
    this.layerService.addLayer(layerConfig);
  }

  onLayerVisibilityChange(event: { id: string; visible: boolean }): void {
    this.layerService.setVisibility(event.id, event.visible);
  }

  onLayerOpacityChange(event: { id: string; opacity: number }): void {
    this.layerService.setOpacity(event.id, event.opacity);
  }

  jumpTo(coords: [number, number], zoom: number): void {
    this.center.set(coords);
    this.zoom.set(zoom);
  }

  fitToCities(): void {
    // Calculate extent from actual city features
    const features = this.cityFeatures();
    if (features.length === 0) return;

    // Get all coordinates
    const coords = features.map((f) => f.geometry.coordinates as [number, number]);
    const lons = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);

    // Calculate bounding box in EPSG:4326
    const extent4326: [number, number, number, number] = [
      Math.min(...lons), // minLon
      Math.min(...lats), // minLat
      Math.max(...lons), // maxLon
      Math.max(...lats), // maxLat
    ];

    // Transform to map projection (EPSG:3857)
    const extent3857 = transformExtent(extent4326, 'EPSG:4326', 'EPSG:3857') as [
      number,
      number,
      number,
      number,
    ];

    // fitExtent now handles the deferral internally
    this.mapService.fitExtent(extent3857, { padding: [60, 60, 60, 60], maxZoom: 8, duration: 600 });
  }

  // Interaction control methods
  toggleSelect(): void {
    const newState = !this.selectActive();
    this.selectActive.set(newState);

    if (newState) {
      this.interactionService.enableSelect('demo-select', { layers: ['cities'], multi: true });
    } else {
      this.interactionService.disableInteraction('demo-select');
    }
  }

  toggleDraw(): void {
    const newState = !this.drawActive();
    this.drawActive.set(newState);

    if (newState) {
      this.interactionService.enableDraw('demo-draw', {
        type: this.drawType(),
        source: 'cities',
      });
    } else {
      this.interactionService.disableInteraction('demo-draw');
    }
  }

  toggleModify(): void {
    const newState = !this.modifyActive();
    this.modifyActive.set(newState);

    if (newState) {
      // Enable select if not active (to select features to modify)
      if (!this.selectActive()) {
        this.toggleSelect();
      }
      this.interactionService.enableModify('demo-modify', { source: 'cities' });
    } else {
      this.interactionService.disableInteraction('demo-modify');
    }
  }

  onDrawTypeClick(type: string): void {
    this.setDrawType(type as 'Polygon' | 'LineString' | 'Point' | 'Circle');
  }

  setDrawType(type: 'Polygon' | 'LineString' | 'Point' | 'Circle'): void {
    this.drawType.set(type);
    // If draw is active, restart with new type
    if (this.drawActive()) {
      this.interactionService.disableInteraction('demo-draw');
      this.interactionService.enableDraw('demo-draw', {
        type,
        source: 'cities',
      });
    }
  }

  clearDrawnFeatures(): void {
    this.drawnFeatures.set([]);
  }

  clearSelection(): void {
    this.interactionService.clearSelection();
  }
}
