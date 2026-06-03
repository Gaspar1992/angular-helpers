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
import { Feature } from '@angular-helpers/openlayers/core';
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
  url = input<string>();
  format = input<'geojson' | 'topojson' | 'kml'>();
  zIndex = input<number>(0);
  opacity = input<number>(1);
  visible = input<boolean>(true);
  style = input<any | ((feature: Feature, resolution: number) => any)>();
  cluster = input<ClusterConfig>();
  clusterComponent = contentChild(OlClusterComponent);
  coordinateProjection = input<string>('EPSG:4326');

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
              spiderfyOnSelect: clusterCmp.spiderfyOnSelect(),
              onSpiderfyClick: (f) => clusterCmp.spiderfyClick.emit(f),
            }
          : undefined);

      this.layerService.addLayer({
        id: this.id(),
        type: 'vector',
        features: this.features(),
        url: this.url(),
        format: this.format(),
        zIndex: this.zIndex(),
        opacity: this.opacity(),
        visible: this.visible(),
        style: this.style(),
        cluster: resolvedClusterConfig,
        coordinateProjection: this.coordinateProjection(),
      } as VectorLayerConfig);
    });

    // Effect to sync features when input changes
    effect(() => {
      const currentFeatures = this.features();
      if (this.layerService.getLayer(this.id())) {
        this.layerService.updateFeatures(this.id(), currentFeatures);
      }
    });

    effect(() => {
      if (this.layerService.getLayer(this.id())) {
        this.layerService.updateVectorLayerConfig(this.id(), {
          url: this.url(),
          format: this.format(),
          coordinateProjection: this.coordinateProjection(),
        });
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

    // Reactive cluster distance updates
    effect(() => {
      const clusterCmp = this.clusterComponent();
      if (clusterCmp) {
        const dist = clusterCmp.distance();
        const minDst = clusterCmp.minDistance();
        // Since we are inside effect, these will trigger when distance changes
        this.layerService.setClusterDistance(this.id(), dist);
        this.layerService.setClusterMinDistance(this.id(), minDst);
      }
    });

    // Cleanup when component is destroyed
    this.destroyRef.onDestroy(() => {
      this.layerService.removeLayer(this.id());
    });
  }
}
