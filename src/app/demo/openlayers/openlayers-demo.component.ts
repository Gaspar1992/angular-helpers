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
  OlClusterComponent,
  OlHeatmapLayerComponent,
  OlLayerService,
} from '@angular-helpers/openlayers/layers';
import type { TileLayerConfig } from '@angular-helpers/openlayers/layers';
import {
  OlZoomControlComponent,
  OlAttributionControlComponent,
  OlScaleLineControlComponent,
  OlFullscreenControlComponent,
  OlRotateControlComponent,
  OlLayerSwitcherComponent,
  OlBasemapSwitcherComponent,
  OlGeolocationControlComponent,
  ROTATE_CONTROL_MAP_SERVICE,
} from '@angular-helpers/openlayers/controls';
import {
  OlInteractionService,
  InteractionStateService,
  SelectInteractionService,
  DrawInteractionService,
  ModifyInteractionService,
  MeasurementInteractionService,
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
    OlClusterComponent,
    OlZoomControlComponent,
    OlAttributionControlComponent,
    OlScaleLineControlComponent,
    OlFullscreenControlComponent,
    OlRotateControlComponent,
    OlLayerSwitcherComponent,
    OlBasemapSwitcherComponent,
    OlGeolocationControlComponent,
    OlHeatmapLayerComponent,
    OlPopupComponent,
    OlTooltipDirective,
  ],
  styles: [
    `
      .ol-demo-toolbar {
        display: flex;
        gap: 6px;
        padding: 8px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.4);

        @media (prefers-color-scheme: dark) {
          background: rgba(30, 35, 42, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .ol-demo-toolbar__btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          min-width: 36px;
          height: 40px;
          padding: 0 16px;
          background: transparent;
          color: currentColor;
          border: 1px solid transparent;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

          &:hover {
            background: rgba(0, 0, 0, 0.05);
            @media (prefers-color-scheme: dark) {
              background: rgba(255, 255, 255, 0.1);
            }
          }

          &:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }
        }

        .ol-demo-toolbar__btn--sm {
          height: 36px;
          padding: 0 12px;
          font-size: 13px;
        }

        .ol-demo-toolbar__btn--active {
          background: #3b82f6;
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

          &:hover {
            background: #2563eb;
          }
        }

        .ol-demo-toolbar__btn--active-secondary {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.3);

          @media (prefers-color-scheme: dark) {
            background: rgba(59, 130, 246, 0.25);
            color: #60a5fa;
          }

          &:hover {
            background: rgba(59, 130, 246, 0.25);
          }
        }

        .ol-demo-toolbar__divider {
          width: 1px;
          margin: 6px 4px;
          background: rgba(150, 150, 150, 0.3);
        }
      }
    `,
  ],
  providers: [
    // Feature-specific services that should be provided globally or via their respective feature packages
    // For demo purposes, we provide them here if they aren't globally provided.
    // OlMapService, OlLayerService, OlInteractionService, etc. should ideally be loaded in app.config.ts
    // but the demo isolates them to prevent polluting other routes.
    OlMapService,
    OlLayerService,
    OlInteractionService,
    InteractionStateService,
    SelectInteractionService,
    DrawInteractionService,
    ModifyInteractionService,
    MeasurementInteractionService,
    OlPopupService,
    OlMilitaryService,
    // Provide the rotate control with access to map service
    { provide: ROTATE_CONTROL_MAP_SERVICE, useExisting: OlMapService },
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-10 min-h-screen bg-base-100/50">
      <!-- Premium Header -->
      <header
        class="mb-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div class="flex items-center gap-4">
          <div
            class="p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl shadow-inner"
          >
            <span class="text-4xl sm:text-5xl drop-shadow-md">🗺️</span>
          </div>
          <div>
            <h1
              class="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent m-0"
            >
              OpenLayers Demo
            </h1>
            <p class="text-base sm:text-lg text-base-content/70 m-0 mt-2 font-medium">
              High-performance interactive maps with Angular Signals
            </p>
          </div>
        </div>
        <div class="flex flex-wrap justify-center sm:justify-end gap-2 max-w-[300px]">
          <span class="badge badge-primary badge-outline badge-md font-semibold"
            >Map Component</span
          >
          <span class="badge badge-secondary badge-outline badge-md font-semibold"
            >Tile Layers</span
          >
          <span class="badge badge-accent badge-outline badge-md font-semibold">Vector Layers</span>
          <span class="badge badge-info badge-outline badge-md font-semibold">Controls</span>
        </div>
      </header>

      <!-- Main Map Stage -->
      <div
        class="relative w-full h-[650px] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-base-300/50 mb-8 bg-base-300"
      >
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
          <ol-geolocation-control position="top-right"></ol-geolocation-control>

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
            [visible]="layerVisibility()['cities']"
            [olTooltip]="'name'"
            [olTooltipLayer]="'cities'"
          >
          </ol-vector-layer>

          <ol-heatmap-layer
            id="heatmap"
            [features]="cityFeatures()"
            [zIndex]="9"
            [visible]="layerVisibility()['heatmap']"
            [blur]="15"
            [radius]="25"
            weight="population"
          >
          </ol-heatmap-layer>

          <!-- Declarative popup bound to the selected city -->
          <ol-popup
            [position]="selectedCityCoord()"
            [closeButton]="true"
            [autoPan]="true"
            (closed)="clearSelection()"
          >
            @if (selectedCityInfo(); as info) {
              <div
                class="bg-base-100/95 backdrop-blur-md border border-base-300 rounded-xl shadow-xl p-4 min-w-[220px]"
              >
                <div class="font-bold text-lg text-base-content">{{ info.name }}</div>
                <div class="divider my-1"></div>
                <div class="flex justify-between items-center text-sm">
                  <span class="text-base-content/60">Population</span>
                  <span class="font-mono font-medium">{{ info.population.toLocaleString() }}</span>
                </div>
              </div>
            }
          </ol-popup>

          <!-- Vector Layer: Drawn features — OL Draw manages this source directly -->
          <ol-vector-layer
            id="drawn-features"
            [zIndex]="11"
            [visible]="layerVisibility()['drawn-features']"
          >
          </ol-vector-layer>

          <!-- Vector Layer: Military symbology (NATO symbols + ellipse / sector / donut) -->
          <ol-vector-layer
            id="military"
            [features]="militaryFeatures()"
            [zIndex]="12"
            [visible]="layerVisibility()['military']"
          >
            <ol-cluster [distance]="40" [showCount]="true"></ol-cluster>
          </ol-vector-layer>
        </ol-map>

        <!-- Premium Glassmorphic Toolbar (floating over map) -->
        <div class="ol-demo-toolbar absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
          <!-- Select Toggle -->
          <button
            class="ol-demo-toolbar__btn"
            [class.ol-demo-toolbar__btn--active]="selectActive()"
            (click)="toggleSelect()"
            title="Select Features"
            aria-label="Select tool"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>
            <span>Select</span>
          </button>

          <!-- Draw Toggle -->
          <button
            class="ol-demo-toolbar__btn"
            [class.ol-demo-toolbar__btn--active]="drawActive()"
            (click)="toggleDraw()"
            title="Draw {{ drawType() }}"
            aria-label="Draw tool"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            <span>Draw</span>
          </button>

          <!-- Modify Toggle -->
          <button
            class="ol-demo-toolbar__btn"
            [class.ol-demo-toolbar__btn--active]="modifyActive()"
            (click)="toggleModify()"
            title="Modify Features"
            aria-label="Modify tool"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
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
            <span>Modify</span>
          </button>

          <button
            class="ol-demo-toolbar__btn"
            [class.ol-demo-toolbar__btn--active]="measureActive()"
            (click)="toggleMeasure()"
            title="Measure Distance/Area"
            aria-label="Measure tool"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
            <span>Measure</span>
          </button>

          @if (selectActive() && interactionService.hasSelection()) {
            <button
              class="ol-demo-toolbar__btn text-error hover:bg-error/10 hover:text-error"
              (click)="clearSelection()"
              aria-label="Clear selection"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              <span>Clear</span>
            </button>
          }

          <!-- Draw Type Selector -->
          @if (drawActive()) {
            <div class="ol-demo-toolbar__divider"></div>
            <div class="flex flex-row gap-1 items-center px-1">
              <button
                class="ol-demo-toolbar__btn ol-demo-toolbar__btn--sm"
                [class.ol-demo-toolbar__btn--active-secondary]="drawType() === 'Polygon'"
                (click)="onDrawTypeClick('Polygon')"
                title="Polygon"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
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
                  width="16"
                  height="16"
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
                  width="16"
                  height="16"
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
                  width="16"
                  height="16"
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

          <!-- Measure Type Selector -->
          @if (measureActive()) {
            <div class="ol-demo-toolbar__divider"></div>
            <div class="flex flex-row gap-1 items-center px-1">
              <button
                class="ol-demo-toolbar__btn ol-demo-toolbar__btn--sm"
                [class.ol-demo-toolbar__btn--active-secondary]="measureType() === 'Polygon'"
                (click)="onMeasureTypeClick('Polygon')"
                title="Area"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M12 2l10 6v10l-10 6-10-6V8z" />
                </svg>
                Area
              </button>
              <button
                class="ol-demo-toolbar__btn ol-demo-toolbar__btn--sm"
                [class.ol-demo-toolbar__btn--active-secondary]="measureType() === 'LineString'"
                (click)="onMeasureTypeClick('LineString')"
                title="Distance"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M5 19L19 5" />
                </svg>
                Dist
              </button>
            </div>
          }
        </div>

        <!-- Floating Status Badges -->
        @if (interactionService.selectionCount() > 0 || drawnCount() > 0) {
          <div class="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
            @if (interactionService.selectionCount() > 0) {
              <div
                class="badge badge-primary shadow-md font-medium px-3 py-3 rounded-lg border-none backdrop-blur-md bg-primary/90 text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4 mr-1.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                {{ interactionService.selectionCount() }} selected
              </div>
            }
            @if (drawnCount() > 0) {
              <div
                class="flex items-center gap-1 badge badge-secondary shadow-md font-medium px-3 py-3 rounded-lg border-none backdrop-blur-md bg-secondary/90 text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4 mr-1.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                {{ drawnCount() }} drawn
                <button
                  class="ml-2 btn btn-xs btn-circle btn-ghost min-h-0 h-5 w-5 bg-black/20 hover:bg-black/40 border-none text-white"
                  (click)="clearDrawnFeatures()"
                  title="Clear drawings"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Dashboard Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Interactive Layers Panel -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          <div class="card bg-base-100 shadow-xl border border-base-200/50">
            <div class="card-body p-6">
              <h2 class="card-title text-xl font-bold flex items-center gap-2 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-primary"
                >
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
                Layer Management
              </h2>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <!-- Cities Layer Card -->
                <div
                  class="rounded-2xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[140px]"
                  [class.shadow-[0_8px_30px_rgba(59,130,246,0.3)]]="activeLayerId() === 'cities'"
                  [class.bg-gradient-to-br]="activeLayerId() === 'cities'"
                  [class.from-primary]="activeLayerId() === 'cities'"
                  [class.to-blue-600]="activeLayerId() === 'cities'"
                  [class.text-primary-content]="activeLayerId() === 'cities'"
                  [class.scale-105]="activeLayerId() === 'cities'"
                  [class.border]="true"
                  [class.border-transparent]="activeLayerId() === 'cities'"
                  [class.border-base-300]="activeLayerId() !== 'cities'"
                  [class.bg-base-100/50]="activeLayerId() !== 'cities'"
                  [class.backdrop-blur-sm]="activeLayerId() !== 'cities'"
                  [class.hover:border-primary/40]="activeLayerId() !== 'cities'"
                  [class.hover:bg-base-100]="activeLayerId() !== 'cities'"
                  [class.hover:-translate-y-1]="activeLayerId() !== 'cities'"
                  [class.hover:shadow-lg]="activeLayerId() !== 'cities'"
                  (click)="setActiveLayer('cities')"
                >
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                      <div
                        class="p-2 rounded-lg"
                        [class.bg-white/20]="activeLayerId() === 'cities'"
                        [class.bg-primary/10]="activeLayerId() !== 'cities'"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          [class.text-white]="activeLayerId() === 'cities'"
                          [class.text-primary]="activeLayerId() !== 'cities'"
                        >
                          <path
                            d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"
                          />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <span class="font-bold text-lg tracking-tight">Cities</span>
                    </div>
                    <label
                      class="swap swap-rotate z-10 btn btn-circle btn-sm btn-ghost"
                      [class.hover:bg-white/20]="activeLayerId() === 'cities'"
                      (click)="$event.stopPropagation()"
                    >
                      <input
                        type="checkbox"
                        [checked]="layerVisibility()['cities']"
                        (change)="toggleLayerVisibility('cities')"
                      />
                      <svg
                        class="swap-on fill-current w-5 h-5 opacity-90"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
                        />
                      </svg>
                      <svg
                        class="swap-off fill-current w-5 h-5 opacity-50"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z"
                        />
                      </svg>
                    </label>
                  </div>
                  <div class="mt-auto flex gap-2">
                    <button
                      class="btn btn-sm flex-1 font-semibold rounded-lg shadow-sm"
                      [class.btn-outline]="activeLayerId() !== 'cities'"
                      [class.bg-white]="activeLayerId() === 'cities'"
                      [class.text-primary]="activeLayerId() === 'cities'"
                      [class.border-none]="activeLayerId() === 'cities'"
                      [class.hover:bg-gray-100]="activeLayerId() === 'cities'"
                      (click)="fitToCities(); $event.stopPropagation()"
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
                        class="mr-1"
                      >
                        <path d="M15 3h6v6"></path>
                        <path d="M9 21H3v-6"></path>
                        <path d="M21 3l-7 7"></path>
                        <path d="M3 21l7-7"></path>
                      </svg>
                      Zoom
                    </button>
                    <button
                      class="btn btn-sm flex-1 font-semibold rounded-lg shadow-sm"
                      [class.btn-outline]="activeLayerId() !== 'cities'"
                      [class.bg-white]="activeLayerId() === 'cities'"
                      [class.text-primary]="activeLayerId() === 'cities'"
                      [class.border-none]="activeLayerId() === 'cities'"
                      [class.hover:bg-gray-100]="activeLayerId() === 'cities'"
                      (click)="toggleLayerVisibility('heatmap'); $event.stopPropagation()"
                    >
                      Heatmap {{ layerVisibility()['heatmap'] ? 'On' : 'Off' }}
                    </button>
                  </div>
                </div>

                <!-- Military Layer Card -->
                <div
                  class="rounded-2xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[140px]"
                  [class.shadow-[0_8px_30px_rgba(251,191,36,0.3)]]="activeLayerId() === 'military'"
                  [class.bg-gradient-to-br]="activeLayerId() === 'military'"
                  [class.from-warning]="activeLayerId() === 'military'"
                  [class.to-amber-500]="activeLayerId() === 'military'"
                  [class.text-warning-content]="activeLayerId() === 'military'"
                  [class.scale-105]="activeLayerId() === 'military'"
                  [class.border]="true"
                  [class.border-transparent]="activeLayerId() === 'military'"
                  [class.border-base-300]="activeLayerId() !== 'military'"
                  [class.bg-base-100/50]="activeLayerId() !== 'military'"
                  [class.backdrop-blur-sm]="activeLayerId() !== 'military'"
                  [class.hover:border-warning/40]="activeLayerId() !== 'military'"
                  [class.hover:bg-base-100]="activeLayerId() !== 'military'"
                  [class.hover:-translate-y-1]="activeLayerId() !== 'military'"
                  [class.hover:shadow-lg]="activeLayerId() !== 'military'"
                  (click)="setActiveLayer('military')"
                >
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                      <div
                        class="p-2 rounded-lg"
                        [class.bg-black/10]="activeLayerId() === 'military'"
                        [class.bg-warning/10]="activeLayerId() !== 'military'"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          [class.text-amber-900]="activeLayerId() === 'military'"
                          [class.text-warning]="activeLayerId() !== 'military'"
                        >
                          <path d="M12 2L2 7l10 5 10-5-10-5z" />
                          <path d="M2 17l10 5 10-5" />
                          <path d="M2 12l10 5 10-5" />
                        </svg>
                      </div>
                      <span class="font-bold text-lg tracking-tight"
                        >Military
                        <span
                          class="opacity-70 text-sm ml-1 font-mono bg-black/10 px-1.5 py-0.5 rounded-md"
                          >{{ militaryFeatures().length }}</span
                        ></span
                      >
                    </div>
                    <label
                      class="swap swap-rotate z-10 btn btn-circle btn-sm btn-ghost"
                      [class.hover:bg-black/10]="activeLayerId() === 'military'"
                      (click)="$event.stopPropagation()"
                    >
                      <input
                        type="checkbox"
                        [checked]="layerVisibility()['military']"
                        (change)="toggleLayerVisibility('military')"
                      />
                      <svg
                        class="swap-on fill-current w-5 h-5 opacity-90"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
                        />
                      </svg>
                      <svg
                        class="swap-off fill-current w-5 h-5 opacity-50"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z"
                        />
                      </svg>
                    </label>
                  </div>
                  <div class="mt-auto">
                    <button
                      class="btn btn-sm w-full font-semibold rounded-lg shadow-sm"
                      [disabled]="militaryFeatures().length === 0"
                      [class.btn-outline]="activeLayerId() !== 'military'"
                      [class.bg-white]="activeLayerId() === 'military'"
                      [class.text-amber-700]="activeLayerId() === 'military'"
                      [class.border-none]="activeLayerId() === 'military'"
                      [class.hover:bg-amber-50]="activeLayerId() === 'military'"
                      (click)="clearMilitary(); $event.stopPropagation()"
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
                        class="mr-1"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path
                          d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                        ></path>
                      </svg>
                      Clear All
                    </button>
                  </div>
                </div>

                <!-- Drawn Layer Card -->
                <div
                  class="rounded-2xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[140px]"
                  [class.shadow-[0_8px_30px_rgba(236,72,153,0.3)]]="
                    activeLayerId() === 'drawn-features'
                  "
                  [class.bg-gradient-to-br]="activeLayerId() === 'drawn-features'"
                  [class.from-secondary]="activeLayerId() === 'drawn-features'"
                  [class.to-pink-600]="activeLayerId() === 'drawn-features'"
                  [class.text-secondary-content]="activeLayerId() === 'drawn-features'"
                  [class.scale-105]="activeLayerId() === 'drawn-features'"
                  [class.border]="true"
                  [class.border-transparent]="activeLayerId() === 'drawn-features'"
                  [class.border-base-300]="activeLayerId() !== 'drawn-features'"
                  [class.bg-base-100/50]="activeLayerId() !== 'drawn-features'"
                  [class.backdrop-blur-sm]="activeLayerId() !== 'drawn-features'"
                  [class.hover:border-secondary/40]="activeLayerId() !== 'drawn-features'"
                  [class.hover:bg-base-100]="activeLayerId() !== 'drawn-features'"
                  [class.hover:-translate-y-1]="activeLayerId() !== 'drawn-features'"
                  [class.hover:shadow-lg]="activeLayerId() !== 'drawn-features'"
                  (click)="setActiveLayer('drawn-features')"
                >
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                      <div
                        class="p-2 rounded-lg"
                        [class.bg-white/20]="activeLayerId() === 'drawn-features'"
                        [class.bg-secondary/10]="activeLayerId() !== 'drawn-features'"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          [class.text-white]="activeLayerId() === 'drawn-features'"
                          [class.text-secondary]="activeLayerId() !== 'drawn-features'"
                        >
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </div>
                      <span class="font-bold text-lg tracking-tight"
                        >Drawn
                        <span
                          class="opacity-70 text-sm ml-1 font-mono bg-black/10 px-1.5 py-0.5 rounded-md text-white/90"
                          >{{ drawnCount() }}</span
                        ></span
                      >
                    </div>
                    <label
                      class="swap swap-rotate z-10 btn btn-circle btn-sm btn-ghost"
                      [class.hover:bg-white/20]="activeLayerId() === 'drawn-features'"
                      (click)="$event.stopPropagation()"
                    >
                      <input
                        type="checkbox"
                        [checked]="layerVisibility()['drawn-features']"
                        (change)="toggleLayerVisibility('drawn-features')"
                      />
                      <svg
                        class="swap-on fill-current w-5 h-5 opacity-90"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
                        />
                      </svg>
                      <svg
                        class="swap-off fill-current w-5 h-5 opacity-50"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z"
                        />
                      </svg>
                    </label>
                  </div>
                  <div class="mt-auto">
                    <button
                      class="btn btn-sm w-full font-semibold rounded-lg shadow-sm"
                      [disabled]="drawnCount() === 0"
                      [class.btn-outline]="activeLayerId() !== 'drawn-features'"
                      [class.bg-white]="activeLayerId() === 'drawn-features'"
                      [class.text-secondary]="activeLayerId() === 'drawn-features'"
                      [class.border-none]="activeLayerId() === 'drawn-features'"
                      [class.hover:bg-pink-50]="activeLayerId() === 'drawn-features'"
                      (click)="clearDrawnFeatures(); $event.stopPropagation()"
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
                        class="mr-1"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path
                          d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                        ></path>
                      </svg>
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contextual Tools Panel (Inside the Layer Management Card) -->
            <div
              class="bg-base-200/40 backdrop-blur-md p-6 border-t border-base-200/80 min-h-[140px] flex flex-col justify-center rounded-b-xl shadow-inner"
            >
              @if (activeLayerId() === 'military') {
                <div class="animation-fade-in">
                  <h3
                    class="text-sm font-bold text-base-content/60 uppercase tracking-wider mb-4 flex items-center gap-2"
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
                      class="text-warning"
                    >
                      <path
                        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                      />
                    </svg>
                    Tactical Tools
                  </h3>
                  <div class="flex flex-wrap gap-3">
                    <button
                      class="btn btn-warning shadow-md hover:shadow-lg transition-all"
                      (click)="addRandomSymbol()"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="mr-1"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Symbol
                    </button>
                    <button
                      class="btn btn-outline border-warning/50 hover:border-warning hover:bg-warning/10 text-base-content"
                      (click)="addEllipse()"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="mr-1 text-warning"
                      >
                        <ellipse cx="12" cy="12" rx="10" ry="6"></ellipse>
                      </svg>
                      Ellipse
                    </button>
                    <button
                      class="btn btn-outline border-warning/50 hover:border-warning hover:bg-warning/10 text-base-content"
                      (click)="addSector()"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="mr-1 text-warning"
                      >
                        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                        <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                      </svg>
                      Sector
                    </button>
                    <button
                      class="btn btn-outline border-warning/50 hover:border-warning hover:bg-warning/10 text-base-content"
                      (click)="addDonut()"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="mr-1 text-warning"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="4"></circle>
                      </svg>
                      Donut
                    </button>
                  </div>
                </div>
              }

              @if (activeLayerId() === 'cities') {
                <div class="animation-fade-in">
                  <h3
                    class="text-sm font-bold text-base-content/60 uppercase tracking-wider mb-4 flex items-center gap-2"
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
                      class="text-primary"
                    >
                      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                      <line x1="9" y1="3" x2="9" y2="18"></line>
                      <line x1="15" y1="6" x2="15" y2="21"></line>
                    </svg>
                    Quick Navigation
                  </h3>
                  <div class="flex flex-wrap gap-3">
                    <button
                      class="btn btn-outline border-primary/40 hover:border-primary hover:bg-primary/10 text-base-content shadow-sm"
                      (click)="jumpTo([2.17, 41.38], 12)"
                    >
                      Barcelona
                    </button>
                    <button
                      class="btn btn-outline border-primary/40 hover:border-primary hover:bg-primary/10 text-base-content shadow-sm"
                      (click)="jumpTo([-3.7, 40.42], 12)"
                    >
                      Madrid
                    </button>
                    <button
                      class="btn btn-outline border-primary/40 hover:border-primary hover:bg-primary/10 text-base-content shadow-sm"
                      (click)="jumpTo([-0.38, 39.47], 12)"
                    >
                      Valencia
                    </button>
                    <button
                      class="btn btn-outline border-primary/40 hover:border-primary hover:bg-primary/10 text-base-content shadow-sm"
                      (click)="jumpTo([-5.98, 37.39], 12)"
                    >
                      Sevilla
                    </button>
                    <div class="divider divider-horizontal mx-1"></div>
                    <button
                      class="btn btn-primary shadow-md hover:shadow-lg"
                      (click)="openRandomCityComponentPopup()"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="mr-1"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                      </svg>
                      Random Popup
                    </button>
                  </div>
                </div>
              }

              @if (activeLayerId() === 'drawn-features') {
                <div class="animation-fade-in text-center py-6">
                  <p
                    class="text-base-content/70 flex items-center justify-center gap-3 font-medium"
                  >
                    <span class="p-2 bg-secondary/10 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="text-secondary"
                      >
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                      </svg>
                    </span>
                    Use the floating toolbar on the map to start drawing sketches.
                  </p>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Telemetry Panel -->
        <div class="flex flex-col gap-6">
          <div class="card bg-base-100 shadow-xl border border-base-200/50 h-full">
            <div class="card-body p-6">
              <h2 class="card-title text-xl font-bold flex items-center gap-2 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-info"
                >
                  <path d="M2 12h4l2-9 5 18 3-10 5 3"></path>
                </svg>
                Telemetry
              </h2>

              <div class="stats stats-vertical shadow-sm border border-base-200/50 w-full mb-4">
                <div class="stat py-3">
                  <div class="stat-title text-xs font-bold uppercase">Center Coord</div>
                  <div class="stat-value text-lg font-mono tracking-tight mt-1">
                    {{ center()?.[0]?.toFixed(4) ?? '-' }}, {{ center()?.[1]?.toFixed(4) ?? '-' }}
                  </div>
                </div>
                <div class="stat py-3">
                  <div class="stat-title text-xs font-bold uppercase">Zoom Level</div>
                  <div class="stat-value text-lg font-mono tracking-tight text-info mt-1">
                    {{ zoom() | number: '1.1-2' }}
                  </div>
                </div>
              </div>

              <h3 class="text-sm font-bold text-base-content/60 uppercase tracking-wider mb-2 mt-4">
                Pointer Data
              </h3>
              <div
                class="bg-base-200 rounded-xl p-4 border border-base-300 font-mono text-sm shadow-inner flex-grow"
              >
                @if (lastClick(); as click) {
                  <div class="flex justify-between mb-2 pb-2 border-b border-base-300">
                    <span class="text-base-content/60">Lon/Lat:</span>
                    <span class="font-bold text-success"
                      >{{ click.coordinate?.[0]?.toFixed(4) }},
                      {{ click.coordinate?.[1]?.toFixed(4) }}</span
                    >
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/60">Screen X/Y:</span>
                    <span class="font-bold"
                      >{{ click.pixel?.[0] | number: '1.0-0' }}px,
                      {{ click.pixel?.[1] | number: '1.0-0' }}px</span
                    >
                  </div>
                } @else {
                  <div class="flex items-center justify-center h-full text-base-content/40 italic">
                    Waiting for map click...
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Package Info Footer -->
      <div class="mt-12 opacity-80 hover:opacity-100 transition-opacity duration-300">
        <h2 class="text-sm font-bold text-base-content/60 uppercase tracking-wider mb-4 ml-2">
          Modular Architecture
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            class="bg-gradient-to-r from-base-200 to-base-100 rounded-xl p-4 border-l-4 border-l-primary shadow-sm"
          >
            <code class="text-primary font-bold text-sm bg-primary/10 px-2 py-1 rounded"
              >@angular-helpers/openlayers/core</code
            >
            <p class="text-base-content/70 text-xs mt-2 font-medium">
              Map component, services, base types
            </p>
          </div>
          <div
            class="bg-gradient-to-r from-base-200 to-base-100 rounded-xl p-4 border-l-4 border-l-secondary shadow-sm"
          >
            <code class="text-secondary font-bold text-sm bg-secondary/10 px-2 py-1 rounded"
              >@angular-helpers/openlayers/layers</code
            >
            <p class="text-base-content/70 text-xs mt-2 font-medium">
              Tile, vector, image layer components
            </p>
          </div>
          <div
            class="bg-gradient-to-r from-base-200 to-base-100 rounded-xl p-4 border-l-4 border-l-accent shadow-sm"
          >
            <code class="text-accent font-bold text-sm bg-accent/10 px-2 py-1 rounded"
              >@angular-helpers/openlayers/controls</code
            >
            <p class="text-base-content/70 text-xs mt-2 font-medium">
              Zoom, attribution, scale, fullscreen
            </p>
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
  private measurementService = inject(MeasurementInteractionService);
  readonly interactionService = inject(OlInteractionService);
  protected basemaps = BASEMAPS;

  center = signal<[number, number]>([2.17, 41.38]);
  zoom = signal<number>(12);
  lastClick = signal<{ coordinate: [number, number]; pixel: [number, number] } | null>(null);
  activeBasemap = signal<string>('osm');

  // Interaction state - derived from the InteractionService natively
  selectActive = computed(() => this.interactionService.isActive('demo-select'));
  drawActive = computed(() => this.interactionService.isActive('demo-draw'));
  modifyActive = computed(() => this.interactionService.isActive('demo-modify'));
  drawType = signal<'Polygon' | 'LineString' | 'Point' | 'Circle'>('Polygon');

  measureActive = signal(false);
  measureType = signal<'Polygon' | 'LineString'>('LineString');

  // Count of drawn features (OL Draw manages the actual source directly)
  drawnCount = signal<number>(0);

  // Military features layer — driven by the military service helpers.
  militaryFeatures = signal<Feature[]>([]);

  // Layer visibility states (toggle with eye icon)
  layerVisibility = signal<Record<string, boolean>>({
    cities: true,
    heatmap: false,
    military: true,
    'drawn-features': true,
  });

  // Currently active/selected layer for visual feedback
  activeLayerId = signal<string | null>(null);

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

  toggleMeasure(): void {
    if (this.measureActive()) {
      this.measurementService.stopMeasuring();
      this.measureActive.set(false);
    } else {
      // Disable other interactions
      if (this.selectActive()) this.toggleSelect();
      if (this.drawActive()) this.toggleDraw();
      if (this.modifyActive()) this.toggleModify();

      this.measurementService.startMeasuring(this.measureType());
      this.measureActive.set(true);
    }
  }

  onMeasureTypeClick(type: 'Polygon' | 'LineString'): void {
    this.measureType.set(type);
    if (this.measureActive()) {
      this.measurementService.startMeasuring(type);
    }
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
    if (this.selectActive()) {
      this.interactionService.disableInteraction('demo-select');
    } else {
      if (this.measureActive()) this.toggleMeasure();
      this.interactionService.enableSelect('demo-select', {
        layers: ['cities', 'drawn-features'],
        multi: true,
      });
    }
  }

  toggleDraw(): void {
    if (this.drawActive()) {
      this.interactionService.disableInteraction('demo-draw');
    } else {
      if (this.measureActive()) this.toggleMeasure();
      this.interactionService.enableDraw('demo-draw', {
        type: this.drawType(),
        source: 'drawn-features',
      });
    }
  }

  toggleModify(): void {
    if (this.modifyActive()) {
      this.interactionService.disableInteraction('demo-modify');
    } else {
      if (this.measureActive()) this.toggleMeasure();
      // Enable select if not active (to select features to modify)
      if (!this.selectActive()) {
        this.toggleSelect();
      }
      this.interactionService.enableModify('demo-modify', {
        source: 'drawn-features',
        exclusive: false,
      });
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
   * Drop a random NATO friendly-infantry symbol on Madrid.
   * Uses milsymbol via dynamic ESM import (lazy loaded).
   */
  async addRandomSymbol(): Promise<void> {
    const symbol = await this.militaryService.createMilSymbol({
      sidc: 'SFGPUCI-----',
      position: [-3.7 + (Math.random() - 0.5) * 0.4, 40.42 + (Math.random() - 0.5) * 0.3],
      size: 36,
      uniqueDesignation: 'A1',
    });
    this.militaryFeatures.update((prev) => [...prev, symbol]);
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
    // Also clear from OL source since updateFeatures doesn't remove existing
    this.layerService.clearFeatures('military');
  }

  /** Toggle layer visibility by ID. */
  toggleLayerVisibility(layerId: string): void {
    const current = this.layerVisibility();
    const newVisibility = !current[layerId];
    this.layerVisibility.set({ ...current, [layerId]: newVisibility });
    this.layerService.setVisibility(layerId, newVisibility);
  }

  /** Set the active layer (visual feedback in UI). */
  setActiveLayer(layerId: string): void {
    this.activeLayerId.set(layerId);
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

    // Center the view on the popup location (use projected coordinates)
    this.mapService.animateView({ center: position, zoom: 12 });
  }
}
