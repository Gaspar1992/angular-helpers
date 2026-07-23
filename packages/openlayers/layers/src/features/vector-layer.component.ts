// OlVectorLayerComponent

import {
  afterNextRender,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { type Feature, OlMapService } from '@angular-helpers/openlayers/core';
import FeatureFormat from 'ol/format/Feature';
import { OlLayerService } from '../services/layer.service';
import type {
  AutoFitOptions,
  ClusterConfig,
  VectorLayerConfig,
  VectorSourceConfig,
} from '../models/layer.types';
import { OlClusterComponent } from './cluster.component';

@Component({
  selector: 'ol-vector-layer',
  template: '',
})
export class OlVectorLayerComponent {
  private layerService = inject(OlLayerService);
  private mapService = inject(OlMapService);
  private destroyRef = inject(DestroyRef);
  id = input.required<string>();
  source = input<VectorSourceConfig | string | Feature[] | undefined>(undefined);
  features = input<Feature[] | undefined>(undefined);
  url = input<string>();
  format = input<'geojson' | 'topojson' | 'kml' | FeatureFormat>();
  zIndex = input<number>(0);
  opacity = input<number>(1);
  visible = input<boolean>(true);
  style = input<any | ((feature: Feature, resolution: number) => any)>();
  cluster = input<ClusterConfig>();
  clusterComponent = contentChild(OlClusterComponent);
  coordinateProjection = input<string>('EPSG:4326');
  autoFit = input<boolean | AutoFitOptions>(false);

  readonly resolvedSourceConfig = computed<VectorSourceConfig>(() => {
    const src = this.source();
    const fallback: VectorSourceConfig = {
      features: this.features(),
      url: this.url(),
      format: this.format(),
      coordinateProjection: this.coordinateProjection(),
      autoFit: this.autoFit(),
    };
    if (typeof src === 'string') {
      return { ...fallback, url: src };
    }
    if (Array.isArray(src)) {
      return { ...fallback, features: src };
    }
    if (src && typeof src === 'object') {
      return { ...fallback, ...src };
    }
    return fallback;
  });

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

      const config = this.resolvedSourceConfig();
      this.layerService.addLayer({
        id: this.id(),
        type: 'vector',
        features: config.features,
        url: config.url,
        format: config.format,
        zIndex: this.zIndex(),
        opacity: this.opacity(),
        visible: this.visible(),
        style: this.style(),
        cluster: resolvedClusterConfig,
        coordinateProjection: config.coordinateProjection,
        autoFit: config.autoFit,
      } as VectorLayerConfig);

      // Handle autoFit on initialization
      const autoFitActive = config.autoFit;
      if (autoFitActive) {
        const parsedOptions = typeof autoFitActive === 'object' ? autoFitActive : undefined;

        const setupFitListener = () => {
          const layer = this.layerService.getLayer(this.id());
          if (layer && 'getSource' in layer) {
            const source = (layer as any).getSource();
            if (source) {
              const vectorSource =
                'getSource' in source && typeof source.getSource === 'function'
                  ? source.getSource()
                  : source;

              if (vectorSource) {
                if (config.url) {
                  // Wait for features to load asynchronously
                  vectorSource.on('featuresloadend', () => {
                    this.layerService.fitToLayer(this.id(), parsedOptions);
                  });
                } else {
                  // Fit immediately for static features
                  this.layerService.fitToLayer(this.id(), parsedOptions);
                }
              }
            }
          }
        };

        const map = this.mapService.getMap();
        if (map) {
          setupFitListener();
        } else {
          this.mapService.onReady(() => {
            setupFitListener();
          });
        }
      }
    });

    // Effect to sync features when input changes
    effect(() => {
      const config = this.resolvedSourceConfig();
      const currentFeatures = config.features;
      if (currentFeatures === undefined && config.url) {
        return;
      }
      if (this.layerService.getLayer(this.id())) {
        this.layerService.updateFeatures(this.id(), currentFeatures);

        // Fit to layer reactively if autoFit is active
        const autoFitActive = config.autoFit;
        if (autoFitActive) {
          const parsedOptions = typeof autoFitActive === 'object' ? autoFitActive : undefined;
          queueMicrotask(() => {
            this.layerService.fitToLayer(this.id(), parsedOptions);
          });
        }
      }
    });

    effect(() => {
      const config = this.resolvedSourceConfig();
      if (this.layerService.getLayer(this.id())) {
        this.layerService.updateVectorLayerConfig(this.id(), {
          url: config.url,
          format: config.format,
          coordinateProjection: config.coordinateProjection,
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
