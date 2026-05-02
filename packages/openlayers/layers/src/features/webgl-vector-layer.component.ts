// OlWebGLVectorLayerComponent
// GPU-accelerated vector layer for large datasets (10k+ features).
// Uses FlatStyleLike instead of ol/style/Style. Must be manually disposed.

import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import type { Feature } from '@angular-helpers/openlayers/core';
import { OlMapService } from '@angular-helpers/openlayers/core';
import VectorSource from 'ol/source/Vector';
import OLFeature from 'ol/Feature';
import { LineString, Point, Polygon, Circle as CircleGeom } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import type { FlatStyleLike } from 'ol/style/flat';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlWebGLVectorLayerComponent {
  private mapService = inject(OlMapService);
  private destroyRef = inject(DestroyRef);

  /** Unique layer identifier */
  id = input.required<string>();
  /** Features to render */
  features = input<Feature[]>([]);
  /** WebGL flat style (required — no default provided) */
  flatStyle = input.required<FlatStyleLike>();
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

  private layer: WebGLVectorLayer | null = null;
  private vectorSource = new VectorSource();

  constructor() {
    afterNextRender(() => {
      const map = this.mapService.getMap();
      if (!map) return;

      this.syncFeatures(this.features());

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
      if (map && this.layer) {
        map.removeLayer(this.layer);
        this.layer.dispose();
      }
    });
  }

  private syncFeatures(features: Feature[]): void {
    this.vectorSource.clear();
    if (!features?.length) return;

    const olFeatures = features.map((feature) => {
      const geom = feature.geometry;
      let geometry;

      if (!geom.coordinates) {
        geometry = new Point([0, 0]);
      } else if (geom.type === 'Point') {
        geometry = new Point(fromLonLat(geom.coordinates as [number, number]));
      } else if (geom.type === 'LineString') {
        geometry = new LineString(
          (geom.coordinates as [number, number][]).map((c) => fromLonLat(c)),
        );
      } else if (geom.type === 'Polygon') {
        geometry = new Polygon(
          (geom.coordinates as [number, number][][]).map((ring) => ring.map((c) => fromLonLat(c))),
        );
      } else if (geom.type === 'Circle') {
        const center = fromLonLat(geom.coordinates as [number, number]);
        geometry = new CircleGeom(center, (geom as { radius?: number }).radius ?? 1000);
      } else {
        geometry = new Point([0, 0]);
      }

      const olFeature = new OLFeature({
        geometry,
        ...feature.properties,
      });
      olFeature.setId(feature.id);
      return olFeature;
    });

    this.vectorSource.addFeatures(olFeatures);
  }
}
