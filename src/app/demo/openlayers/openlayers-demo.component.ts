import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  inputBinding,
  output,
  outputBinding,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { OlMapComponent, OlMapService } from '@angular-helpers/openlayers/core';
import { fromLonLat, transformExtent } from 'ol/proj';
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
import {
  OlPopupComponent,
  OlPopupService,
  OlTooltipDirective,
} from '@angular-helpers/openlayers/overlays';
import { OlMilitaryService } from '@angular-helpers/openlayers/military';
import type { BasemapConfig, LayerSwitcherItem } from '@angular-helpers/openlayers/controls';
import type { Feature } from '@angular-helpers/openlayers/core';

@Component({
  selector: 'app-demo-city-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-base-100 border border-base-300 rounded-lg shadow-md p-3 min-w-[180px] text-sm">
      <div class="font-semibold text-base-content">{{ name() }}</div>
      <div class="text-base-content/70 text-xs mt-1">
        Population: {{ population().toLocaleString() }}
      </div>
      <button class="btn btn-xs btn-ghost mt-2" (click)="closed.emit()">Close</button>
    </div>
  `,
})
export class DemoCityCardComponent {
  readonly name = input.required<string>();
  readonly population = input.required<number>();
  readonly closed = output<void>();
}

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
    OlPopupComponent,
    OlTooltipDirective,
  ],
  styles: [
    `
      .ol-demo-toolbar {
        display: flex;
        gap: 4px;
        padding: 6px;
        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

        .ol-demo-toolbar__btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          background: #f5f5f5;
          color: #333;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition:
            background 0.15s,
            color 0.15s;

          &:hover {
            background: #e0e0e0;
          }

          &:focus-visible {
            outline: 2px solid #1976d2;
            outline-offset: 1px;
          }
        }

        .ol-demo-toolbar__btn--sm {
          width: 28px;
          height: 28px;
        }

        .ol-demo-toolbar__btn--active {
          background: #1976d2;
          color: white;

          &:hover {
            background: #1565c0;
          }
        }

        .ol-demo-toolbar__btn--active-secondary {
          background: #e3f2fd;
          color: #1976d2;

          &:hover {
            background: #bbdefb;
          }
        }

        .ol-demo-toolbar__divider {
          width: 1px;
          margin: 4px 2px;
          background: #e0e0e0;
        }
      }
    `,
  ],
  providers: [
    OlMapService,
    OlLayerService,
    OlInteractionService,
    InteractionStateService,
    SelectInteractionService,
    DrawInteractionService,
    ModifyInteractionService,
    OlPopupService,
    OlMilitaryService,
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

              <!-- Vector Layer: City pins (with hover tooltip showing the name property) -->
              <ol-vector-layer
                id="cities"
                [features]="cityFeatures()"
                [zIndex]="10"
                [visible]="true"
                [olTooltip]="'name'"
                [olTooltipLayer]="'cities'"
              >
              </ol-vector-layer>

              <!-- Declarative popup bound to the selected city -->
              <ol-popup
                [position]="selectedCityCoord()"
                [closeButton]="true"
                [autoPan]="true"
                (closed)="clearSelection()"
              >
                @if (selectedCityInfo(); as info) {
                  <div
                    class="bg-base-100 border border-base-300 rounded-lg shadow-md p-3 min-w-[200px]"
                  >
                    <div class="font-semibold text-base-content">{{ info.name }}</div>
                    <div class="text-base-content/70 text-xs mt-1">
                      Population: {{ info.population.toLocaleString() }}
                    </div>
                  </div>
                }
              </ol-popup>

              <!-- Vector Layer: Drawn features — OL Draw manages this source directly -->
              <ol-vector-layer id="drawn-features" [zIndex]="11" [visible]="true">
              </ol-vector-layer>

              <!-- Vector Layer: Military symbology (NATO symbols + ellipse / sector / donut) -->
              <ol-vector-layer
                id="military"
                [features]="militaryFeatures()"
                [zIndex]="12"
                [visible]="true"
              >
              </ol-vector-layer>
            </ol-map>

            <!-- Interaction Controls (floating over map at bottom center) -->
            <div
              class="ol-demo-toolbar absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex flex-row gap-1"
            >
              <!-- Select Toggle -->
              <button
                class="ol-demo-toolbar__btn"
                [class.ol-demo-toolbar__btn--active]="selectActive()"
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
                class="ol-demo-toolbar__btn"
                [class.ol-demo-toolbar__btn--active]="drawActive()"
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
                class="ol-demo-toolbar__btn"
                [class.ol-demo-toolbar__btn--active]="modifyActive()"
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
                  class="ol-demo-toolbar__btn"
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
                <div class="ol-demo-toolbar__divider"></div>
                <div class="flex flex-row gap-1">
                  <button
                    class="ol-demo-toolbar__btn ol-demo-toolbar__btn--sm"
                    [class.ol-demo-toolbar__btn--active-secondary]="drawType() === 'Polygon'"
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
                    class="ol-demo-toolbar__btn ol-demo-toolbar__btn--sm"
                    [class.ol-demo-toolbar__btn--active-secondary]="drawType() === 'LineString'"
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
                    class="ol-demo-toolbar__btn ol-demo-toolbar__btn--sm"
                    [class.ol-demo-toolbar__btn--active-secondary]="drawType() === 'Point'"
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
                    class="ol-demo-toolbar__btn ol-demo-toolbar__btn--sm"
                    [class.ol-demo-toolbar__btn--active-secondary]="drawType() === 'Circle'"
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
            @if (interactionService.selectionCount() > 0 || drawnCount() > 0) {
              <div class="absolute bottom-2 left-2 z-[1000] flex gap-2">
                @if (interactionService.selectionCount() > 0) {
                  <span class="badge badge-sm badge-primary">
                    {{ interactionService.selectionCount() }} selected
                  </span>
                }
                @if (drawnCount() > 0) {
                  <span class="badge badge-sm badge-secondary"> {{ drawnCount() }} drawn </span>
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
            <button class="btn btn-sm btn-accent" (click)="openRandomCityComponentPopup()">
              🎯 Random component popup
            </button>
          </div>

          <!-- Military Controls -->
          <div class="flex flex-wrap gap-2 pt-2 border-t border-base-300 mt-2">
            <span class="text-sm text-base-content/70 self-center mr-2">Military:</span>
            <button
              class="btn btn-sm btn-warning"
              [disabled]="loadingSymbol()"
              (click)="addRandomSymbol()"
            >
              ➕ Symbol
            </button>
            <button class="btn btn-sm btn-warning btn-outline" (click)="addEllipse()">
              ➕ Ellipse
            </button>
            <button class="btn btn-sm btn-warning btn-outline" (click)="addSector()">
              ➕ Sector
            </button>
            <button class="btn btn-sm btn-warning btn-outline" (click)="addDonut()">
              ➕ Donut
            </button>
            @if (militaryFeatures().length > 0) {
              <button class="btn btn-sm btn-ghost" (click)="clearMilitary()">
                🧹 Clear ({{ militaryFeatures().length }})
              </button>
            }
          </div>

          <!-- City Controls -->
          <div class="flex flex-wrap gap-2 pt-2 border-t border-base-300 mt-2">
            <span class="text-sm text-base-content/70 self-center mr-2">Cities:</span>
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
  private popupService = inject(OlPopupService);
  private militaryService = inject(OlMilitaryService);
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

  // Count of drawn features (OL Draw manages the actual source directly)
  drawnCount = signal<number>(0);

  // Military features layer — driven by the military service helpers.
  militaryFeatures = signal<Feature[]>([]);

  // Lock the Symbol button while milsymbol is being lazy-loaded for the
  // very first call.
  loadingSymbol = signal<boolean>(false);

  // Selected city derived from the Select interaction's first selected feature.
  selectedCity = computed(() => {
    const selected = this.interactionService.selectedFeatures();
    if (selected.length === 0) return null;
    const first = selected[0];
    return this.cityFeatures().find((c) => c.id === first.id) ?? null;
  });

  // Map coordinate (in EPSG:3857) where the popup anchors. `null` hides it.
  selectedCityCoord = computed<[number, number] | null>(() => {
    const city = this.selectedCity();
    if (!city) return null;
    return fromLonLat(city.geometry.coordinates as [number, number]) as [number, number];
  });

  // Strongly-typed view of the selected city's properties for the template.
  selectedCityInfo = computed<{ name: string; population: number } | null>(() => {
    const city = this.selectedCity();
    if (!city) return null;
    return {
      name: String(city.properties?.['name'] ?? city.id),
      population: Number(city.properties?.['population'] ?? 0),
    };
  });

  constructor() {
    // Initialize default basemap on component creation
    this.createBasemapLayer('osm');

    // Track draw count — Draw adds to the OL source directly, we only count
    this.interactionService.drawEnd$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.drawnCount.update((n) => n + 1));
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
      this.interactionService.enableSelect('demo-select', {
        layers: ['cities', 'drawn-features'],
        multi: true,
      });
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
        source: 'drawn-features',
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
      this.interactionService.enableModify('demo-modify', { source: 'drawn-features' });
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
        source: 'drawn-features',
      });
    }
  }

  clearDrawnFeatures(): void {
    this.layerService.clearFeatures('drawn-features');
    this.drawnCount.set(0);
  }

  clearSelection(): void {
    this.interactionService.clearSelection();
  }

  // ---------------------------------------------------------------------------
  // Military symbology demo
  // ---------------------------------------------------------------------------

  /**
   * Drop a random NATO friendly-infantry symbol on Madrid. The first call
   * lazy-loads `milsymbol`; subsequent ones are sub-millisecond.
   */
  async addRandomSymbol(): Promise<void> {
    this.loadingSymbol.set(true);
    try {
      const symbol = await this.militaryService.createMilSymbol({
        sidc: 'SFGPUCI-----',
        position: [-3.7 + (Math.random() - 0.5) * 0.4, 40.42 + (Math.random() - 0.5) * 0.3],
        size: 36,
        uniqueDesignation: 'A1',
      });
      this.militaryFeatures.update((prev) => [...prev, symbol]);
    } finally {
      this.loadingSymbol.set(false);
    }
  }

  /** Add a defensive ellipse around Barcelona. */
  addEllipse(): void {
    const ellipse = this.militaryService.createEllipse({
      center: [2.17, 41.38],
      semiMajor: 6_000,
      semiMinor: 3_000,
      rotation: Math.PI / 6,
    });
    this.militaryFeatures.update((prev) => [...prev, ellipse]);
  }

  /** Add a 60° sector north of Valencia. */
  addSector(): void {
    const sector = this.militaryService.createSector({
      center: [-0.38, 39.47],
      radius: 8_000,
      startAngle: Math.PI / 6,
      endAngle: Math.PI / 2,
    });
    this.militaryFeatures.update((prev) => [...prev, sector]);
  }

  /** Add a range-ring donut (5–10 km) around Sevilla. */
  addDonut(): void {
    const donut = this.militaryService.createDonut({
      center: [-5.99, 37.39],
      innerRadius: 5_000,
      outerRadius: 10_000,
    });
    this.militaryFeatures.update((prev) => [...prev, donut]);
  }

  /** Empty the military layer. */
  clearMilitary(): void {
    this.militaryFeatures.set([]);
  }

  /**
   * Programmatic popup demo — opens a dynamically instantiated
   * `DemoCityCardComponent` at a random city via `OlPopupService.openComponent()`,
   * then centers the view on that location.
   */
  openRandomCityComponentPopup(): void {
    const cities = this.cityFeatures();
    if (cities.length === 0) return;
    const city = cities[Math.floor(Math.random() * cities.length)];
    const lonLat = city.geometry.coordinates as [number, number];
    const position = fromLonLat(lonLat) as [number, number];
    const id = 'random-city';

    const handle = this.popupService.openComponent({
      id,
      position,
      component: DemoCityCardComponent,
      autoPan: true,
      offset: [0, -12],
      bindings: [
        inputBinding('name', () => String(city.properties?.['name'] ?? city.id)),
        inputBinding('population', () => Number(city.properties?.['population'] ?? 0)),
        outputBinding<void>('closed', () => handle.close()),
      ],
    });

    // Center the view on the popup location
    this.mapService.animateView({ center: lonLat, zoom: 12 });
  }
}
