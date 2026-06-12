// OlWebGLTileLayerComponent
// GPU-accelerated tile layer with style expressions for color manipulation.

import { afterNextRender, Component, DestroyRef, effect, inject, input } from '@angular/core';
import { OlMapService } from '@angular-helpers/openlayers/core';
import WebGLTileLayer from 'ol/layer/WebGLTile';
import type { Style as WebGLTileStyle } from 'ol/layer/WebGLTile';
import WebGLVectorTileLayer from 'ol/layer/WebGLVectorTile';
import type { FlatStyleLike } from 'ol/style/flat';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';

/**
 * GPU-accelerated tile layer with color/brightness/contrast expressions.
 *
 * Supports the same tile sources as `ol-tile-layer` but renders via WebGL,
 * enabling GPU-powered color manipulation (brightness, contrast, saturation, gamma).
 *
 * @usageNotes
 * ```html
 * <ol-webgl-tile-layer
 *   id="satellite-webgl"
 *   source="xyz"
 *   [url]="'https://server.arcgisonline.com/.../{z}/{y}/{x}'"
 *   [tileStyle]="{ brightness: 0.1, contrast: 0.2 }">
 * </ol-webgl-tile-layer>
 * ```
 */
@Component({
  selector: 'ol-webgl-tile-layer',
  template: '',
})
export class OlWebGLTileLayerComponent {
  private mapService = inject(OlMapService);
  private destroyRef = inject(DestroyRef);

  /** Unique layer identifier */
  id = input.required<string>();
  /** Tile source type */
  source = input.required<'osm' | 'xyz' | 'mvt'>();
  /** Tile URL template (required for 'xyz' and 'mvt') */
  url = input<string>();
  /** Attribution text */
  attributions = input<string | string[]>();
  /** WebGL tile style (raster expressions) or flat style (MVT) */
  tileStyle = input<WebGLTileStyle | FlatStyleLike>();
  /** Z-index for layer ordering */
  zIndex = input<number>(0);
  /** Opacity (0–1) */
  opacity = input<number>(1);
  /** Layer visibility */
  visible = input<boolean>(true);
  /** Preload low-res tiles up to this many zoom levels */
  preload = input<number>(0);
  /** Style variables for dynamic expressions (e.g. `['var', 'brightness']`) */
  variables = input<Record<string, string | number | boolean | number[]>>();

  private layer: WebGLTileLayer | WebGLVectorTileLayer<any, any> | null = null;

  constructor() {
    afterNextRender(() => {
      const map = this.mapService.getMap();
      if (!map) return;

      let tileSource;
      switch (this.source()) {
        case 'mvt':
          tileSource = new VectorTileSource({
            format: new MVT(),
            url: this.url(),
            attributions: this.attributions(),
          });
          this.layer = new WebGLVectorTileLayer({
            source: tileSource as any,
            visible: this.visible(),
            opacity: this.opacity(),
            zIndex: this.zIndex(),
            style: (this.tileStyle() as FlatStyleLike) || {},
            ...(this.variables() ? { variables: this.variables() } : {}),
          });
          break;
        case 'xyz':
          tileSource = new XYZ({
            url: this.url(),
            attributions: this.attributions(),
          });
          this.layer = new WebGLTileLayer({
            source: tileSource as any,
            visible: this.visible(),
            opacity: this.opacity(),
            zIndex: this.zIndex(),
            preload: this.preload(),
            ...(this.tileStyle() ? { style: this.tileStyle() as WebGLTileStyle } : {}),
            ...(this.variables() ? { variables: this.variables() } : {}),
          });
          break;
        case 'osm':
        default:
          tileSource = new OSM({
            attributions: this.attributions(),
          });
          this.layer = new WebGLTileLayer({
            source: tileSource as any,
            visible: this.visible(),
            opacity: this.opacity(),
            zIndex: this.zIndex(),
            preload: this.preload(),
            ...(this.tileStyle() ? { style: this.tileStyle() as WebGLTileStyle } : {}),
            ...(this.variables() ? { variables: this.variables() } : {}),
          });
          break;
      }

      if (this.layer) {
        this.layer.set('id', this.id());
        map.addLayer(this.layer as any);
      }
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
      const style = this.tileStyle();
      if (style && this.layer) {
        if (this.source() === 'mvt') {
          (this.layer as WebGLVectorTileLayer).setStyle(style as FlatStyleLike);
        } else {
          (this.layer as WebGLTileLayer).setStyle(style as WebGLTileStyle);
        }
      }
    });

    effect(() => {
      const vars = this.variables();
      if (vars && this.layer) {
        this.layer.updateStyleVariables(vars as any);
      }
    });

    // WebGL tile layers also need manual dispose
    this.destroyRef.onDestroy(() => {
      const map = this.mapService.getMap();
      if (map && this.layer) {
        map.removeLayer(this.layer);
        this.layer.dispose();
      }
    });
  }

  /**
   * Imperatively update style variables without triggering Angular change detection.
   * Ideal for 60FPS animations where you don't want to use the declarative [variables] input.
   */
  updateVariables(vars: Record<string, string | number | boolean | number[]>): void {
    if (this.layer) {
      this.layer.updateStyleVariables(vars as any);
    }
  }
}
