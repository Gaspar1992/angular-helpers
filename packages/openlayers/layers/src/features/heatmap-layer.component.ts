import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { OlMapService, type Feature } from '@angular-helpers/openlayers/core';
import { OlLayerService } from '../services/layer.service';
import type { HeatmapLayerConfig } from '../models/layer.types';

@Component({
  selector: 'ol-heatmap-layer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlHeatmapLayerComponent {
  private layerService = inject(OlLayerService);
  private mapService = inject(OlMapService);
  private destroyRef = inject(DestroyRef);

  id = input.required<string>();
  features = input<Feature[]>([]);
  zIndex = input<number>(0);
  opacity = input<number>(1);
  visible = input<boolean>(true);

  blur = input<number>(15);
  radius = input<number>(8);
  /** Unit for radius and blur: 'pixels' (default) or 'meters' */
  radiusUnit = input<'pixels' | 'meters'>('pixels');
  weight = input<string | ((feature: Feature) => number)>();

  /** Computed radius in pixels based on current resolution if unit is 'meters' */
  private scaledRadius = computed(() => {
    const r = this.radius();
    if (this.radiusUnit() === 'pixels') return r;
    return r / this.mapService.resolution();
  });

  /** Computed blur in pixels based on current resolution if unit is 'meters' */
  private scaledBlur = computed(() => {
    const b = this.blur();
    if (this.radiusUnit() === 'pixels') return b;
    return b / this.mapService.resolution();
  });

  constructor() {
    afterNextRender(() => {
      this.layerService.addLayer({
        id: this.id(),
        type: 'heatmap',
        features: this.features(),
        zIndex: this.zIndex(),
        opacity: this.opacity(),
        visible: this.visible(),
        blur: this.scaledBlur(),
        radius: this.scaledRadius(),
        weight: this.weight(),
      } as HeatmapLayerConfig);
    });

    effect(() => {
      const currentFeatures = this.features();
      if (this.layerService.getLayer(this.id())) {
        this.layerService.updateFeatures(this.id(), currentFeatures);
      }
    });

    effect(() => {
      this.layerService.setOpacity(this.id(), this.opacity());
    });

    effect(() => {
      this.layerService.setVisibility(this.id(), this.visible());
    });

    effect(() => {
      this.layerService.setZIndex(this.id(), this.zIndex());
    });

    effect(() => {
      this.layerService.setHeatmapProperties(this.id(), {
        blur: this.scaledBlur(),
        radius: this.scaledRadius(),
        weight: this.weight(),
      });
    });

    this.destroyRef.onDestroy(() => {
      this.layerService.removeLayer(this.id());
    });
  }
}
