// OlVectorLayerComponent

import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  contentChild,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import type { Feature, Style } from '@angular-helpers/openlayers/core';
import { OlLayerService } from '../services/layer.service';
import type { ClusterConfig, VectorLayerConfig } from '../models/layer.types';
import { OlClusterComponent } from './cluster.component';

@Component({
  selector: 'ol-vector-layer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlVectorLayerComponent {
  private layerService = inject(OlLayerService);
  private destroyRef = inject(DestroyRef);
  id = input.required<string>();
  features = input<Feature[]>([]);
  zIndex = input<number>(0);
  opacity = input<number>(1);
  visible = input<boolean>(true);
  style = input<Style | ((feature: Feature) => Style)>();
  cluster = input<ClusterConfig>();
  clusterComponent = contentChild(OlClusterComponent);

  constructor() {
    // Initialize layer after DOM is ready
    afterNextRender(() => {
      const clusterCmp = this.clusterComponent();
      const resolvedClusterConfig: ClusterConfig | undefined =
        this.cluster() ??
        (clusterCmp
          ? {
              enabled: true,
              distance: clusterCmp.distance(),
              minDistance: clusterCmp.minDistance(),
              showCount: clusterCmp.showCount(),
              featureStyle: clusterCmp.featureStyle(),
            }
          : undefined);

      this.layerService.addLayer({
        id: this.id(),
        type: 'vector',
        features: this.features(),
        zIndex: this.zIndex(),
        opacity: this.opacity(),
        visible: this.visible(),
        style: this.style(),
        cluster: resolvedClusterConfig,
      } as VectorLayerConfig);
    });

    // Effect to sync features when input changes
    effect(() => {
      const currentFeatures = this.features();
      // Only update if layer already exists (afterNextRender already created it)
      if (this.layerService.getLayer(this.id())) {
        this.layerService.updateFeatures(this.id(), currentFeatures);
      }
    });

    // Cleanup when component is destroyed
    this.destroyRef.onDestroy(() => {
      this.layerService.removeLayer(this.id());
    });
  }
}
