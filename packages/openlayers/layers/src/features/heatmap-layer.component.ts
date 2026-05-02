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
import { OlLayerService } from '../services/layer.service';
import type { HeatmapLayerConfig } from '../models/layer.types';

@Component({
  selector: 'ol-heatmap-layer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlHeatmapLayerComponent {
  private layerService = inject(OlLayerService);
  private destroyRef = inject(DestroyRef);

  id = input.required<string>();
  features = input<Feature[]>([]);
  zIndex = input<number>(0);
  opacity = input<number>(1);
  visible = input<boolean>(true);

  blur = input<number>(15);
  radius = input<number>(8);
  weight = input<string | ((feature: Feature) => number)>();

  constructor() {
    afterNextRender(() => {
      this.layerService.addLayer({
        id: this.id(),
        type: 'heatmap',
        features: this.features(),
        zIndex: this.zIndex(),
        opacity: this.opacity(),
        visible: this.visible(),
        blur: this.blur(),
        radius: this.radius(),
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
        blur: this.blur(),
        radius: this.radius(),
        weight: this.weight(),
      });
    });

    this.destroyRef.onDestroy(() => {
      this.layerService.removeLayer(this.id());
    });
  }
}
