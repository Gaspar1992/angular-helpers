// OlWebGLVectorLayerComponent
// GPU-accelerated vector layer for large datasets (10k+ features).
// Uses FlatStyleLike instead of ol/style/Style. Must be manually disposed.

import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import type { Feature } from '@angular-helpers/openlayers/core';
import { featureToOlFeature, OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import VectorSource from 'ol/source/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import type { FlatStyleLike } from 'ol/style/flat';
import FeatureFormat from 'ol/format/Feature';
import type { AutoFitOptions, VectorSourceConfig } from '../models/layer.types';
import { resolveVectorSourceConfig } from '../utils/source-builders.util';

export const DEFAULT_WEBGL_FLAT_STYLE: FlatStyleLike = {
  'circle-radius': 5,
  'circle-fill-color': '#3b82f6',
};

/**
 * GPU-accelerated vector layer for rendering large datasets.
 *
 * Important: Uses WebGL 2 for rendering. Styles must be provided as
 * `FlatStyleLike` objects (not `ol/style/Style` instances).
 * Hit detection is disabled by default for performance.
 *
 * @usageNotes
 * ```html
 * <ol-webgl-vector-layer
 *   id="big-dataset"
 *   [features]="largeDataset()"
 *   [flatStyle]="{
 *     'circle-radius': 6,
 *     'circle-fill-color': ['match', ['get', 'type'], 'alert', 'red', 'blue'],
 *     'stroke-color': '#333',
 *     'stroke-width': 1
 *   }"
 *   [disableHitDetection]="true">
 * </ol-webgl-vector-layer>
 * ```
 */
@Component({
  selector: 'ol-webgl-vector-layer',
  template: '',
})
export class OlWebGLVectorLayerComponent {
  private mapService = inject(OlMapService);
  private zoneHelper = inject(OlZoneHelper);
  private destroyRef = inject(DestroyRef);

  /** Unique layer identifier */
  id = input.required<string>();
  /** Polymorphic vector source configuration */
  source = input<VectorSourceConfig | string | Feature[] | undefined>(undefined);
  /** Features to render */
  features = input<Feature[]>([]);
  /** Remote URL */
  url = input<string>();
  /** Format specification */
  format = input<'geojson' | 'topojson' | 'kml' | FeatureFormat>();
  /** Data coordinate projection */
  coordinateProjection = input<string>('EPSG:4326');
  /** Auto fit options */
  autoFit = input<boolean | AutoFitOptions>(false);
  /** WebGL flat style (defaults to a 5px blue circle if not specified) */
  flatStyle = input<FlatStyleLike>(DEFAULT_WEBGL_FLAT_STYLE);
  /** Z-index for layer ordering */
  zIndex = input<number>(0);
  /** Opacity (0–1) */
  opacity = input<number>(1);
  /** Layer visibility */
  visible = input<boolean>(true);
  /** Disable hit detection for better performance (default: true) */
  disableHitDetection = input<boolean>(true);
  /** Style variables for dynamic expressions (e.g. `['var', 'threshold']`) */
  variables = input<Record<string, string | number | boolean | number[]>>();

  readonly resolvedSourceConfig = computed<VectorSourceConfig>(() =>
    resolveVectorSourceConfig(this.source(), {
      features: this.features(),
      url: this.url(),
      format: this.format(),
      coordinateProjection: this.coordinateProjection(),
      autoFit: this.autoFit(),
    }),
  );

  private layer: WebGLVectorLayer | null = null;
  private vectorSource = new VectorSource();

  constructor() {
    afterNextRender(() => {
      const map = this.mapService.getMap();
      if (!map) return;

      this.syncFeatures(this.features());

      try {
        this.layer = new WebGLVectorLayer({
          source: this.vectorSource,
          style: this.flatStyle(),
          visible: this.visible(),
          opacity: this.opacity(),
          zIndex: this.zIndex(),
          disableHitDetection: this.disableHitDetection(),
          ...(this.variables() ? { variables: this.variables() } : {}),
        });

        this.layer.set('id', this.id());
        map.addLayer(this.layer);
      } catch {
        // WebGL Vector Layer failed to initialize (e.g., not supported by browser)
      }
    });

    // Reactive feature sync
    effect(() => {
      const currentFeatures = this.features();
      if (this.layer) {
        this.syncFeatures(currentFeatures);
      }
    });

    // Reactive style updates
    effect(() => {
      this.layer?.setStyle(this.flatStyle());
    });

    effect(() => {
      this.layer?.setOpacity(this.opacity());
    });

    effect(() => {
      this.layer?.setVisible(this.visible());
    });

    effect(() => {
      this.layer?.setZIndex(this.zIndex());
    });

    effect(() => {
      const vars = this.variables();
      if (vars && this.layer) {
        this.layer.updateStyleVariables(vars);
      }
    });

    // CRITICAL: WebGL layers must be manually disposed
    this.destroyRef.onDestroy(() => {
      const map = this.mapService.getMap();
      this.zoneHelper.runOutsideAngular(() => {
        if (map && this.layer) {
          map.removeLayer(this.layer);
        }
        if (this.vectorSource) {
          this.vectorSource.clear(true);
          this.vectorSource.dispose();
        }
        if (this.layer) {
          try {
            this.layer.dispose();
          } catch {
            // Ignore WebGL layer disposal errors (e.g., reading 'deleteBuffer' if renderer not fully initialized)
          }
        }
      });
    });
  }

  /**
   * Imperatively update style variables without triggering Angular change detection.
   * Ideal for 60FPS animations (e.g., linked to OlTimeService) where you don't want
   * to use the declarative [variables] input.
   */
  updateVariables(vars: Record<string, string | number | boolean | number[]>): void {
    if (this.layer) {
      this.layer.updateStyleVariables(vars);
    }
  }

  private syncFeatures(features: Feature[]): void {
    this.vectorSource.clear();
    if (!features?.length) return;

    const sourceProjection = this.coordinateProjection();
    const olFeatures = features.map((feature) =>
      featureToOlFeature(feature, {
        sourceProjection,
        targetProjection: 'EPSG:3857',
      }),
    );

    this.vectorSource.addFeatures(olFeatures);
  }
}
