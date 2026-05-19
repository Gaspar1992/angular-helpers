import { animate, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  inputBinding,
  output,
  outputBinding,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OlMapComponent, OlMapService, type MapClickEvent } from '@angular-helpers/openlayers/core';
import { fromLonLat, transformExtent } from 'ol/proj';
import {
  OlVectorLayerComponent,
  OlHeatmapLayerComponent,
  OlWebGLVectorLayerComponent,
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
import type { BasemapConfig, LayerSwitcherItem } from '@angular-helpers/openlayers/controls';
import type { Feature } from '@angular-helpers/openlayers/core';

import { DemoCityCardComponent } from './components/demo-city-card.component';
import { FeatureInspectorComponent } from './components/feature-inspector.component';
import { MapTelemetryComponent } from './components/map-telemetry.component';

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
    OlGeolocationControlComponent,
    OlHeatmapLayerComponent,
    OlWebGLVectorLayerComponent,
    OlPopupComponent,
    OlTooltipDirective,
    FeatureInspectorComponent,
    MapTelemetryComponent,
  ],
  animations: [
    trigger('subMenu', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-10px)' }),
        animate(
          '200ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateX(0)' }),
        ),
      ]),
      transition(':leave', [
        animate(
          '150ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 0, transform: 'translateX(-10px)' }),
        ),
      ]),
    ]),
  ],
  styles: [
    `
      .map-stage-container {
        container: map-stage / inline-size;
      }

      .ol-demo-toolbar {
        display: flex;
        gap: var(--spacing-1-5);
        padding: var(--spacing-2);
        border-radius: var(--radius-2xl);
        font-family: var(--font-sans);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);

        background-color: color-mix(in oklch, var(--c-bg-surface), transparent 20%);
        border: 1px solid var(--c-border);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        z-index: 50;

        /* Adaptive UI via Container Queries */
        @container map-stage (inline-size < 550px) {
          gap: var(--spacing-1);
          padding: var(--spacing-1-5);

          .ol-demo-toolbar__btn {
            padding-inline: var(--spacing-2);
            span {
              display: none;
            }
          }
        }

        .ol-demo-toolbar__btn {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-2);
          justify-content: center;
          min-block-size: 40px;
          padding-inline: var(--spacing-4);
          background-color: transparent;
          color: var(--c-text-secondary);
          border: 1px solid transparent;
          border-radius: var(--radius-xl);
          font-weight: 700;
          font-size: var(--fs-sm);
          cursor: pointer;
          transition: all var(--t-fast);

          &:hover {
            background-color: var(--c-border-subtle);
            color: white;
          }

          &:focus-visible {
            outline: 2px solid var(--c-primary);
            outline-offset: 2px;
          }

          &:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }

          &.ol-demo-toolbar__btn--active {
            background-color: var(--c-primary);
            color: white;
            box-shadow: 0 4px 20px color-mix(in oklch, var(--c-primary), transparent 60%);

            &:hover {
              background-color: var(--c-primary-active);
            }
          }

          &.ol-demo-toolbar__btn--active-secondary {
            background-color: var(--c-primary-dim);
            color: var(--c-primary);
            border-color: color-mix(in oklch, var(--c-primary), transparent 70%);

            &:hover {
              background-color: color-mix(in oklch, var(--c-primary), transparent 75%);
            }
          }
        }

        .ol-demo-toolbar__divider {
          inline-size: 1px;
          margin-inline: var(--spacing-1);
          margin-block: var(--spacing-2);
          background-color: var(--c-border);
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
    MeasurementInteractionService,
    OlPopupService,
    { provide: ROTATE_CONTROL_MAP_SERVICE, useExisting: OlMapService },
  ],
  template: `
    <div class="max-width-container py-10 min-h-screen">
      <!-- Premium Header -->
      <header
        class="mb-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div class="flex items-center gap-4">
          <div
            class="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border border-base-content/5 rounded-2xl shadow-inner"
          >
            <span class="text-4xl sm:text-5xl drop-shadow-md">🗺️</span>
          </div>
          <div>
            <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-base-content m-0">
              OpenLayers <span class="text-base-content/40 font-medium">Demo</span>
            </h1>
            <p class="text-base sm:text-lg text-base-content/60 m-0 mt-2 font-medium">
              High-performance interactive maps with Angular Signals
            </p>
          </div>
        </div>
        <div class="flex flex-wrap justify-center sm:justify-end gap-2 max-w-[300px]">
          <span class="badge badge-primary font-black">Signals</span>
          <span class="badge badge-secondary font-black">Standalone</span>
          <span class="badge badge-accent font-black">WebGL</span>
        </div>
      </header>

      <!-- Main Map Stage -->
      <div
        class="map-stage-container relative w-full h-[650px] rounded-3xl overflow-hidden shadow-2xl border border-base-content/5 mb-8 bg-base-200"
      >
        <ol-map
          [center]="center()"
          [zoom]="zoom()"
          (viewChange)="center.set($event.center); zoom.set($event.zoom)"
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
            [blur]="40000"
            [radius]="20000"
            radiusUnit="meters"
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
                class="bg-transparent backdrop-blur-md border border-base-content/10 rounded-2xl shadow-xl p-5 min-w-[220px]"
              >
                <div class="font-black text-lg text-base-content mb-1">{{ info.name }}</div>
                <div class="divider my-2 opacity-10"></div>
                <div class="flex justify-between items-center text-sm">
                  <span class="text-base-content/40 font-bold uppercase text-[10px]"
                    >Population</span
                  >
                  <span class="font-mono font-bold text-primary">{{
                    info.population.toLocaleString()
                  }}</span>
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

          <!-- WebGL Performance Layer vs Standard Vector Layer -->
          @if (webglActive()) {
            <ol-webgl-vector-layer
              id="webgl-perf"
              [features]="webglFeatures()"
              [zIndex]="15"
              [flatStyle]="{
                'circle-radius': 5,
                'circle-fill-color': '#ff5252',
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 1,
              }"
            >
            </ol-webgl-vector-layer>
          } @else if (webglFeatures().length > 0) {
            <ol-vector-layer id="webgl-perf-canvas" [features]="webglFeatures()" [zIndex]="15">
            </ol-vector-layer>
          }
        </ol-map>

        <!-- Premium Glassmorphic Toolbar (floating over map) -->
        <div class="ol-demo-toolbar absolute bottom-6 left-1/2 -translate-x-1/2">
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
              stroke-width="2.5"
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
              stroke-width="2.5"
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
              stroke-width="2.5"
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
              stroke-width="2.5"
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
              class="ol-demo-toolbar__btn text-error hover:bg-error/10"
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
                stroke-width="3"
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
            <div @subMenu class="flex items-center">
              <div class="ol-demo-toolbar__divider"></div>
              <div class="flex flex-row gap-1 items-center px-1">
                <button
                  class="ol-demo-toolbar__btn"
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
                    stroke-width="2.5"
                  >
                    <path d="M12 2l10 6v10l-10 6-10-6V8z" />
                  </svg>
                </button>
                <button
                  class="ol-demo-toolbar__btn"
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
                    stroke-width="2.5"
                  >
                    <path d="M5 19L19 5" />
                  </svg>
                </button>
                <button
                  class="ol-demo-toolbar__btn"
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
                    stroke-width="3"
                  >
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </button>
                <button
                  class="ol-demo-toolbar__btn"
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
                    stroke-width="2.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </button>
                <button
                  class="ol-demo-toolbar__btn"
                  [class.ol-demo-toolbar__btn--active-secondary]="drawType() === 'Ellipse'"
                  (click)="onDrawTypeClick('Ellipse')"
                  title="Ellipse"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <ellipse cx="12" cy="12" rx="9" ry="5" />
                  </svg>
                </button>
                <button
                  class="ol-demo-toolbar__btn"
                  [class.ol-demo-toolbar__btn--active-secondary]="drawType() === 'Donut'"
                  (click)="onDrawTypeClick('Donut')"
                  title="Donut"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </button>
              </div>
            </div>
          }

          <!-- Measure Type Selector -->
          @if (measureActive()) {
            <div @subMenu class="flex items-center">
              <div class="ol-demo-toolbar__divider"></div>
              <div class="flex flex-row gap-1 items-center px-1">
                <button
                  class="ol-demo-toolbar__btn font-bold px-4"
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
                    stroke-width="2.5"
                  >
                    <path d="M12 2l10 6v10l-10 6-10-6V8z" />
                  </svg>
                  <span class="ml-1 text-[10px] uppercase">Area</span>
                </button>
                <button
                  class="ol-demo-toolbar__btn font-bold px-4"
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
                    stroke-width="2.5"
                  >
                    <path d="M5 19L19 5" />
                  </svg>
                  <span class="ml-1 text-[10px] uppercase">Dist</span>
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Floating Status Badges -->
        @if (interactionService.selectionCount() > 0 || drawnCount() > 0) {
          <div class="absolute top-4 left-4 z-[50] flex flex-col gap-2">
            @if (interactionService.selectionCount() > 0) {
              <div
                class="badge badge-primary shadow-xl font-bold px-4 py-4 rounded-xl border-none backdrop-blur-md bg-primary/90 text-base-content"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
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
                class="flex items-center gap-1 badge badge-secondary shadow-xl font-bold px-4 py-4 rounded-xl border-none backdrop-blur-md bg-secondary/90 text-base-content"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                {{ drawnCount() }} drawn
                <button
                  class="ml-2 btn btn-xs btn-circle btn-ghost min-h-0 h-6 w-6 bg-base-content/5 hover:bg-base-content/5 border-none text-base-content transition-all flex items-center justify-center p-0"
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
                    stroke-width="2.5"
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
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Interactive Layers Panel -->
        <div class="lg:col-span-2 flex flex-col gap-8">
          <div
            class="bg-base-200 border border-base-content/5 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div class="p-8">
              <h2 class="text-2xl font-black flex items-center gap-3 mb-8 text-base-content">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
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

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <!-- Cities Layer Card -->
                <div
                  class="rounded-2xl p-6 cursor-pointer transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[180px] border border-base-content/5 bg-base-content/5 hover:border-primary/40 hover:bg-white/[0.08]"
                  [class.ring-2]="activeLayerId() === 'cities'"
                  [class.ring-primary]="activeLayerId() === 'cities'"
                  (click)="setActiveLayer('cities')"
                >
                  <div class="flex justify-between items-start mb-2 relative z-10">
                    <div class="flex items-center gap-3">
                      <div class="p-3 rounded-xl bg-primary/10 text-primary shadow-inner">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path
                            d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"
                          />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <span class="font-bold text-xl text-base-content">Cities</span>
                    </div>
                    <label class="cursor-pointer">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-primary border-base-content/20"
                        [checked]="layerVisibility()['cities']"
                        (change)="toggleLayerVisibility('cities')"
                        (click)="$event.stopPropagation()"
                      />
                    </label>
                  </div>

                  <p
                    class="text-sm text-base-content/50 m-0 mb-6 relative z-10 leading-relaxed font-medium"
                  >
                    Vector layer with hover tooltips and dynamic population weighting.
                  </p>

                  <div class="flex gap-3 relative z-10">
                    <button
                      class="btn btn-sm btn-outline border-base-content/10 hover:bg-base-content/5 hover:border-base-content/20 text-base-content/70 font-bold px-4 rounded-xl transition-all"
                      (click)="fitToCities(); $event.stopPropagation()"
                    >
                      Fit View
                    </button>
                    <button
                      class="btn btn-sm transition-all font-bold px-4 rounded-xl shadow-lg"
                      [class.btn-primary]="layerVisibility()['heatmap']"
                      [class.btn-outline]="!layerVisibility()['heatmap']"
                      (click)="toggleLayerVisibility('heatmap'); $event.stopPropagation()"
                    >
                      Heatmap
                    </button>
                  </div>
                </div>

                <!-- Drawn Layer Card -->
                <div
                  class="rounded-2xl p-6 cursor-pointer transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[180px] border border-base-content/5 bg-base-content/5 hover:border-secondary/40 hover:bg-white/[0.08]"
                  [class.ring-2]="activeLayerId() === 'drawn-features'"
                  [class.ring-secondary]="activeLayerId() === 'drawn-features'"
                  (click)="setActiveLayer('drawn-features')"
                >
                  <div class="flex justify-between items-start mb-2 relative z-10">
                    <div class="flex items-center gap-3">
                      <div class="p-3 rounded-xl bg-secondary/10 text-secondary shadow-inner">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </div>
                      <span class="font-bold text-xl text-base-content"
                        >Sketches
                        <span class="text-xs ml-1 font-mono text-base-content/40 font-medium"
                          >({{ drawnCount() }})</span
                        >
                      </span>
                    </div>
                    <label class="cursor-pointer">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-secondary border-base-content/20"
                        [checked]="layerVisibility()['drawn-features']"
                        (change)="toggleLayerVisibility('drawn-features')"
                        (click)="$event.stopPropagation()"
                      />
                    </label>
                  </div>

                  <p
                    class="text-sm text-base-content/50 m-0 mb-6 relative z-10 leading-relaxed font-medium"
                  >
                    Programmatic interactions for drawing and modifying geometries.
                  </p>

                  <div class="flex gap-3 relative z-10">
                    <button
                      class="btn btn-sm btn-ghost text-error/70 hover:text-error hover:bg-error/10 font-bold px-4 rounded-xl transition-all"
                      [disabled]="drawnCount() === 0"
                      (click)="clearDrawnFeatures(); $event.stopPropagation()"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contextual Tools Panel -->
            @if (activeLayerId(); as layerId) {
              <div
                class="bg-base-content/5 p-8 border-t border-base-content/5 min-h-[140px] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                @if (layerId === 'cities') {
                  <div>
                    <h3
                      class="text-xs font-black uppercase tracking-widest text-base-content/30 mb-4 flex items-center gap-2 px-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                      >
                        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                        <line x1="9" y1="3" x2="9" y2="18"></line>
                        <line x1="15" y1="6" x2="15" y2="21"></line>
                      </svg>
                      Quick Navigation
                    </h3>
                    <div class="flex flex-wrap gap-3">
                      <button
                        class="btn btn-sm btn-outline border-base-content/5 hover:bg-base-content/5 text-base-content/70 font-bold px-5 rounded-xl transition-all"
                        (click)="jumpTo([2.17, 41.38], 12)"
                      >
                        Barcelona
                      </button>
                      <button
                        class="btn btn-sm btn-outline border-base-content/5 hover:bg-base-content/5 text-base-content/70 font-bold px-5 rounded-xl transition-all"
                        (click)="jumpTo([-3.7, 40.42], 12)"
                      >
                        Madrid
                      </button>
                      <button
                        class="btn btn-sm btn-outline border-base-content/5 hover:bg-base-content/5 text-base-content/70 font-bold px-5 rounded-xl transition-all"
                        (click)="jumpTo([-0.38, 39.47], 12)"
                      >
                        Valencia
                      </button>
                      <div class="divider divider-horizontal mx-1 opacity-5"></div>
                      <button
                        class="btn btn-sm btn-primary font-black px-8 rounded-xl shadow-lg shadow-primary/20 transition-all"
                        (click)="openRandomCityComponentPopup()"
                      >
                        Random Popup
                      </button>
                    </div>
                  </div>
                } @else if (layerId === 'drawn-features') {
                  <div class="text-center">
                    <p
                      class="text-base-content/40 flex items-center justify-center gap-3 font-medium"
                    >
                      <span
                        class="p-3 bg-secondary/10 rounded-2xl shadow-inner text-secondary border border-secondary/20"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </span>
                      Use the floating toolbar on the map to start drawing sketches.
                    </p>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Telemetry Panel -->
        <div class="flex flex-col gap-8">
          <!-- Property Inspector -->
          <app-feature-inspector
            [selectedFeatures]="interactionService.selectedFeatures()"
            (updateStyle)="updateSelectedFeatureStyle($event.id, $event.updates)"
            (deselect)="clearSelection()"
          ></app-feature-inspector>

          <!-- Telemetry Panel -->
          <app-map-telemetry
            [center]="center()"
            [zoom]="zoom()"
            [lastClick]="lastClick()"
          ></app-map-telemetry>
        </div>
      </div>

      <!-- WebGL Performance Demo -->
      <div class="mt-16">
        <div
          class="bg-base-200 border border-base-content/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
        >
          <div class="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="160"
              height="160"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>

          <div
            class="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10"
          >
            <div class="max-w-xl">
              <h2 class="text-2xl font-black text-base-content mb-4 flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                Performance Benchmarking
              </h2>
              <p class="text-base-content/50 leading-relaxed font-medium">
                Stress-test the rendering engine by switching between
                <span class="text-base-content font-bold">Standard Canvas</span> and
                <span class="text-primary font-bold">WebGL GPU</span> acceleration. WebGL vertex
                shaders allow rendering 50,000+ features with zero main-thread lag.
              </p>
            </div>

            <div
              class="bg-base-content/5 p-8 rounded-[2rem] border border-base-content/5 shadow-inner flex flex-col sm:flex-row items-center gap-8"
            >
              <div class="space-y-4 min-w-[200px]">
                <div
                  class="flex justify-between text-[10px] font-black uppercase tracking-widest text-base-content/30"
                >
                  <span>Feature Density</span>
                  <span class="text-base-content font-bold"
                    >{{ webglPointCount() | number }} pts</span
                  >
                </div>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  [value]="webglPointCount()"
                  (input)="webglPointCount.set(+$any($event.target).value)"
                  class="range range-primary range-xs"
                />
              </div>

              <div class="divider divider-horizontal opacity-5 hidden sm:flex"></div>

              <div class="flex flex-col gap-4">
                <button
                  class="btn btn-primary font-black px-8 rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3 transition-all active:scale-95"
                  (click)="generateWebGLPoints()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                  Generate Data
                </button>
                <label
                  class="flex items-center gap-4 cursor-pointer group px-4 py-2.5 rounded-xl border transition-all shadow-sm duration-300"
                  [class.bg-primary/10]="webglActive()"
                  [class.border-primary/30]="webglActive()"
                  [class.shadow-lg]="webglActive()"
                  [class.shadow-primary/5]="webglActive()"
                  [class.bg-base-content/5]="!webglActive()"
                  [class.border-base-content/5]="!webglActive()"
                >
                  <span
                    class="text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                    [class.text-primary]="webglActive()"
                    [class.text-base-content/50]="!webglActive()"
                  >
                    @if (webglActive()) {
                      <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    }
                    GPU Active
                  </span>
                  <input
                    type="checkbox"
                    class="toggle toggle-primary"
                    [checked]="webglActive()"
                    (change)="webglActive.set(!webglActive())"
                  />
                </label>
              </div>
            </div>
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
  private measurementService = inject(MeasurementInteractionService);
  readonly interactionService = inject(OlInteractionService);
  private stateService = inject(InteractionStateService);

  protected basemaps = BASEMAPS;

  center = signal<[number, number]>([2.17, 41.38]);
  zoom = signal<number>(12);

  // WebGL Performance Demo state
  webglActive = signal<boolean>(false);
  webglPointCount = signal<number>(5000);
  webglFeatures = signal<Feature[]>([]);
  lastClick = signal<MapClickEvent | null>(null);
  activeBasemap = signal<string>('osm');

  // Interaction state - derived from the InteractionService natively
  selectActive = computed(() => this.interactionService.isActive('demo-select'));
  drawActive = computed(() => this.interactionService.isActive('demo-draw'));
  modifyActive = computed(() => this.interactionService.isActive('demo-modify'));
  drawType = signal<'Polygon' | 'LineString' | 'Point' | 'Circle' | 'Ellipse' | 'Donut'>('Polygon');

  measureActive = signal(false);
  measureType = signal<'Polygon' | 'LineString'>('LineString');

  // Count of drawn features (OL Draw manages the actual source directly)
  drawnCount = signal<number>(0);

  // Layer visibility states (derived from service for 2-way sync)
  layerVisibility = computed(() => {
    const visibility: Record<string, boolean> = {};
    this.layerService.layers().forEach((l) => {
      visibility[l.id] = l.visible;
    });
    // Add defaults for layers that might not be registered yet
    return {
      cities: true,
      heatmap: false,
      'drawn-features': true,
      ...visibility,
    };
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

    // Track selection changes for tactical logging
    effect(() => {
      const selected = this.interactionService.selectedFeatures();
      if (selected.length > 0) {
        const first = selected[0];
        const props = first.properties;
        if (props?.['tacticalType']) {
          // oxlint-disable-next-line no-console
          console.log(
            `[Tactical Selection] Type: ${props['tacticalType']}, Name: ${props['name'] || 'N/A'}, Faction: ${props['direction']}`,
          );
        }
      }
    });

    // Track drawn features count and apply default properties/styling on drawEnd
    this.interactionService.drawEnd$.subscribe((event) => {
      if (event.interactionId === 'demo-draw') {
        this.drawnCount.update((c) => c + 1);

        const feature = event.feature;
        feature.properties = {
          ...feature.properties,
          name: `Sketch #${this.drawnCount()}`,
          strokeColor: '#3b82f6',
          strokeWidth: 2,
          fillColor: '#3b82f6',
          fillOpacity: 0.2,
        };

        feature.style = {
          fill: { color: 'rgba(59, 130, 246, 0.2)' },
          stroke: { color: '#3b82f6', width: 2 },
        };

        // Update the underlying OpenLayers feature name and style once added to the source
        setTimeout(() => {
          const layer = this.layerService.getLayer('drawn-features') as any;
          if (layer) {
            const source = layer.getSource();
            if (source) {
              const olFeature = source.getFeatureById(feature.id);
              if (olFeature) {
                olFeature.set('name', feature.properties['name']);
                olFeature.set('__angular_helpers_style__', feature.style);
                olFeature.changed();
              }
            }
          }
        });
      }
    });
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

  onMapClick(event: MapClickEvent): void {
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
    this.setDrawType(type as 'Polygon' | 'LineString' | 'Point' | 'Circle' | 'Ellipse' | 'Donut');
  }

  setDrawType(type: 'Polygon' | 'LineString' | 'Point' | 'Circle' | 'Ellipse' | 'Donut'): void {
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

  updateSelectedFeatureStyle(
    featureId: string | number,
    updates: {
      name?: string;
      strokeColor?: string;
      strokeWidth?: number;
      fillColor?: string;
      fillOpacity?: number;
    },
  ): void {
    const layer = this.layerService.getLayer('drawn-features') as any;
    if (!layer) return;
    const source = layer.getSource();
    if (!source) return;

    const olFeature = source.getFeatureById(featureId);
    if (!olFeature) return;

    // Get current abstract style or initialize default
    const currentStyle = olFeature.get('__angular_helpers_style__') || {};
    const currentProps = olFeature.getProperties();

    const newName = updates.name !== undefined ? updates.name : currentProps['name'];
    const strokeColor =
      updates.strokeColor !== undefined
        ? updates.strokeColor
        : currentProps['strokeColor'] || '#3b82f6';
    const strokeWidth =
      updates.strokeWidth !== undefined
        ? updates.strokeWidth
        : currentProps['strokeWidth'] !== undefined
          ? currentProps['strokeWidth']
          : 2;
    const fillColor =
      updates.fillColor !== undefined ? updates.fillColor : currentProps['fillColor'] || '#3b82f6';
    const fillOpacity =
      updates.fillOpacity !== undefined
        ? updates.fillOpacity
        : currentProps['fillOpacity'] !== undefined
          ? currentProps['fillOpacity']
          : 0.2;

    // Parse Hex or RGB/RGBA to a clean RGBA for the OpenLayers fill color
    let finalFillColor = fillColor;
    if (fillColor.startsWith('rgb')) {
      const match = fillColor.match(/\d+/g);
      if (match && match.length >= 3) {
        finalFillColor = `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${fillOpacity})`;
      }
    } else {
      let hex = fillColor.replace('#', '');
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        finalFillColor = `rgba(${r}, ${g}, ${b}, ${fillOpacity})`;
      } else {
        finalFillColor = `rgba(59, 130, 246, ${fillOpacity})`;
      }
    }

    if (updates.name !== undefined) {
      olFeature.set('name', updates.name);
    }
    olFeature.set('strokeColor', strokeColor);
    olFeature.set('strokeWidth', strokeWidth);
    olFeature.set('fillColor', fillColor);
    olFeature.set('fillOpacity', fillOpacity);

    const updatedStyle = {
      fill: { color: finalFillColor },
      stroke: { color: strokeColor, width: strokeWidth },
    };

    olFeature.set('__angular_helpers_style__', updatedStyle);
    olFeature.changed(); // Trigger style redraw

    // Update selection state reactively in stateService so Inspector updates
    const selected = [...this.interactionService.selectedFeatures()];
    const index = selected.findIndex((f) => f.id === featureId);
    if (index !== -1) {
      selected[index] = {
        ...selected[index],
        properties: {
          ...selected[index].properties,
          name: newName,
          strokeColor,
          strokeWidth,
          fillColor,
          fillOpacity,
        },
        style: updatedStyle,
      };
      this.stateService.setSelectedFeatures(selected);
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

  /** Toggle layer visibility by ID. */
  toggleLayerVisibility(id: string): void {
    this.layerService.toggleVisibility(id);
  }

  /** Generate random points for WebGL performance demonstration */
  generateWebGLPoints(): void {
    const count = this.webglPointCount();
    const features: Feature[] = [];
    const [lon, lat] = this.center();

    for (let i = 0; i < count; i++) {
      features.push({
        id: `webgl-${i}`,
        geometry: {
          type: 'Point',
          coordinates: [lon + (Math.random() - 0.5) * 2, lat + (Math.random() - 0.5) * 2],
        },
        properties: {
          index: i,
          type: Math.random() > 0.5 ? 'alert' : 'normal',
        },
      });
    }
    this.webglFeatures.set(features);
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
